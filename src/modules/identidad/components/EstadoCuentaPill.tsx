import { ESTADO_CUENTA_LABEL, type EstadoCuenta } from '../types/usuario.dto'

/* El estado se lee por el texto y por el símbolo, no solo por el color (tema daltónico). */
const TONO: Record<EstadoCuenta, string> = {
  ACTIVA: 'border-[var(--sr-ok,#9be3b4)]/50 text-[var(--sr-ok,#9be3b4)]',
  INACTIVA: 'border-white/30 text-white/75',
  BLOQUEADA: 'border-[var(--sr-bad,#ffb4b4)]/50 text-[var(--sr-bad,#ffb4b4)]',
}
const SIMBOLO: Record<EstadoCuenta, string> = { ACTIVA: '●', INACTIVA: '○', BLOQUEADA: '⊘' }

export function EstadoCuentaPill({ estado }: { estado: EstadoCuenta }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONO[estado]}`}>
      <span aria-hidden="true">{SIMBOLO[estado]}</span>{ESTADO_CUENTA_LABEL[estado]}
    </span>
  )
}
