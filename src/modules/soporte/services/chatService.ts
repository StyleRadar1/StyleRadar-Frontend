import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedConversations, seedMessages } from '../mocks/chat'
import { MAX_MENSAJE, TIPO_ESPEJO, type ConversacionDto, type IniciarConversacionDto, type MensajeDto } from '../types/chat.dto'

/** Rutas del API Gateway hacia ms-chat. Provisionales hasta tener el Swagger. */
const BASE = '/api/chat/conversations'

/** Se dispara cuando cambia algo que mueve el contador de mensajes sin leer del menú. */
export const CHAT_CHANGED = 'sr:chat'
const changed = () => window.dispatchEvent(new Event(CHAT_CHANGED))

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
/** Cada participante tiene su copia de la conversación (su contador de no leídos y su etiqueta). */
const copies = (id: string) => Object.entries(db().convs).flatMap(([owner, l]) => l.filter((c) => c.id === id).map((c) => [owner, c] as const))
const mismaReferencia = (c: ConversacionDto, req: IniciarConversacionDto) =>
  c.contacto.id === req.contacto.id && (c.referenciaId ?? c.asunto) === (req.referenciaId ?? req.asunto)

export const chatService = {
  /** RF-40, RF-41 y RF-73: bandeja de la persona, la tienda o la fundación. */
  async conversations(): Promise<ConversacionDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay([...(db().convs[me().id] ?? [])].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn)))
    }
    return apiClient.get<ConversacionDto[]>(BASE).then((r) => r.data)
  },

  /** Total de mensajes sin leer, para el ícono de mensajes del menú. */
  async unreadCount(): Promise<number> {
    const l = await this.conversations()
    return l.reduce((n, c) => n + c.noLeidos, 0)
  },

  /**
   * RF-40 y RF-73: abre una conversación desde una publicación, una prenda de tienda o una donación.
   * Si ya existe una con la misma persona sobre lo mismo, devuelve esa en lugar de duplicarla.
   */
  async start(req: IniciarConversacionDto): Promise<ConversacionDto> {
    if (env.useMocks) {
      failIfScenario()
      const yo = me()
      if (req.contacto.id === yo.id) throw new ApiError(400, 'Es tu propia publicación: no puedes escribirte a ti misma o a ti mismo.')
      const mias = (db().convs[yo.id] ??= [])
      const existente = mias.find((c) => mismaReferencia(c, req))
      if (existente) return mockDelay(existente, 200)
      const ahora = new Date().toISOString()
      const c: ConversacionDto = { id: `c-${Date.now().toString(36)}`, contacto: req.contacto, asunto: req.asunto, referenciaId: req.referenciaId, noLeidos: 0, actualizadaEn: ahora }
      mias.push(c)
      // La otra persona la ve en su bandeja cuando llegue el primer mensaje (y si es una cuenta de prueba, se puede comprobar entrando con ella)
      ;(db().convs[req.contacto.id] ??= []).push({ ...c, contacto: { id: yo.id, nombre: yo.name, tipo: TIPO_ESPEJO[req.contacto.tipo] } })
      db().msgs[c.id] = []
      return mockDelay(c, 300)
    }
    return apiClient.post<ConversacionDto>(BASE, req).then((r) => r.data)
  },

  /** Al abrir la conversación sus mensajes quedan leídos. */
  async messages(id: string): Promise<MensajeDto[]> {
    if (env.useMocks) {
      failIfScenario()
      const c = own(id)
      if (c.noLeidos) { c.noLeidos = 0; changed() }
      return mockDelay(db().msgs[id] ?? [])
    }
    const r = await apiClient.get<MensajeDto[]>(`${BASE}/${encodeURIComponent(id)}/messages`)
    changed()
    return r.data
  },

  async send(id: string, texto: string): Promise<MensajeDto> {
    const t = texto.trim()
    if (!t) throw new ApiError(400, 'Escribe un mensaje.')
    if (t.length > MAX_MENSAJE) throw new ApiError(400, `El mensaje no puede superar ${MAX_MENSAJE} caracteres.`)
    if (env.useMocks) {
      failIfScenario('conflicto')
      own(id)
      const yo = me().id
      const m: MensajeDto = { id: `m-${Date.now().toString(36)}`, conversacionId: id, autorId: yo, texto: t, enviadoEn: new Date().toISOString() }
      ;(db().msgs[id] ??= []).push(m)
      for (const [owner, c] of copies(id)) {
        c.ultimoMensaje = t
        c.actualizadaEn = m.enviadoEn
        if (owner !== yo) c.noLeidos += 1
      }
      return mockDelay(m, 300)
    }
    return apiClient.post<MensajeDto>(`${BASE}/${encodeURIComponent(id)}/messages`, { texto: t }).then((r) => r.data)
  },
}
