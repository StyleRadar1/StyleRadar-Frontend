import type { Role } from '@/modules/core/types/roles'

/** Punto de color de cada rol (variables de src/index.css, cambian con el tema). Siempre va junto al nombre del rol. */
export const ROLE_DOT: Record<Role, string> = {
  COMPRADOR: 'var(--sr-rol-usuario)',
  ADMIN_ALMACEN: 'var(--sr-rol-tienda)',
  REPRESENTANTE_FUNDACION: 'var(--sr-rol-fundacion)',
  ADMIN_STYLERADAR: 'var(--sr-rol-admin)',
}

/** Avatar: violeta para todos y arena con aro para el administrador, que así se reconoce de un vistazo. */
export const avatarCls = (role: Role) => role === 'ADMIN_STYLERADAR'
  ? 'bg-arena text-grafito ring-2 ring-arena ring-offset-2 ring-offset-[var(--sr-bg)]'
  : 'bg-violeta text-white'
