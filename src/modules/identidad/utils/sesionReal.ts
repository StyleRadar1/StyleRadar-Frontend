import type { Role } from '@/modules/core/types/roles'
import type { LoginResponseDto, UserSessionDto } from '../types/auth.dto'

/**
 * ms-auth emite el JWT con los roles en inglés (BUYER, STORE_ADMIN…), pero el front decide la campana,
 * los enlaces y las rutas protegidas con los nombres en español. Aquí se traducen una sola vez, al iniciar sesión.
 * También se aceptan los nombres de ms-usuarios, que ya vienen en español.
 */
const ROLES: Record<string, Role> = {
  BUYER: 'COMPRADOR',
  STORE_ADMIN: 'ADMIN_ALMACEN',
  FOUNDATION_REPRESENTATIVE: 'REPRESENTANTE_FUNDACION',
  STYLERADAR_ADMIN: 'ADMIN_STYLERADAR',
  COMPRADOR: 'COMPRADOR',
  ADMIN_ALMACEN: 'ADMIN_ALMACEN',
  REPRESENTANTE_FUNDACION: 'REPRESENTANTE_FUNDACION',
  ADMIN_STYLERADAR: 'ADMIN_STYLERADAR',
}

/** Traduce un rol del back al del front; si no lo reconoce, devuelve `null` (nunca se inventa un rol con más permisos). */
export function normalizarRol(raw: unknown): Role | null {
  const r = String(Array.isArray(raw) ? raw[0] : raw ?? '').trim().replace(/^ROLE_/, '').toUpperCase()
  return ROLES[r] ?? null
}

/** Lee el cuerpo del JWT sin validarlo (la validación es del gateway); solo sirve para saber quién es. */
export function leerJwt(token: string): Record<string, unknown> {
  try {
    const cuerpo = token.split('.')[1]
    if (!cuerpo) return {}
    const b64 = cuerpo.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')).split('').map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
    return JSON.parse(json) as Record<string, unknown>
  } catch { return {} }
}

const texto = (v: unknown) => (typeof v === 'string' && v ? v : undefined)

/**
 * Convierte la respuesta real de ms-auth a la sesión del front: token, usuario y rol en español.
 * El id y el rol salen de la respuesta o, si no vienen, del propio JWT (`sub` y `roles`).
 * Si no se reconoce el rol se deja el de menos permisos (COMPRADOR).
 */
export function aLoginResponse(data: unknown): LoginResponseDto {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const token = texto(d.token) ?? texto(d.accessToken) ?? texto(d.jwt) ?? ''
  const u = (d.user && typeof d.user === 'object' ? d.user : d.usuario && typeof d.usuario === 'object' ? d.usuario : {}) as Record<string, unknown>
  const jwt = leerJwt(token)
  const role = normalizarRol(u.role ?? u.rol ?? u.roles) ?? normalizarRol(jwt.roles ?? jwt.role) ?? 'COMPRADOR'
  const user: UserSessionDto = {
    id: String(u.id ?? u.userId ?? u.usuarioId ?? jwt.sub ?? ''),
    name: texto(u.name) ?? texto(u.nombre) ?? texto(d.name) ?? texto(d.nombre) ?? '',
    email: texto(u.email) ?? texto(u.correo) ?? texto(d.email) ?? '',
    role,
  }
  return { ...(d as object), token, user } as LoginResponseDto
}
