import type { ReactNode } from 'react'
import { labelCls } from '../utils/campo'

/** Campo con etiqueta, ayuda y error enlazados para lectores de pantalla. */
export function Campo({ id, label, error, hint, className = '', children }: {
  id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-white/60">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-xs text-[var(--sr-bad,#ffb4b4)]">{error}</p>}
    </div>
  )
}

/** Opciones en botones con un solo valor (radio accesible). */
export function Opciones<T extends string>({ label, options, value, onChange, labels, error }: {
  label: string; options: readonly T[]; value: T; onChange: (v: T) => void; labels?: Record<string, string>; error?: string
}) {
  return (
    <fieldset>
      <legend className={labelCls}>{label}</legend>
      <div role="radiogroup" aria-label={label} className="mt-1.5 inline-flex overflow-hidden rounded-xl border border-white/20">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
            className={`px-5 py-2.5 text-sm font-semibold ${value === o ? 'bg-violeta text-blanco' : 'text-white/80 hover:bg-white/10'}`}>
            {value === o && <span aria-hidden="true">✓ </span>}{labels?.[o] ?? o}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-1.5 text-xs text-[var(--sr-bad,#ffb4b4)]">{error}</p>}
    </fieldset>
  )
}
