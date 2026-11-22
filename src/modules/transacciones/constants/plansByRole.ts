import type { Role } from '@/modules/core/types/roles'

/** Constantes únicas de precio mensual en COP (RF-67, RF-100, RF-102). */
export const RADAR_PLUS_PRICE = 14_900
export const STORE_SUBSCRIPTION_PRICE = 89_000

/**
 * Mapeo estricto de planes disponibles por rol (E.5, RF-100, RF-67).
 * - BUYER: únicamente Radar (gratis) y Radar+ (pago mensual).
 * - STORE_ADMIN: únicamente Tienda aliada.
 * - FOUNDATION_REPRESENTATIVE: únicamente Fundación aliada.
 * - STYLERADAR_ADMIN: no tiene plan comercial; no requiere suscripción.
 */
export const PLANS_BY_ROLE: Record<Role, string[]> = {
  BUYER: ['free', 'plus', 'RADAR', 'RADAR_PLUS'],
  STORE_ADMIN: ['store', 'TIENDA'],
  FOUNDATION_REPRESENTATIVE: ['FUNDACION'],
  STYLERADAR_ADMIN: [],
}

export const COMPATIBLE_PLANS_BY_ROLE = PLANS_BY_ROLE

export function isPlanCompatibleWithRole(planId: string, role?: Role): boolean {
  if (!role) return true // Visitante sin sesión puede ver la comparativa pública
  const allowed = PLANS_BY_ROLE[role] ?? []
  return allowed.includes(planId)
}
