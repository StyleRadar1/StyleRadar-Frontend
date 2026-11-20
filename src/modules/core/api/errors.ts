import { ApiError } from './apiClient'
import { kindFromStatus, MENSAJES, mensajePorCodigo, NO_EXISTE_O_SIN_ACCESO, type CamposConError, type ErrorKind } from './mensajes'

export type { CamposConError, ErrorKind } from './mensajes'
export { MENSAJES, MENSAJES_POR_CODIGO, mensajePorCodigo, NO_EXISTE_O_SIN_ACCESO, camposDelError } from './mensajes'

/** Tipo de error según el código HTTP, para que cada pantalla decida qué ofrecer. */
export function errorKind(e: unknown): ErrorKind {
  return kindFromStatus(e instanceof ApiError ? e.status : 0)
}

/**
 * Mensaje para la persona. Prioriza el texto definido por `code` (`ProblemDetail.code`) cuando
 * existe en el diccionario; de lo contrario conserva el texto seguro escrito por el front según HTTP.
 */
export function errorMessage(e: unknown, fallback?: string): string {
  if (e instanceof ApiError) {
    const byCode = mensajePorCodigo(e.code)
    if (byCode) return byCode
    if (e.message && e.status !== 0 && e.status < 500) return e.message
  }
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
