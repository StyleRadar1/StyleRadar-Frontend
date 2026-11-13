import { useEffect, useRef, useState } from 'react'
import { Aviso, BTN_SECUNDARIO } from '@/modules/core/components/Aviso'
import { readDimensions } from '../utils/photoRules'
import { problemaFoto, TEXTO_FOTO, TRYON_ACCEPT, TRYON_MAX_MB, TRYON_MIN, validarArchivoPrueba, validarDimensionesPrueba } from '../utils/tryOnRules'
import { tryOnService } from '../services/tryOnService'

export interface UploadedPhoto { photoId: string; previewUrl: string }

/**
 * RF-23: elegir o tomar la foto frontal, validarla, verla y subirla al endpoint autenticado.
 * La foto vive solo como URL temporal en memoria; nunca se guarda en localStorage.
 * Si la subida falla, se descarta la vista previa para no mostrar un estado falso.
 */
interface FotoError { titulo?: string; texto: string }

export function PhotoPicker({ photo, onUploaded, onConsentRequired }: {
  photo: UploadedPhoto | null
  onUploaded: (p: UploadedPhoto) => void
  /** El servidor pidió la autorización de la Ley 1581 antes de recibir la foto. */
  onConsentRequired?: () => void
}) {
  const gallery = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const ctrl = useRef<AbortController | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<FotoError | null>(null)

  useEffect(() => () => ctrl.current?.abort(), [])

  const discard = (url: string | null) => { if (url) URL.revokeObjectURL(url); setPreview(null); setProgress(null) }

  const handle = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    const bad = validarArchivoPrueba(file)
    if (bad) { setError({ texto: bad }); return }
    const url = URL.createObjectURL(file)
    try {
      const { width, height } = await readDimensions(url)
      if (!validarDimensionesPrueba(width, height)) {
        URL.revokeObjectURL(url); setError({ titulo: TEXTO_FOTO.dimensionesTitulo, texto: TEXTO_FOTO.dimensiones }); return
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
      onUploaded({ photoId: res.photoId, previewUrl: url })
    } catch (e) {
      discard(url)
      const p = problemaFoto(e)
      if (p.accion === 'consentimiento' && onConsentRequired) { onConsentRequired(); return }
      setError({ titulo: p.titulo, texto: p.texto })
    }
  }

  const cancel = () => { ctrl.current?.abort(); discard(preview); setError({ texto: 'Subida cancelada.' }) }
  const shown = preview ?? photo?.previewUrl ?? null
  const uploading = progress !== null

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {shown ? <img src={shown} alt="Vista previa de tu foto" className={`h-full w-full object-cover ${uploading ? 'opacity-60' : ''}`} />
            : <div className="grid h-full place-items-center p-4 text-center text-xs text-white/50">Tu foto aparecerá aquí</div>}
        </div>
        <div>
          <p className="text-sm text-white/75">De cuerpo entero, de frente y con buena luz. JPG o PNG vertical, de hasta {TRYON_MAX_MB} MB y mínimo {TRYON_MIN.width} × {TRYON_MIN.height} px. Solo la usamos para esta prueba y la puedes borrar cuando quieras.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={uploading} onClick={() => camera.current?.click()} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Tomar foto</button>
            <button type="button" disabled={uploading} onClick={() => gallery.current?.click()} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{photo ? 'Cambiar foto' : 'Elegir de la galería'}</button>
            {uploading && <button type="button" onClick={cancel} className="rounded-xl px-4 py-2.5 text-sm text-white/75 underline">Cancelar subida</button>}
          </div>
          <input ref={gallery} type="file" accept={TRYON_ACCEPT} hidden data-testid="photo-input" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
          <input ref={camera} type="file" accept={TRYON_ACCEPT} capture="user" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
          {uploading && (
            <div className="mt-4" role="status" aria-live="polite">
              <p className="text-sm">Subiendo tu foto… {progress}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Subida de la foto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0}>
                <div className="h-full bg-violeta-claro transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {photo && !uploading && <p className="mt-4 text-sm text-[#9be3b4]" role="status">Foto lista para probar.</p>}
          {error && (error.titulo
            ? <Aviso tono="error" className="mt-4" titulo={error.titulo} acciones={<button type="button" onClick={() => gallery.current?.click()} className={BTN_SECUNDARIO}>Subir otra foto</button>}>{error.texto}</Aviso>
            : <p role="alert" className="mt-4 text-sm text-[#ffb4b4]">{error.texto}</p>)}
        </div>
      </div>
    </div>
  )
}
