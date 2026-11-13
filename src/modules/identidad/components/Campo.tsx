import type { ReactNode } from 'react'
import { labelCls } from '../utils/campo'

/** Campo con etiqueta, ayuda y error enlazados para lectores de pantalla. */
export function Campo({
  id,
  label,
  error,
  hint,
  className = '',
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-err`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger-text,var(--sr-bad,#ffb4b4))]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

/** Opciones en botones con un solo valor (radio accesible). */
export function Opciones<T extends string>({
  label,
  options,
  value,
  onChange,
  labels,
  error,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  labels?: Record<string, string>
  error?: string
}) {
  return (
    <fieldset>
      <legend className={labelCls}>{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-1.5 inline-flex overflow-hidden rounded-xl border border-[var(--color-border)]"
      >
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
              value === o
                ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {value === o && <span aria-hidden="true">✓ </span>}
            {labels?.[o] ?? o}
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger-text,var(--sr-bad,#ffb4b4))]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  )
}
