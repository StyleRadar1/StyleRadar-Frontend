/** Roles del sistema en inglés, iguales en ms-auth, ms-usuarios, ms-tiendas y el gateway (D20 · F-27). */
export type Role = 'BUYER' | 'STORE_ADMIN' | 'FOUNDATION_REPRESENTATIVE' | 'STYLERADAR_ADMIN'

export const ROLE_LABEL: Record<Role, string> = {
  BUYER: 'Usuario',
  STORE_ADMIN: 'Tienda',
  FOUNDATION_REPRESENTATIVE: 'Fundación',
  STYLERADAR_ADMIN: 'Admin',
}

/** Pantalla de inicio de cada rol después de iniciar sesión. */
export const ROLE_HOME: Record<Role, string> = {
  BUYER: '/catalogo',
  STORE_ADMIN: '/mi-tienda',
  FOUNDATION_REPRESENTATIVE: '/fundacion',
  STYLERADAR_ADMIN: '/admin/estadisticas',
}

const ROLES: readonly Role[] = ['BUYER', 'STORE_ADMIN', 'FOUNDATION_REPRESENTATIVE', 'STYLERADAR_ADMIN']

/** Valores en español de versiones anteriores, solo para sesiones que quedaron guardadas en el navegador. */
const ROL_ANTERIOR: Record<string, Role> = {
  COMPRADOR: 'BUYER',
  ADMIN_ALMACEN: 'STORE_ADMIN',
  REPRESENTANTE_FUNDACION: 'FOUNDATION_REPRESENTATIVE',
  ADMIN_STYLERADAR: 'STYLERADAR_ADMIN',
}

/** Devuelve el rol válido o null. Acepta el valor anterior en español para no dejar sesiones guardadas sin pantalla de inicio. */
export function aRol(valor: unknown): Role | null {
  if (typeof valor !== 'string') return null
  const v = valor.trim().toUpperCase()
  if ((ROLES as readonly string[]).includes(v)) return v as Role
  return ROL_ANTERIOR[v] ?? null
}
