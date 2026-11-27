import type { StoreSubscriptionStatus } from '../types/storeSubscription.dto'

/**
 * Clases de color accesibles para el badge único de estado de suscripción:
 * - Verde: ACTIVA con renovación automática
 * - Ámbar: ACTIVA sin renovación o PENDIENTE
 * - Gris/neutro: CANCELADA, VENCIDA, SUSPENDIDA o sin suscripción
 */
export function getSubscriptionBadgeClass(
  status: StoreSubscriptionStatus | 'SIN_SUSCRIPCION',
  renewalEnabled = true,
): string {
  if (status === 'ACTIVA' && renewalEnabled) {
    return 'border-[var(--sr-ok,#4ade80)]/40 bg-[var(--sr-ok-bg,rgba(74,222,128,0.14))] text-[var(--sr-ok,#4ade80)]'
  }
  if (status === 'ACTIVA' || status === 'PENDIENTE') {
    return 'border-[var(--sr-warn,#fbbf24)]/40 bg-[var(--sr-warn-bg,rgba(251,191,36,0.14))] text-[var(--sr-warn,#fbbf24)]'
  }
  return 'border-white/20 bg-white/[.08] text-[var(--sr-text-secondary,#b8b3ce)]'
}
