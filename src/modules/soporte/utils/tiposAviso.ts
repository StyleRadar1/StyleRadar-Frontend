import type { TipoNotificacion } from '../types/notification.dto'

/**
 * Texto de cada tipo de aviso, para la campana y para las preferencias.
 * `icono` es el nombre del dibujo que pinta IconoAviso.
 */
export interface InfoAviso {
  titulo: string
  descripcion: string
  icono: 'caja' | 'lupa' | 'mensaje' | 'regalo' | 'escudo' | 'mano' | 'etiqueta' | 'tarjeta' | 'campana'
}

export const INFO_AVISO: Record<TipoNotificacion, InfoAviso> = {
  REPOSICION_STOCK: { titulo: 'Prenda disponible otra vez', descripcion: 'Una prenda agotada que sigues volvió a tener unidades.', icono: 'caja' },
  COINCIDENCIA_BUSQUEDA: { titulo: 'Coincidencia con tu búsqueda', descripcion: 'Llegó una prenda que coincide con una búsqueda guardada.', icono: 'lupa' },
  MENSAJE_NUEVO: { titulo: 'Mensaje nuevo', descripcion: 'Alguien te escribió en un chat.', icono: 'mensaje' },
  CAMBIO_DONACION: { titulo: 'Cambio en una donación', descripcion: 'Una donación cambió de estado.', icono: 'regalo' },
  MODERACION_PRENDA: { titulo: 'Moderación de una prenda', descripcion: 'Revisaron una de tus publicaciones.', icono: 'escudo' },
  SOLICITUD_DONACION: { titulo: 'Solicitud de donación', descripcion: 'Hay una nueva solicitud de donación.', icono: 'mano' },
  PRENDA_VENDIDA: { titulo: 'Prenda vendida', descripcion: 'Una prenda que te interesaba ya no está disponible.', icono: 'etiqueta' },
  PAGO_CONFIRMADO: { titulo: 'Pago confirmado', descripcion: 'Tu pago se confirmó.', icono: 'tarjeta' },
  SISTEMA: { titulo: 'Aviso de StyleRadar', descripcion: 'Mensajes generales de la plataforma.', icono: 'campana' },
}
