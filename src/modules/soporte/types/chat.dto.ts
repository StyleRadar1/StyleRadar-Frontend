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
  /** Publicación, prenda o donación de la que se habla. Evita abrir dos conversaciones por lo mismo. */
  referenciaId?: string
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

export type ContactoDto = ConversacionDto['contacto']

/**
 * POST /api/chat/conversations. Abre la conversación con alguien sobre algo, o devuelve la que ya existía
 * (RF-40 desde una publicación de segunda mano, RF-73 con una tienda, RF-41 fundación y donante).
 */
export interface IniciarConversacionDto {
  contacto: ContactoDto
  asunto: string
  referenciaId?: string
}

/** Cómo ve la otra persona la conversación: si yo le escribo a quien vende, para esa persona soy quien pregunta. */
export const TIPO_ESPEJO: Record<TipoContacto, TipoContacto> = {
  VENDEDOR: 'COMPRADOR',
  TIENDA: 'COMPRADOR',
  COMPRADOR: 'VENDEDOR',
  FUNDACION: 'DONANTE',
  DONANTE: 'FUNDACION',
}

/** Mismo límite que el backend del chat. */
export const MAX_MENSAJE = 1000
