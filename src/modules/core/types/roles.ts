/** Roles del sistema, iguales a los del backend (ms-usuarios). */
export type Role = 'COMPRADOR' | 'ADMIN_ALMACEN' | 'REPRESENTANTE_FUNDACION' | 'ADMIN_STYLERADAR'

export const ROLE_LABEL: Record<Role, string> = {
  COMPRADOR: 'Usuario',
  ADMIN_ALMACEN: 'Tienda',
  REPRESENTANTE_FUNDACION: 'Fundación',
  ADMIN_STYLERADAR: 'Admin',
}

/** Pantalla de inicio de cada rol después de iniciar sesión. */
export const ROLE_HOME: Record<Role, string> = {
  COMPRADOR: '/catalogo',
  ADMIN_ALMACEN: '/tienda/inventario',
  REPRESENTANTE_FUNDACION: '/fundacion',
  ADMIN_STYLERADAR: '/admin/usuarios',
}
