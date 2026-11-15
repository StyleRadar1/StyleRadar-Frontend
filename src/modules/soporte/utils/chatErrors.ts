import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind } from '@/modules/core/api/errors'
import { MAX_MENSAJE } from '../types/chat.dto'

/**
 * Textos del chat para cada error de ms-chat. Nunca se muestra el del servidor:
 * 404 y 403 se ven igual y no llevan el número de la conversación.
 */
export const TEXTO_LARGO = `El mensaje puede tener hasta ${MAX_MENSAJE.toLocaleString('es-CO')} caracteres.`

export interface ProblemaChat {
  titulo: string
  texto: string
  /** 'cerrado': la publicación se vendió o se retiró; la caja de texto queda bloqueada. */
  tipo: 'campo' | 'cerrado' | 'no-existe' | 'reintentar' | 'sesion'
}

/** Error al enviar un mensaje. */
export function problemaEnvio(e: unknown): ProblemaChat {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 400) return { titulo: 'Revisa tu mensaje', texto: TEXTO_LARGO, tipo: 'campo' }
  if (status === 422) return { titulo: 'Ya no puedes enviar mensajes', texto: 'Esta publicación ya se vendió o se retiró, por eso el chat quedó cerrado.', tipo: 'cerrado' }
  if (status === 404 || status === 403) return NO_DISPONIBLE
  return general(e, 'No pudimos enviar el mensaje', 'Intenta en unos minutos; tu texto sigue aquí.')
}

/** Error al abrir una conversación desde una prenda, una publicación o una donación. */
export function problemaInicio(e: unknown): ProblemaChat {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 422 || status === 400) return { titulo: 'No puedes escribir sobre esta publicación', texto: 'Es tuya o ya no está disponible.', tipo: 'cerrado' }
  if (status === 404 || status === 403) return { titulo: 'Esta publicación ya no está disponible', texto: 'Puede que la hayan retirado.', tipo: 'no-existe' }
  return general(e, 'No pudimos abrir la conversación', 'Intenta en unos minutos.')
}

export const NO_DISPONIBLE: ProblemaChat = { titulo: 'Esta conversación no está disponible', texto: 'Vuelve a tus mensajes para seguir hablando.', tipo: 'no-existe' }

function general(e: unknown, titulo: string, texto: string): ProblemaChat {
  const kind = errorKind(e)
  if (kind === 'sesion') return { titulo: 'Tu sesión venció', texto: 'Vuelve a iniciar sesión; tu texto sigue aquí.', tipo: 'sesion' }
  if (kind === 'sin-conexion') return { titulo: 'Se perdió la conexión', texto: 'Revisa tu internet; tu texto sigue aquí.', tipo: 'reintentar' }
  return { titulo, texto, tipo: 'reintentar' }
}
