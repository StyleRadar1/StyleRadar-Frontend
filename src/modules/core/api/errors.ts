import { ApiError } from './apiClient'

/** Tipo de error según el código HTTP, para que cada pantalla decida qué ofrecer. */
export type ErrorKind = 'sin-conexion' | 'sesion' | 'permiso' | 'no-existe' | 'conflicto' | 'datos' | 'servidor'

export function errorKind(e: unknown): ErrorKind {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 0) return 'sin-conexion'
  if (status === 401) return 'sesion'
  if (status === 403) return 'permiso'
  if (status === 404 || status === 410) return 'no-existe'
  if (status === 409) return 'conflicto'
  if (status >= 400 && status < 500) return 'datos'
  return 'servidor'
}

const DEFAULTS: Record<ErrorKind, string> = {
  'sin-conexion': 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
  sesion: 'Tu sesión venció. Inicia sesión otra vez para continuar.',
  permiso: 'No tienes permiso para hacer esto.',
  'no-existe': 'Lo que buscas ya no existe o fue retirado.',
  conflicto: 'El estado cambió mientras lo veías. Actualiza e intenta de nuevo.',
  datos: 'Revisa los datos e intenta de nuevo.',
  servidor: 'El servicio no está disponible en este momento. Intenta en unos minutos.',
}

/** Mensaje para la persona: el del backend si lo envía; si no, uno según el tipo de error. */
export function errorMessage(e: unknown, fallback?: string): string {
  if (e instanceof ApiError && e.message && e.status !== 0 && e.status < 500) return e.message
  return fallback && !(e instanceof ApiError) ? fallback : DEFAULTS[errorKind(e)]
}
