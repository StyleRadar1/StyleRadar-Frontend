import type { ReactNode } from 'react'
import { FieldError } from '@/modules/core/components/ErrorFeedback'

/** Campo con etiqueta, ayuda y error enlazados para lectores de pantalla. */
export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-white/60">{hint}</p>}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  )
}

/** Selector de opciones en botones (radio accesible). */
export function ChoiceGroup<T extends string>({ label, options, value, onChange, error, labels }: {
  label: string; options: readonly T[]; value: T | ''; onChange: (v: T) => void; error?: string; labels?: Record<string, string>
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${value === o ? 'border-arena bg-arena text-grafito' : 'border-white/20'}`}>{labels?.[o] ?? o}</button>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  )
}
