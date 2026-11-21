import { ACCOUNT_STATUS_LABEL, type AccountStatus } from '../types/usuario.dto'

/* El estado se lee por el texto y por el símbolo, no solo por el color (tema daltónico). */
const TONO: Record<AccountStatus, string> = {
  ACTIVE: 'border-[var(--sr-ok,#9be3b4)]/50 text-[var(--sr-ok,#9be3b4)]',
  INACTIVE: 'border-white/30 text-white/75',
  BLOCKED: 'border-[var(--sr-bad,#ffb4b4)]/50 text-[var(--sr-bad,#ffb4b4)]',
}
const SIMBOLO: Record<AccountStatus, string> = { ACTIVE: '●', INACTIVE: '○', BLOCKED: '⊘' }

export function EstadoCuentaPill({ estado }: { estado: AccountStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONO[estado]}`}>
      <span aria-hidden="true">{SIMBOLO[estado]}</span>{ACCOUNT_STATUS_LABEL[estado]}
    </span>
  )
}
