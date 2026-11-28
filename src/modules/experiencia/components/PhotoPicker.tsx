import { useCallback, useEffect, useRef, useState } from 'react'
import { Aviso, BTN_SECUNDARIO } from '@/modules/core/components/Aviso'
import { readDimensions } from '../utils/photoRules'
import {
  diagnosticarDimensionesPrueba,
  problemaFoto,
  TEXTO_FOTO,
  TRYON_ACCEPT,
  TRYON_MAX_MB,
  TRYON_MIN,
  validarArchivoPrueba,
} from '../utils/tryOnRules'
import { tryOnService } from '../services/tryOnService'
import { GuiaFotoButton } from './GuiaFotoDialog'

export interface UploadedPhoto {
  photoId: string
  previewUrl: string
  photoUrl?: string
}

interface FotoError { titulo?: string; texto: string }

interface PoseLandmarkerLike {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number,
  ) => { landmarks?: Array<Array<{ x: number; y: number; visibility?: number }>> }
  close: () => void
}

function measureAverageBrightness(source: CanvasImageSource): number | null {
  try {
    const c = document.createElement('canvas')
    c.width = 24
    c.height = 24
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(source, 0, 0, 24, 24)
    const data = ctx.getImageData(0, 0, 24, 24).data
    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    }
    return sum / (24 * 24)
  } catch {
    return null
  }
}

async function checkImageBrightness(url: string): Promise<number | null> {
  if (typeof Image === 'undefined') return null
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(measureAverageBrightness(img))
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function evaluateGuidedPose(
  landmarks: Array<{ x: number; y: number; visibility?: number }> | undefined,
  brightness: number | null,
): { ok: boolean; message: string } {
  if (brightness !== null && brightness < 42) {
    return { ok: false, message: 'Hay poca luz: busca mejor iluminación frontal.' }
  }
  if (!landmarks || landmarks.length < 29) {
    return { ok: false, message: 'No te detecto: párate de frente dentro de la guía.' }
  }

  const vis = (idx: number) => (landmarks[idx]?.visibility ?? 1) > 0.45
  const nose = landmarks[0]
  const lSh = landmarks[11]
  const rSh = landmarks[12]
  const lHip = landmarks[23]
  const rHip = landmarks[24]
  const lAnk = landmarks[27]
  const rAnk = landmarks[28]

  if (!vis(0) || !vis(11) || !vis(12)) {
    return { ok: false, message: 'No se ven tu cabeza y hombros: céntrate frente a la cámara.' }
  }
  if (!vis(23) || !vis(24) || !vis(27) || !vis(28)) {
    return { ok: false, message: 'Aléjate un poco hasta que se vea todo tu cuerpo (cabeza a pies).' }
  }

  const topY = nose.y
  const bottomY = Math.max(lAnk.y, rAnk.y)
  const bodySpan = bottomY - topY

  if (topY < 0.04 || bottomY > 0.98) {
    return { ok: false, message: 'Aléjate un paso para no cortar cabeza ni pies.' }
  }
  if (bodySpan < 0.48) {
    return { ok: false, message: 'Acércate un poco más para ocupar mejor el cuadro.' }
  }

  const centerX = (lSh.x + rSh.x + lHip.x + rHip.x) / 4
  if (centerX < 0.3 || centerX > 0.7) {
    return { ok: false, message: 'Muévete al centro de la silueta guía.' }
  }

  const shWidth = Math.abs(rSh.x - lSh.x)
  if (shWidth < 0.1) {
    return { ok: false, message: 'Ponte completamente de frente (no de perfil).' }
  }

  return { ok: true, message: '¡Postura correcta! Quédate quieto...' }
}

/**
 * RF-23: elegir o tomar la foto frontal, validarla, verla y subirla al endpoint autenticado.
 * La foto vive solo como URL temporal en memoria; nunca se guarda en localStorage.
 * Si la subida falla, se descarta la vista previa para no mostrar un estado falso.
 */
export function PhotoPicker({ photo, onUploaded, onConsentRequired }: {
  photo: UploadedPhoto | null
  onUploaded: (p: UploadedPhoto) => void
  /** El servidor pidió la autorización de la Ley 1581 antes de recibir la foto. */
  onConsentRequired?: () => void
}) {
  const gallery = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const ctrl = useRef<AbortController | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<PoseLandmarkerLike | null>(null)
  const loopTimerRef = useRef<number | null>(null)
  const goodSinceRef = useRef<number | null>(null)
  const autoCapturedRef = useRef(false)

  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<FotoError | null>(null)

  const [guidedOpen, setGuidedOpen] = useState(false)
  const [guidedError, setGuidedError] = useState<string | null>(null)
  const [poseOk, setPoseOk] = useState(false)
  const [poseHint, setPoseHint] = useState('Iniciando detección de postura...')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [poseEngineReady, setPoseEngineReady] = useState(false)

  useEffect(() => () => ctrl.current?.abort(), [])

  const stopGuidedCamera = useCallback(() => {
    if (loopTimerRef.current !== null) {
      window.clearInterval(loopTimerRef.current)
      loopTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    goodSinceRef.current = null
    autoCapturedRef.current = false
    setPoseOk(false)
    setCountdown(null)
    setGuidedOpen(false)
    setGuidedError(null)
  }, [])

  useEffect(() => () => {
    stopGuidedCamera()
    landmarkerRef.current?.close()
    landmarkerRef.current = null
  }, [stopGuidedCamera])

  const discard = (url: string | null) => { if (url) URL.revokeObjectURL(url); setPreview(null); setProgress(null) }

  const handle = useCallback(async (file: File | undefined) => {
    if (!file) return
    setError(null)
    const bad = validarArchivoPrueba(file)
    if (bad) { setError({ texto: bad }); return }
    const url = URL.createObjectURL(file)
    try {
      const { width, height } = await readDimensions(url)
      const diag = diagnosticarDimensionesPrueba(width, height)
      if (diag) {
        URL.revokeObjectURL(url)
        setError({ titulo: TEXTO_FOTO.dimensionesTitulo, texto: diag })
        return
      }
      const brightness = await checkImageBrightness(url)
      if (brightness !== null && brightness < 38) {
        URL.revokeObjectURL(url)
        setError({
          titulo: 'La foto está muy oscura',
          texto: 'Busca una foto con mejor iluminación frontal para que la IA reconozca bien tu cuerpo.',
        })
        return
      }
    } catch {
      URL.revokeObjectURL(url); setError({ texto: TEXTO_FOTO.ilegible }); return
    }
    setPreview(url)
    setProgress(0)
    ctrl.current = new AbortController()
    try {
      const res = await tryOnService.uploadPhoto(file, setProgress, ctrl.current.signal)
      setProgress(null)
      setPreview(null)
      onUploaded({ photoId: res.photoId, previewUrl: url, photoUrl: res.photoUrl || url })
    } catch (e) {
      discard(url)
      const p = problemaFoto(e)
      if (p.accion === 'consentimiento' && onConsentRequired) { onConsentRequired(); return }
      setError({ titulo: p.titulo, texto: p.texto })
    }
  }, [onConsentRequired, onUploaded])

  const captureGuidedPortrait = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480

    const targetRatio = 3 / 4
    let sw = vw
    let sh = vh
    if (vw / vh > targetRatio) {
      sw = Math.round(vh * targetRatio)
    } else {
      sh = Math.round(vw / targetRatio)
    }
    const sx = Math.round((vw - sw) / 2)
    const sy = Math.round((vh - sh) / 2)

    const outW = 720
    const outH = 960
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.translate(outW, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH)

    canvas.toBlob(
      (blob) => {
        stopGuidedCamera()
        if (!blob) return
        const file = new File([blob], `probador-guia-${Date.now()}.jpg`, { type: 'image/jpeg' })
        void handle(file)
      },
      'image/jpeg',
      0.92,
    )
  }, [handle, stopGuidedCamera])

  const startPoseLoop = useCallback(async () => {
    if (!landmarkerRef.current) {
      setPoseHint('Cargando detector de postura...')
      try {
        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
        )
        const modelAssetPath =
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
        try {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
        } catch {
          landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
        }
        setPoseEngineReady(true)
      } catch {
        setPoseEngineReady(false)
        setPoseHint('Detector automático no disponible. Encuádra tu cuerpo y usa "Capturar ahora".')
        return
      }
    } else {
      setPoseEngineReady(true)
    }

    if (loopTimerRef.current !== null) window.clearInterval(loopTimerRef.current)
    loopTimerRef.current = window.setInterval(() => {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      if (!video || !landmarker || video.readyState < 2 || autoCapturedRef.current) return

      const brightness = measureAverageBrightness(video)
      const res = landmarker.detectForVideo(video, performance.now())
      const evalResult = evaluateGuidedPose(res.landmarks?.[0], brightness)

      setPoseOk(evalResult.ok)
      setPoseHint(evalResult.message)

      if (evalResult.ok) {
        if (goodSinceRef.current === null) {
          goodSinceRef.current = Date.now()
        }
        const elapsed = Date.now() - goodSinceRef.current
        const remaining = Math.max(0, 3 - Math.floor(elapsed / 1000))
        setCountdown(remaining > 0 ? remaining : 1)
        if (elapsed >= 3000) {
          autoCapturedRef.current = true
          setCountdown(null)
          captureGuidedPortrait()
        }
      } else {
        goodSinceRef.current = null
        setCountdown(null)
      }
    }, 150)
  }, [captureGuidedPortrait])

  const openGuidedCamera = async () => {
    setError(null)
    setGuidedError(null)
    goodSinceRef.current = null
    autoCapturedRef.current = false
    setPoseOk(false)
    setCountdown(null)
    setPoseHint('Encuádra tu cuerpo completo dentro de la silueta...')

    if (!navigator.mediaDevices?.getUserMedia) {
      camera.current?.click()
      return
    }
    setGuidedOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      void startPoseLoop()
    } catch {
      setGuidedError('No se pudo abrir la cámara. Verifica los permisos del navegador o sube tu foto desde la galería.')
    }
  }

  const cancel = () => { ctrl.current?.abort(); discard(preview); setError({ texto: 'Subida cancelada.' }) }
  const shown = preview ?? photo?.previewUrl ?? null
  const uploading = progress !== null

  const frameBorderClass = poseOk
    ? 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.4)]'
    : 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)]'

  const guideStroke = poseOk ? 'rgba(52,211,153,0.9)' : 'rgba(244,63,94,0.85)'

  return (
    <div className="@container">
      {!shown ? (
        /* Sin foto: la subida es lo principal de la tarjeta */
        <div
          onDragOver={(e) => { e.preventDefault() }}
          onDrop={(e) => { e.preventDefault(); if (!uploading) handle(e.dataTransfer.files?.[0]) }}
        >
          <button
            type="button"
            disabled={uploading}
            onClick={() => gallery.current?.click()}
            className="group flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-6 py-10 text-center transition hover:bg-[var(--color-accent)]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-60"
          >
            <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] shadow-lg shadow-purple-900/30 transition group-hover:scale-105">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
            <span className="text-lg font-extrabold text-[var(--color-text)]">Sube tu foto frontal</span>
            <span className="max-w-[30ch] text-xs text-[var(--color-text-muted)]">
              Arrástrala aquí o toca para elegirla. JPG o PNG vertical, hasta {TRYON_MAX_MB} MB y mínimo {TRYON_MIN.width} × {TRYON_MIN.height} px.
            </span>
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" disabled={uploading} onClick={openGuidedCamera} className="min-h-11 rounded-xl bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-accent-contrast,#ffffff)] shadow-sm transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50">Tomar foto</button>
            <button type="button" disabled={uploading} onClick={() => gallery.current?.click()} className="min-h-11 rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50">Elegir de la galería</button>
            <GuiaFotoButton className="ml-auto" />
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Solo la usamos para esta prueba y la puedes borrar cuando quieras.</p>
        </div>
      ) : (
        <div className="grid gap-4 @md:grid-cols-[200px_1fr]">
          <div className="mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] @md:mx-0 @md:max-w-none">
            <img src={shown} alt="Vista previa de tu foto" draggable={false} onContextMenu={(e) => e.preventDefault()} className={`h-full w-full select-none object-cover ${uploading ? 'opacity-60' : ''}`} />
          </div>
          <div className="flex flex-col">
            {photo && !uploading && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-success-text,#144a27)]" role="status">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[var(--color-success,#1e6b3a)]">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>Foto lista para probar.</span>
              </p>
            )}
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">Solo la usamos para esta prueba y la puedes borrar cuando quieras.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" disabled={uploading} onClick={() => gallery.current?.click()} className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50">Cambiar foto</button>
              <button type="button" disabled={uploading} onClick={openGuidedCamera} className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50">Tomar otra</button>
              {uploading && <button type="button" onClick={cancel} className="rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">Cancelar subida</button>}
            </div>
            <div className="mt-3"><GuiaFotoButton /></div>
          </div>
        </div>
      )}

      <input ref={gallery} type="file" accept={TRYON_ACCEPT} hidden data-testid="photo-input" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={camera} type="file" accept={TRYON_ACCEPT} capture="user" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
      {uploading && (
        <div className="mt-4" role="status" aria-live="polite">
          <p className="text-sm text-[var(--color-text)]">Subiendo tu foto… {progress}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]" role="progressbar" aria-label="Subida de la foto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0}>
            <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && (error.titulo
        ? <Aviso tono="error" className="mt-4" titulo={error.titulo} acciones={<button type="button" onClick={() => gallery.current?.click()} className={BTN_SECUNDARIO}>Subir otra foto</button>}>{error.texto}</Aviso>
        : <p role="alert" className="mt-4 text-sm text-[var(--color-danger-text,#ff8a8a)] font-medium">{error.texto}</p>)}

      {guidedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Cámara guiada formato vertical">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#151121] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Tomar foto (guía automática 3:4)</h3>
                <p className="text-[11px] text-white/65">
                  Cuando el borde cambie a verde, se tomará sola en 3 segundos.
                </p>
              </div>
              <button type="button" onClick={stopGuidedCamera} className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/75 hover:bg-white/10">
                Cerrar
              </button>
            </div>

            <div className={`relative mx-auto aspect-[3/4] max-h-[60vh] overflow-hidden rounded-xl border-4 bg-black transition-colors duration-200 ${frameBorderClass}`}>
              <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />

              {/* Silueta guía punteada verde/roja */}
              <svg viewBox="0 0 180 240" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                <rect x="8" y="8" width="164" height="224" rx="10" fill="none" stroke={guideStroke} strokeWidth="1.8" strokeDasharray="5 4" />
                <circle cx="90" cy="34" r="14" fill="none" stroke={guideStroke} strokeWidth="1.8" strokeDasharray="4 3" />
                <path d="M58 60 Q90 52 122 60 L132 128 L116 130 L112 222 L94 222 L90 142 L86 222 L68 222 L64 130 L48 128 Z" fill="none" stroke={guideStroke} strokeWidth="1.8" strokeDasharray="4 3" />
              </svg>

              {/* Mensaje guía en vivo */}
              <div className={`pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border px-3 py-2 text-center text-xs font-semibold backdrop-blur-md ${
                poseOk
                  ? 'border-emerald-400/50 bg-emerald-950/80 text-emerald-200'
                  : 'border-rose-400/50 bg-rose-950/80 text-rose-100'
              }`}>
                {poseHint}
              </div>

              {/* Contador automático de 3 segundos */}
              {countdown !== null && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                  <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-400 bg-emerald-500/25 text-5xl font-black text-white shadow-2xl">
                    {countdown}
                  </span>
                </div>
              )}
            </div>

            {guidedError && (
              <p role="alert" className="mt-2 text-xs text-rose-300">{guidedError}</p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/55">
                {poseEngineReady ? 'Detección de postura activa' : 'Modo manual'}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={stopGuidedCamera} className="rounded-xl border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">
                  Cancelar
                </button>
                <button type="button" disabled={Boolean(guidedError)} onClick={captureGuidedPortrait} className="rounded-xl bg-violeta px-4 py-2 text-xs font-bold text-white hover:bg-violeta-hover disabled:opacity-50">
                  Capturar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
