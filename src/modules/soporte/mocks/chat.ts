import type { ConversacionDto, MensajeDto } from '../types/chat.dto'

/** Conversaciones de prueba por usuario (ids de las cuentas demo). El administrador no tiene chats. */
export const seedConversations = (): Record<string, ConversacionDto[]> => ({
  'u-1': [
    { id: 'c1', contacto: { id: 'u-7', nombre: 'Sofía L.', tipo: 'VENDEDOR' }, asunto: 'Collar medalla dorado', ultimoMensaje: 'Sí, sigue disponible. ¿Te queda bien el sábado?', noLeidos: 1, actualizadaEn: '2026-11-08T19:40:00' },
    { id: 'c2', contacto: { id: 't-1', nombre: 'Luna Store', tipo: 'TIENDA' }, asunto: 'Consulta a la tienda', ultimoMensaje: 'Abrimos hasta las 8:00 p. m.', noLeidos: 0, actualizadaEn: '2026-11-07T17:05:00' },
    { id: 'c3', contacto: { id: 'f-1', nombre: 'Fundación Abrigo Bogotá', tipo: 'FUNDACION' }, asunto: 'Donación: Suéter trenzado crudo', ultimoMensaje: '¿Qué día te queda bien para entregarla?', noLeidos: 0, actualizadaEn: '2026-11-05T10:02:00' },
  ],
  't-1': [
    { id: 'c2', contacto: { id: 'u-1', nombre: 'Valentina R.', tipo: 'COMPRADOR' }, asunto: 'Consulta a la tienda', ultimoMensaje: 'Abrimos hasta las 8:00 p. m.', noLeidos: 0, actualizadaEn: '2026-11-07T17:05:00' },
    { id: 'c4', contacto: { id: 'u-8', nombre: 'Mateo P.', tipo: 'COMPRADOR' }, asunto: 'Chaqueta track negra', ultimoMensaje: '¿La tienen en talla L?', noLeidos: 1, actualizadaEn: '2026-11-09T09:20:00' },
  ],
  'f-1': [
    { id: 'c3', contacto: { id: 'u-1', nombre: 'Valentina R.', tipo: 'DONANTE' }, asunto: 'Donación: Suéter trenzado crudo', ultimoMensaje: '¿Qué día te queda bien para entregarla?', noLeidos: 0, actualizadaEn: '2026-11-05T10:02:00' },
  ],
})

export const seedMessages = (): Record<string, MensajeDto[]> => ({
  c1: [
    { id: 'm1', conversacionId: 'c1', autorId: 'u-1', texto: 'Hola, ¿el collar sigue disponible?', enviadoEn: '2026-11-08T19:12:00' },
    { id: 'm2', conversacionId: 'c1', autorId: 'u-7', texto: 'Sí, sigue disponible. ¿Te queda bien el sábado?', enviadoEn: '2026-11-08T19:40:00' },
  ],
  c2: [
    { id: 'm3', conversacionId: 'c2', autorId: 'u-1', texto: 'Hola, ¿hasta qué hora abren hoy?', enviadoEn: '2026-11-07T16:50:00' },
    { id: 'm4', conversacionId: 'c2', autorId: 't-1', texto: 'Abrimos hasta las 8:00 p. m.', enviadoEn: '2026-11-07T17:05:00' },
  ],
  c3: [
    { id: 'm5', conversacionId: 'c3', autorId: 'f-1', texto: 'Hola, somos Abrigo Bogotá. Aceptamos tu donación.', enviadoEn: '2026-11-05T10:00:00' },
    { id: 'm6', conversacionId: 'c3', autorId: 'f-1', texto: '¿Qué día te queda bien para entregarla?', enviadoEn: '2026-11-05T10:02:00' },
  ],
  c4: [
    { id: 'm7', conversacionId: 'c4', autorId: 'u-8', texto: '¿La tienen en talla L?', enviadoEn: '2026-11-09T09:20:00' },
  ],
})
