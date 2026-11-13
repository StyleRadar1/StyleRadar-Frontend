/** Clases y props compartidos por los formularios de identidad. */
export const inputCls =
  'w-full rounded-xl border border-[var(--color-border,rgba(255,255,255,0.2))] bg-[var(--color-surface,rgba(0,0,0,0.2))] px-4 py-3 text-sm text-[var(--color-text,#ffffff)] outline-none focus:border-[var(--color-focus-ring,#a98bea)] focus:ring-2 focus:ring-[var(--color-focus-ring)]/20 aria-[invalid=true]:border-[var(--color-danger,var(--sr-bad,#ff8a8a))] disabled:opacity-60 transition-colors'

export const labelCls =
  'text-xs font-bold uppercase tracking-[.14em] text-[var(--color-text-muted,rgba(255,255,255,0.7))]'

/** Props de accesibilidad para el control de un campo. */
export const a11y = (id: string, error?: string, hint?: boolean) => ({
  id,
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined,
})
