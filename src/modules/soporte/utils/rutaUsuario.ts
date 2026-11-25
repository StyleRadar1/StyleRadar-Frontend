import { mockSessionUser } from '@/modules/core/api/mock'

/** Id numérico de la persona en sesión (el mismo del token), o undefined si la sesión no lo trae así. */
export const idNumericoSesion = (): string | undefined => {
  const id = String(mockSessionUser()?.id ?? '')
  return /^\d+$/.test(id) ? id : undefined
}

/**
 * Base de las rutas de ms-notificaciones: /api/v1/users/{id}. Se usa el id numérico de la sesión
 * (así lo documenta el Swagger); si la sesión no lo trae, queda el alias «me» (el usuario del token).
 */
export const rutaUsuario = (): string => `/api/v1/users/${idNumericoSesion() ?? 'me'}`
