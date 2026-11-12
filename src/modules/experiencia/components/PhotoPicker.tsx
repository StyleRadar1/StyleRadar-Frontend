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
        <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
          {shown ? <img src={shown} alt="Vista previa de tu foto" className={`h-full w-full object-cover ${uploading ? 'opacity-60' : ''}`} />
            : <div className="grid h-full place-items-center p-4 text-center text-xs text-[var(--color-text-muted)]">Tu foto aparecerá aquí</div>}
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">De cuerpo entero, de frente y con buena luz. JPG, PNG o WEBP de hasta {PHOTO_MAX_MB} MB. Solo la usamos para esta prueba y la puedes borrar cuando quieras.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={uploading} onClick={() => camera.current?.click()} className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-4 py-2.5 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50 transition-all shadow-sm">Tomar foto</button>
            <button type="button" disabled={uploading} onClick={() => gallery.current?.click()} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50 transition-all">{photo ? 'Cambiar foto' : 'Elegir de la galería'}</button>
            {uploading && <button type="button" onClick={cancel} className="rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">Cancelar subida</button>}
          </div>
          <input ref={gallery} type="file" accept={PHOTO_ACCEPT} hidden data-testid="photo-input" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
          <input ref={camera} type="file" accept={PHOTO_ACCEPT} capture="user" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
          {uploading && (
            <div className="mt-4" role="status" aria-live="polite">
              <p className="text-sm text-[var(--color-text)]">Subiendo tu foto… {progress}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]" role="progressbar" aria-label="Subida de la foto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0}>
                <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {photo && !uploading && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-[var(--color-success-text,#144a27)] font-medium" role="status">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[var(--color-success,#1e6b3a)]">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>Foto lista para probar.</span>
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm text-[var(--color-danger-text,#ff8a8a)] font-medium">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[var(--color-danger-border,#ff8a8a)]">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
