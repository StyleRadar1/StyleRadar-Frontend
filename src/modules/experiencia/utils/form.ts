export const inputCls =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-focus-ring)] aria-[invalid=true]:border-[var(--color-danger-border,#ff8a8a)] aria-[invalid=true]:ring-[var(--color-danger-border,#ff8a8a)] transition-colors'

/** Props de accesibilidad para el control de un Field. */
export const a11y = (id: string, error?: string, hint?: boolean) => ({
  id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined,
})
