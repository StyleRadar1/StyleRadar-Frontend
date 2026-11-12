import type { ReactNode } from 'react'

/** Campo con etiqueta, ayuda y error enlazados para lectores de pantalla. */
export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text)]">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-xs text-[var(--color-danger-text,#ff8a8a)]">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
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
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-danger-text,#ff8a8a)]">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  )
}
