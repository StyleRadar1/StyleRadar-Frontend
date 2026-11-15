/** Mensajes de Admin · Usuarios al cambiar el estado de una cuenta (plan de errores · Cristian). */
export const TEXTOS_ADMIN_USUARIOS = {
  /** 403: cambio de estado no permitido. */
  sinPermiso: { titulo: 'No se pudo cambiar el estado', texto: 'La cuenta quedó como estaba.' },
  /** 404: el usuario no existe. */
  noExiste: { titulo: 'Ese usuario no existe', texto: 'Actualizamos la lista.' },
} as const
