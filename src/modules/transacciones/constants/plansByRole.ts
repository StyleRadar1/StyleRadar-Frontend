import type { Role } from '@/modules/core/types/roles'

/**
 * Mapeo estricto de planes disponibles por rol (E.5, RF-100, RF-67).
 * - COMPRADOR: únicamente Radar (gratis) y Radar+ (pago mensual).
 * - ADMIN_ALMACEN: únicamente Tienda aliada.
 * - REPRESENTANTE_FUNDACION: únicamente Fundación aliada.
 * - ADMIN_STYLERADAR: no tiene plan comercial; no requiere suscripción.
 */
export const COMPATIBLE_PLANS_BY_ROLE: Record<Role, string[]> = {
  COMPRADOR: ['RADAR', 'RADAR_PLUS'],
  ADMIN_ALMACEN: ['TIENDA'],
  REPRESENTANTE_FUNDACION: ['FUNDACION'],
  ADMIN_STYLERADAR: [],
}

export function isPlanCompatibleWithRole(planId: string, role?: Role): boolean {
  if (!role) return true // Visitante sin sesión puede ver la comparativa pública
  const allowed = COMPATIBLE_PLANS_BY_ROLE[role] ?? []
  return allowed.includes(planId)
}
