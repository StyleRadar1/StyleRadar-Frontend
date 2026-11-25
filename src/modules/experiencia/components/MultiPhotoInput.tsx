import { useRef, useState } from 'react'
import { FieldError } from '@/modules/core/components/ErrorFeedback'
import { PHOTO_MAX_MB, PHOTO_TYPES, validatePhotoFile } from '../utils/photoRules'
import { PhotoUploadGuide } from './PhotoUploadGuide'

export interface PhotoItem { key: string; url: string; file?: File }

/** Fotos de una prenda: máximo `max`, valida formato y peso, vista previa y quitar. */
export function MultiPhotoInput({
  photos,
  onChange,
  max,
  error,
  id,
  maxMb = PHOTO_MAX_MB,
  allowedTypes = PHOTO_TYPES,
  hintText,
}: {
  photos: PhotoItem[]
  onChange: (p: PhotoItem[]) => void
  max: number
  error?: string
  id: string
  maxMb?: number
  allowedTypes?: readonly string[]
  hintText?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const add = (files: FileList | null) => {
    if (!files) return
    const next = [...photos]
    const problems: string[] = []
    for (const f of Array.from(files)) {
      if (next.length >= max) { problems.push(`Máximo ${max} fotos por prenda.`); break }
      const bad = validatePhotoFile(f, {
        maxMb,
        types: allowedTypes,
        formatError: `Usa una foto JPG o PNG de máximo ${maxMb} MB.`,
      })
      if (bad) { problems.push(bad); continue }
      next.push({ key: `${f.name}-${f.size}-${Math.random()}`, url: URL.createObjectURL(f), file: f })
    }
    setMsg(problems.join(' '))
    onChange(next)
  }
  const remove = (key: string) => {
    const p = photos.find((x) => x.key === key)
    if (p?.file) URL.revokeObjectURL(p.url)
    setMsg('')
    onChange(photos.filter((x) => x.key !== key))
  }

  const full = photos.length >= max
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Fotos agregadas">
        {photos.map((p, i) => (
          <li key={p.key} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
            <img src={p.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p.key)}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-surface)]/90 text-sm text-[var(--color-text)] border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            >
              ✕
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-accent-contrast,#ffffff)] shadow-sm">
                Portada
              </span>
            )}
          </li>
        ))}
        {!full && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              aria-describedby={`${id}-hint`}
              className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)]/40 text-sm font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            >
              + Agregar foto
            </button>
          </li>
        )}
      </ul>
      <p id={`${id}-hint`} className="mt-2 text-xs text-[var(--color-text-muted)]">
        {hintText ?? `${photos.length} de ${max} fotos. JPG o PNG de hasta ${maxMb} MB.`}
      </p>
      <PhotoUploadGuide variant="garment" className="mt-2.5" />
      <input ref={input} id={id} type="file" accept={allowedTypes.join(',')} multiple hidden data-testid={`${id}-input`} onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      <FieldError id={`${id}-err`} message={msg || error} />
    </div>
  )
}
