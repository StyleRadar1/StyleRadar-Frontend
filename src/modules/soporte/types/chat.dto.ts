/**
 * DTOs de ms-chat (Estación Guatoque Jiraguas · puerto 8320, vía API Gateway).
 * Provisionales: ajustar a los del Swagger cuando esté publicado.
 */

/** Con quién es la conversación, para mostrar la etiqueta y el filtro. */
export type TipoContacto = 'COMPRADOR' | 'VENDEDOR' | 'TIENDA' | 'FUNDACION' | 'DONANTE'

export const CONTACTO_LABEL: Record<TipoContacto, string> = {
  COMPRADOR: 'Te pregunta por tu prenda',
  VENDEDOR: 'Vende',
  TIENDA: 'Tienda',
  FUNDACION: 'Fundación',
  DONANTE: 'Quiere donar',
}

export interface ConversacionDto {
  id: string
  contacto: { id: string; nombre: string; tipo: TipoContacto }
  /** Prenda, tienda o donación de la que se habla. */
  asunto: string
  ultimoMensaje?: string
  noLeidos: number
  actualizadaEn: string
}

export interface MensajeDto {
  id: string
  conversacionId: string
  autorId: string
  texto: string
  enviadoEn: string
}

export interface EnviarMensajeDto {
  texto: string
}

/** Mismo límite que el backend del chat. */
export const MAX_MENSAJE = 1000
