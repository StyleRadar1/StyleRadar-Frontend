import { useCallback, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { env } from '@/configs/env'
import { ApiError } from '@/modules/core/api/apiClient'
import { Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { storeSettingsService } from '@/modules/catalogo/services/storeSettingsService'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { useStoreSubscription } from '@/modules/transacciones/hooks/useStoreSubscription'

/**
 * RF-67, RF-99, RN-05: Guard de suscripción activa del almacén.
 * Se usa junto a RequireRole(['STORE_ADMIN']) en rutas de gestión y publicación del catálogo.
 * Si la cuenta aún no tiene almacén en ms-tiendas, primero va a /tienda/registro (NIT y RUT), aunque
 * haya cerrado la página después de crear la cuenta. Con almacén, si subscription.status no es ACTIVA:
 * - Redirige a /tienda/suscripcion/activar (sin suscripción o PENDIENTE)
 * - Redirige a /tienda/suscripcion (SUSPENDIDA o CANCELADA)
 */
export function RequireStoreActiveSub({ children }: { children: ReactNode }) {
  const almacen = useTieneAlmacen()
  if (almacen === 'cargando') return <Loading label="Verificando tu almacén…" />
  if (almacen === 'sin-almacen') return <Navigate to="/tienda/registro" replace />
  return <RequireActiveSubscription>{children}</RequireActiveSubscription>
}

/** 'sin-almacen' solo si ms-tiendas responde 404; con otro error no se bloquea a la tienda. */
function useTieneAlmacen(): 'cargando' | 'con-almacen' | 'sin-almacen' {
  const { user } = useAuth()
  const userId = user?.id
  const loader = useCallback(async () => {
    if (env.useMocks || !userId) return true
    try {
      await storeSettingsService.getMyStore(userId)
      return true
    } catch (err) {
      return !(err instanceof ApiError && err.status === 404)
    }
  }, [userId])
  // Con datos de prueba no hay ms-tiendas: se sigue directo, sin pantalla de carga extra.
  const { data, loading } = useResource<boolean | null>(loader, env.useMocks || !userId ? true : null)
  if (loading && data === null) return 'cargando'
  return data === false ? 'sin-almacen' : 'con-almacen'
}

function RequireActiveSubscription({ children }: { children: ReactNode }) {
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
