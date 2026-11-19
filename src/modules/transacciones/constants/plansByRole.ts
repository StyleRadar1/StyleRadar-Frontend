import type { Role } from '@/modules/core/types/roles'

/**
 * Mapeo estricto de planes disponibles por rol (E.5, RF-100, RF-67).
 * - COMPRADOR: únicamente Radar (gratis) y Radar+ (pago mensual).
 * - ADMIN_ALMACEN: únicamente Tienda aliada.
 * - REPRESENTANTE_FUNDACION: únicamente Fundación aliada.
 * - ADMIN_STYLERADAR: no tiene plan comercial; no requiere suscripción.
 */
export const PLANS_BY_ROLE: Record<Role, string[]> = {
  COMPRADOR: ['free', 'plus', 'RADAR', 'RADAR_PLUS'],
  ADMIN_ALMACEN: ['store', 'TIENDA'],
  REPRESENTANTE_FUNDACION: ['FUNDACION'],
  ADMIN_STYLERADAR: [],
}

export const COMPATIBLE_PLANS_BY_ROLE = PLANS_BY_ROLE

export function isPlanCompatibleWithRole(planId: string, role?: Role): boolean {
  if (!role) return true // Visitante sin sesión puede ver la comparativa pública
  const allowed = PLANS_BY_ROLE[role] ?? []
  return allowed.includes(planId)
}
