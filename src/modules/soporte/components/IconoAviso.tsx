import type { TipoNotificacion } from '../types/notification.dto'
import { INFO_AVISO, type InfoAviso } from '../utils/tiposAviso'

const TRAZOS: Record<InfoAviso['icono'], string> = {
  caja: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
  lupa: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  mensaje: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  regalo: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7S10.5 3 8 3.5 7 7 12 7zm0 0s1.5-4 4-3.5S17 7 12 7z',
  escudo: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM9 12l2 2 4-4',
  mano: 'M7 11V6a1.5 1.5 0 0 1 3 0v4m0 0V4.5a1.5 1.5 0 0 1 3 0V10m0 0V6a1.5 1.5 0 0 1 3 0v6c0 4-2 7-6 7-3 0-4.5-1.5-6-4l-1.4-2.4a1.4 1.4 0 0 1 2.3-1.6L7 14',
  etiqueta: 'M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01',
  tarjeta: 'M3 6h18v12H3zM3 10h18M7 15h4',
  campana: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0',
}

/** Dibujo de cada tipo de aviso. Es decorativo: el texto del aviso ya dice de qué se trata. */
export function IconoAviso({ tipo, className = 'h-4 w-4' }: { tipo: TipoNotificacion; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={TRAZOS[INFO_AVISO[tipo].icono]} />
    </svg>
  )
}
