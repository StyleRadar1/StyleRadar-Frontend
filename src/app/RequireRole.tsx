import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROLE_HOME, type Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { salidaVoluntariaReciente } from '@/modules/identidad/states/salida'
import { guardarRetorno } from '@/modules/core/api/retorno'

/** Protege rutas por rol: sin sesión manda al inicio de sesión del landing; con otro rol, a su propio inicio. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    // Cerró sesión a propósito: al inicio. Si no tiene sesión (o expiró): al inicio de sesión del landing.
    if (salidaVoluntariaReciente()) return <Navigate to="/" replace />
    // Al volver a entrar, el inicio de sesión lleva de vuelta a esta página.
    guardarRetorno(location.pathname + location.search)
    return <Navigate to="/?login" replace state={{ from: location.pathname }} />
  }
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />
  return children
}
