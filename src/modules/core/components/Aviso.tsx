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

/** Clases de los botones del aviso, según el manual: el principal es violeta. */
export const BTN_PRINCIPAL = 'rounded-xl bg-violeta px-4 py-2 text-xs font-semibold uppercase tracking-[.12em] text-white hover:bg-violeta-claro disabled:opacity-50'
export const BTN_SECUNDARIO = 'rounded-xl border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-[.12em] text-white hover:bg-white/10 disabled:opacity-50'
