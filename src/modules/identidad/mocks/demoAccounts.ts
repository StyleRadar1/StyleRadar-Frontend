import type { UserSessionDto } from '../types/auth.dto'

/** Cuentas de prueba (contraseña 1234). Son las mismas del prototipo y del kit de jurados. */
export const DEMO_ACCOUNTS: UserSessionDto[] = [
  { id: 'u-1', name: 'Valentina Rojas', email: 'usuario@styleradar.co', role: 'COMPRADOR' },
  { id: 't-1', name: 'Luna Store', email: 'luna@styleradar.co', role: 'ADMIN_ALMACEN' },
  { id: 'f-1', name: 'Fundación Abrigo Bogotá', email: 'abrigo@styleradar.co', role: 'REPRESENTANTE_FUNDACION' },
  { id: 'a-1', name: 'Mariana Bernal', email: 'admin@styleradar.co', role: 'ADMIN_STYLERADAR' },
]
export const DEMO_PASSWORD = '1234'
