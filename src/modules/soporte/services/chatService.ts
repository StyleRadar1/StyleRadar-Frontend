import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedConversations, seedMessages } from '../mocks/chat'
import { MAX_MENSAJE, type ConversacionDto, type MensajeDto } from '../types/chat.dto'

/** Rutas del API Gateway hacia ms-chat. Provisionales hasta tener el Swagger. */
const BASE = '/api/chat/conversations'

let convs: Record<string, ConversacionDto[]> | null = null
let msgs: Record<string, MensajeDto[]> | null = null
const db = () => ({ convs: (convs ??= seedConversations()), msgs: (msgs ??= seedMessages()) })
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetChatMock = () => { convs = null; msgs = null }

const me = () => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return u
}
/** Solo quien participa ve la conversación; para los demás «no existe». */
const own = (id: string) => {
  const c = (db().convs[me().id] ?? []).find((x) => x.id === id)
  if (!c) throw new ApiError(404, 'Esa conversación no existe.')
  return c
}

export const chatService = {
  /** RF-40, RF-41 y RF-73: bandeja de la persona, la tienda o la fundación. */
  async conversations(): Promise<ConversacionDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay([...(db().convs[me().id] ?? [])].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn)))
    }
    return apiClient.get<ConversacionDto[]>(BASE).then((r) => r.data)
  },

  /** Al abrir la conversación sus mensajes quedan leídos. */
  async messages(id: string): Promise<MensajeDto[]> {
    if (env.useMocks) {
      failIfScenario()
      own(id).noLeidos = 0
      return mockDelay(db().msgs[id] ?? [])
    }
    return apiClient.get<MensajeDto[]>(`${BASE}/${encodeURIComponent(id)}/messages`).then((r) => r.data)
  },

  async send(id: string, texto: string): Promise<MensajeDto> {
    const t = texto.trim()
    if (!t) throw new ApiError(400, 'Escribe un mensaje.')
    if (t.length > MAX_MENSAJE) throw new ApiError(400, `El mensaje no puede superar ${MAX_MENSAJE} caracteres.`)
    if (env.useMocks) {
      failIfScenario('conflicto')
      const c = own(id)
      const m: MensajeDto = { id: `m-${Date.now().toString(36)}`, conversacionId: id, autorId: me().id, texto: t, enviadoEn: new Date().toISOString() }
      ;(db().msgs[id] ??= []).push(m)
      c.ultimoMensaje = t
      c.actualizadaEn = m.enviadoEn
      return mockDelay(m, 300)
    }
    return apiClient.post<MensajeDto>(`${BASE}/${encodeURIComponent(id)}/messages`, { texto: t }).then((r) => r.data)
  },
}
