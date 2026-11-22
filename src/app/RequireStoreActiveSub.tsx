import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loading } from '@/modules/core/components/Status'
import { useStoreSubscription } from '@/modules/transacciones/hooks/useStoreSubscription'

/**
 * RF-67, RF-99, RN-05: Guard de suscripción activa del almacén.
 * Se usa junto a RequireRole(['STORE_ADMIN']) en rutas de gestión y publicación del catálogo.
 * Si subscription.status no es ACTIVA:
 * - Redirige a /tienda/suscripcion/activar (sin suscripción o PENDIENTE)
 * - Redirige a /tienda/suscripcion (SUSPENDIDA o CANCELADA)
 */
export function RequireStoreActiveSub({ children }: { children: ReactNode }) {
  const { data, loading } = useStoreSubscription()
  const location = useLocation()

  if (loading && !data) {
    return <Loading label="Verificando el estado de tu suscripción…" />
  }

  const status = data?.subscription.status
  if (status !== 'ACTIVA') {
    if (status === 'SUSPENDIDA' || status === 'CANCELADA') {
      return (
        <Navigate
          to="/tienda/suscripcion?motivo=suspendida"
          replace
          state={{ from: location.pathname, reason: status }}
        />
      )
    }
    return (
      <Navigate
        to="/tienda/suscripcion/activar?motivo=pendiente"
        replace
        state={{ from: location.pathname, reason: status ?? 'SIN_SUSCRIPCION' }}
      />
    )
  }

  return children
}
