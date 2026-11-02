export const inputCls = 'w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violeta-claro aria-[invalid=true]:border-[#ff8a8a]'

/** Props de accesibilidad para el control de un Field. */
export const a11y = (id: string, error?: string, hint?: boolean) => ({
  id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined,
})
