import { useContext, useEffect, useState } from 'react'
import { Badge, Button } from '@/modules/core/design-system'
import { AuthContext } from '@/modules/identidad/states/authContext'
import {
  readMockStoreSubscription,
  STORE_SUB_CHANGED,
} from '../services/storeSubscriptionService'
import type { StoreSubscriptionStatus } from '../types/storeSubscription.dto'

export const STORE_CATALOG_SUSPENDED_MSG = 'Tu catálogo se encuentra suspendido por falta de pago'

interface StoreSuspendedBannerProps {
  /** Estado explícito de la suscripción si el padre ya lo cargó. */
  status?: StoreSubscriptionStatus
  /** Acción opcional al pulsar "Pagar y reactivar" cuando ya se está en /tienda/suscripcion. */
  onPayClick?: () => void
}

/**
 * RF-99: Banner fijo en la parte superior de las pantallas de la tienda cuando la suscripción está SUSPENDIDA.
 */
export function StoreSuspendedBanner({ status: propStatus, onPayClick }: StoreSuspendedBannerProps) {
  const auth = useContext(AuthContext)
  const user = auth?.user ?? null
  const [subStatus, setSubStatus] = useState<StoreSubscriptionStatus>(
    () => propStatus ?? readMockStoreSubscription(user?.id).subscription.status,
  )

  useEffect(() => {
    if (propStatus) {
      setSubStatus(propStatus)
      return
    }
    const sync = () => {
      setSubStatus(readMockStoreSubscription(user?.id).subscription.status)
    }
    sync()
    window.addEventListener(STORE_SUB_CHANGED, sync)
    return () => window.removeEventListener(STORE_SUB_CHANGED, sync)
  }, [propStatus, user?.id])

  const effectiveStatus = propStatus ?? subStatus
  if (effectiveStatus !== 'SUSPENDIDA') return null

  const handleAction = () => {
    if (typeof window !== 'undefined') {
      if (onPayClick && window.location.pathname === '/tienda/suscripcion') {
        onPayClick()
        return
      }
      window.location.assign('/tienda/suscripcion')
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-40 w-full border-b border-[var(--color-danger-border,rgba(239,68,68,0.4))] bg-[var(--sr-surface-raised,var(--color-bg-elevated))]/95 px-4 py-3 text-[var(--sr-text-primary,var(--color-text))] shadow-md backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="arena">SUSPENDIDA</Badge>
          <p className="text-sm font-semibold">{STORE_CATALOG_SUSPENDED_MSG}</p>
        </div>
        <Button type="button" variant="primario" onClick={handleAction}>
          Pagar y reactivar
        </Button>
      </div>
    </div>
  )
}
