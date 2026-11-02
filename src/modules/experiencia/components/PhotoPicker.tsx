import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '@/modules/core/api/errors'
import { PHOTO_ACCEPT, PHOTO_MAX_MB, readDimensions, validateDimensions, validatePhotoFile } from '../utils/photoRules'
import { tryOnService } from '../services/tryOnService'

export interface UploadedPhoto { photoId: string; previewUrl: string }

/**
 * RF-23: elegir o tomar la foto frontal, validarla, verla y subirla al endpoint autenticado.
 * La foto vive solo como URL temporal en memoria; nunca se guarda en localStorage.
 * Si la subida falla, se descarta la vista previa para no mostrar un estado falso.
 */
export function PhotoPicker({ photo, onUploaded }: { photo: UploadedPhoto | null; onUploaded: (p: UploadedPhoto) => void }) {
  const gallery = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const ctrl = useRef<AbortController | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => () => ctrl.current?.abort(), [])

  const discard = (url: string | null) => { if (url) URL.revokeObjectURL(url); setPreview(null); setProgress(null) }

  const handle = async (file: File | undefined) => {
    if (!file) return
    setError('')
    const bad = validatePhotoFile(file)
    if (bad) { setError(bad); return }
    const url = URL.createObjectURL(file)
    try {
      const { width, height } = await readDimensions(url)
      const small = validateDimensions(width, height)
      if (small) { URL.revokeObjectURL(url); setError(small); return }
    } catch {
      URL.revokeObjectURL(url); setError('No pudimos abrir esa imagen. Prueba con otra foto.'); return
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
      setError(`No pudimos subir tu foto. ${errorMessage(e)}`)
    }
  }

  const cancel = () => { ctrl.current?.abort(); discard(preview); setError('Subida cancelada.') }
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
          <p className="text-sm text-white/75">De cuerpo entero, de frente y con buena luz. JPG, PNG o WEBP de hasta {PHOTO_MAX_MB} MB. Solo la usamos para esta prueba y la puedes borrar cuando quieras.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={uploading} onClick={() => camera.current?.click()} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Tomar foto</button>
            <button type="button" disabled={uploading} onClick={() => gallery.current?.click()} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{photo ? 'Cambiar foto' : 'Elegir de la galería'}</button>
            {uploading && <button type="button" onClick={cancel} className="rounded-xl px-4 py-2.5 text-sm text-white/75 underline">Cancelar subida</button>}
          </div>
          <input ref={gallery} type="file" accept={PHOTO_ACCEPT} hidden data-testid="photo-input" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
          <input ref={camera} type="file" accept={PHOTO_ACCEPT} capture="user" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
          {uploading && (
            <div className="mt-4" role="status" aria-live="polite">
              <p className="text-sm">Subiendo tu foto… {progress}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Subida de la foto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0}>
                <div className="h-full bg-violeta-claro transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {photo && !uploading && <p className="mt-4 text-sm text-[#9be3b4]" role="status">Foto lista para probar.</p>}
          {error && <p role="alert" className="mt-4 text-sm text-[#ffb4b4]">{error}</p>}
        </div>
      </div>
    </div>
  )
}
