import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROLE_HOME, type Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'

/** Protege rutas por rol: sin sesión manda al login; con otro rol, a su propio inicio. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />
  return children
}
