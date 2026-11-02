import { useRef, useState } from 'react'
import { PHOTO_ACCEPT, validatePhotoFile } from '../utils/photoRules'

export interface PhotoItem { key: string; url: string; file?: File }

/** Fotos de una prenda: máximo `max`, valida formato y peso, vista previa y quitar. */
export function MultiPhotoInput({ photos, onChange, max, error, id }: { photos: PhotoItem[]; onChange: (p: PhotoItem[]) => void; max: number; error?: string; id: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const add = (files: FileList | null) => {
    if (!files) return
    const next = [...photos]
    const problems: string[] = []
    for (const f of Array.from(files)) {
      if (next.length >= max) { problems.push(`Máximo ${max} fotos por prenda.`); break }
      const bad = validatePhotoFile(f)
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
          <li key={p.key} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <img src={p.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(p.key)} aria-label={`Quitar foto ${i + 1}`}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-grafito/90 text-sm">✕</button>
            {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-arena px-2 py-0.5 text-[11px] font-bold text-grafito">Portada</span>}
          </li>
        ))}
        {!full && (
          <li>
            <button type="button" onClick={() => input.current?.click()} aria-describedby={`${id}-hint`}
              className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-white/30 text-sm text-white/75 hover:border-arena">
              + Agregar foto
            </button>
          </li>
        )}
      </ul>
      <p id={`${id}-hint`} className="mt-2 text-xs text-white/60">{photos.length} de {max} fotos. JPG, PNG o WEBP de hasta 8 MB.</p>
      <input ref={input} id={id} type="file" accept={PHOTO_ACCEPT} multiple hidden data-testid={`${id}-input`} onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      {(msg || error) && <p role="alert" className="mt-2 text-sm text-[#ffb4b4]">{msg || error}</p>}
    </div>
  )
}
