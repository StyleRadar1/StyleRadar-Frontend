/** Clases y props compartidos por los formularios de identidad. */
export const inputCls =
  'w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-blanco outline-none focus:border-violeta-claro aria-[invalid=true]:border-[var(--sr-bad,#ff8a8a)] disabled:opacity-60'

export const labelCls = 'text-xs font-bold uppercase tracking-[.14em] text-white/70'

/** Props de accesibilidad para el control de un campo. */
export const a11y = (id: string, error?: string, hint?: boolean) => ({
  id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined,
})
