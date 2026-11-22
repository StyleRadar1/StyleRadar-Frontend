import type { ReactNode } from 'react'

export type TonoAviso = 'info' | 'alerta' | 'error' | 'exito'

const TONO: Record<TonoAviso, string> = {
  info: 'border-lavanda/40 bg-lavanda/10',
  alerta: 'border-arena/50 bg-arena/10',
  error: 'border-[#ff8a8a]/40 bg-[#ff8a8a]/10',
  exito: 'border-[#9be3b4]/40 bg-[#9be3b4]/10',
}

interface Props {
  tono?: TonoAviso
  titulo: string
  children?: ReactNode
  /** Botones o enlaces de la acción que resuelve el problema. */
  acciones?: ReactNode
  onCerrar?: () => void
  className?: string
}

/**
 * Aviso del flujo de errores: qué pasó (título), qué hacer (texto) y la acción que lo resuelve.
 * Nunca recibe el texto del servidor: cada pantalla escribe el suyo.
 */
export function Aviso({ tono = 'info', titulo, children, acciones, onCerrar, className = '' }: Props) {
  const urgente = tono === 'error' || tono === 'alerta'
  return (
    <div role={urgente ? 'alert' : 'status'} className={`relative rounded-2xl border p-4 pr-10 text-sm ${TONO[tono]} ${className}`}>
      <p className="font-semibold text-white">{titulo}</p>
      {children && <div className="mt-1 text-white/75">{children}</div>}
      {acciones && <div className="mt-3 flex flex-wrap gap-2">{acciones}</div>}
      {onCerrar && (
        <button type="button" onClick={onCerrar} aria-label="Cerrar aviso" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  )
}

/** Clases de los botones del aviso: morado suave con glow y secundario glass. */
export const BTN_PRINCIPAL = 'rounded-xl bg-gradient-to-r from-[#9D5CFF] via-[#8B5CF6] to-[#7C3AED] hover:from-[#A855F7] hover:to-[#8B5CF6] px-4 py-2.5 text-xs font-bold uppercase tracking-[.12em] text-white shadow-[0_4px_18px_-2px_rgba(139,92,246,0.45)] border border-white/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none'
export const BTN_SECUNDARIO = 'rounded-xl border border-purple-300/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-400/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[.12em] text-[var(--color-text)] hover:text-white backdrop-blur-md transition-all disabled:opacity-50 disabled:pointer-events-none'
