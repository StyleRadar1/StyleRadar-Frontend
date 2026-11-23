import type { UserSessionDto } from '../types/auth.dto'

/** Cuentas de prueba (contraseña 1234). Son las mismas del prototipo y del kit de jurados. */
export const DEMO_ACCOUNTS: UserSessionDto[] = [
  { id: 'u-1', name: 'Valentina Rojas', email: 'usuario@styleradar.co', role: 'BUYER' },
  { id: 't-1', name: 'Luna Store', email: 'luna@styleradar.co', role: 'STORE_ADMIN' },
  { id: 'f-1', name: 'Fundación Abrigo Bogotá', email: 'abrigo@styleradar.co', role: 'FOUNDATION_REPRESENTATIVE' },
  { id: 'a-1', name: 'Mariana Bernal', email: 'admin@styleradar.co', role: 'STYLERADAR_ADMIN' },
]
export const DEMO_PASSWORD = '1234'
