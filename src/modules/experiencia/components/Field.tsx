import type { ReactNode } from 'react'
import { FieldError } from '@/modules/core/components/ErrorFeedback'

/** Campo con etiqueta, ayuda y error enlazados para lectores de pantalla. */
export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text)]">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
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
      <legend className="text-sm font-semibold text-[var(--color-text)]">{label}</legend>
      <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
              value === o
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] ring-2 ring-[var(--color-focus-ring)] shadow-sm'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]'
            }`}
          >
            {labels?.[o] ?? o}
          </button>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  )
}
