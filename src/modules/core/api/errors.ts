import { ApiError } from './apiClient'
import { kindFromStatus, MENSAJES, NO_EXISTE_O_SIN_ACCESO, type CamposConError, type ErrorKind } from './mensajes'

export type { CamposConError, ErrorKind } from './mensajes'
export { MENSAJES, NO_EXISTE_O_SIN_ACCESO, camposDelError } from './mensajes'

/** Tipo de error según el código HTTP, para que cada pantalla decida qué ofrecer. */
export function errorKind(e: unknown): ErrorKind {
  return kindFromStatus(e instanceof ApiError ? e.status : 0)
}

/**
 * Mensaje para la persona. Los ApiError ya traen un texto seguro escrito por el React
 * (nunca el del servidor); si no es un ApiError se usa `fallback` o el del tipo de error.
 */
export function errorMessage(e: unknown, fallback?: string): string {
  if (e instanceof ApiError && e.message && e.status !== 0 && e.status < 500) return e.message
  return fallback && !(e instanceof ApiError) ? fallback : MENSAJES[errorKind(e)]
}

/** Para datos de otra persona: 403 y 404 muestran el mismo texto. */
export function errorMessageAjeno(e: unknown): string {
  const kind = errorKind(e)
  return kind === 'permiso' || kind === 'no-existe' ? NO_EXISTE_O_SIN_ACCESO : errorMessage(e)
}

/** Errores por campo del servidor, ya unificados ({ campo: mensaje }). Vacío si no hay. */
export function fieldErrors(e: unknown): CamposConError {
  return e instanceof ApiError ? e.fields : {}
}
