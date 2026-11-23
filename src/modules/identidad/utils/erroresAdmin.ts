/** Mensajes de Admin · Usuarios al cambiar el estado de una cuenta (plan de errores · Cristian). */
export const TEXTOS_ADMIN_USUARIOS = {
  /**
   * 403: cambio de estado no permitido. SR-RF-66 responde 403 sin `code` cuando es la propia cuenta (EX-07),
   * la cuenta ya tiene ese estado (EX-08) o es el último administrador activo (EX-09); el texto los cubre.
   */
  sinPermiso: {
    titulo: 'No se pudo cambiar el estado',
    texto: 'La cuenta quedó como estaba. No puedes cambiar tu propia cuenta ni dejar a StyleRadar sin un administrador activo.',
  },
  /** 404: el usuario no existe. */
  noExiste: { titulo: 'Ese usuario no existe', texto: 'Actualizamos la lista.' },
} as const
