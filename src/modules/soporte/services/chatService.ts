import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { aRol } from '@/modules/core/types/roles'
import { seedConversations, seedMessages } from '../mocks/chat'
import { aNotificacion } from '../utils/notificaciones'
import { aConversacion, aMensaje, filasDe, idDelOtro, necesitaNombre } from './chatMapper'
import { NOTIFICACIONES, NOTIFICATIONS_CHANGED } from './notificationService'
import { MAX_MENSAJE, TIPO_ESPEJO, type ConversacionDto, type IniciarConversacionDto, type MensajeDto } from '../types/chat.dto'

/** Rutas de ms-chat según su Swagger, vía API Gateway. */
const MIS_CONVERSACIONES = '/api/v1/users/conversations'
const BANDEJA_ALMACEN = '/api/v1/stores/conversations'
const conversacion = (id: string) => `/api/v1/conversations/${encodeURIComponent(id)}/messages`
/** Cada tipo de conversación se abre desde su propia ruta: tienda (SR-RF-73), vendedor (SR-RF-40) o donación (GJ-57). */
const inicio = (req: IniciarConversacionDto) =>
  req.contacto.tipo === 'TIENDA' ? `/api/v1/stores/${encodeURIComponent(req.nit ?? req.contacto.id)}/conversations`
  : req.contacto.tipo === 'VENDEDOR' ? `/api/v1/second-hand/publications/${encodeURIComponent(req.referenciaId ?? '')}/conversations`
  : `/api/v1/donations/${encodeURIComponent(req.referenciaId ?? '')}/conversations`

/** Rol de la sesión: el almacén lee su bandeja; las demás cuentas, «mis conversaciones». */
const rolDeSesion = (): string | null => {
  try { return aRol(JSON.parse(localStorage.getItem('sr_user') ?? 'null')?.role) } catch { return null }
}

/** Pide todas las páginas de una lista de ms-chat (hasta 100 por página, tope de 10 páginas). */
async function todas(ruta: string, size: number): Promise<Record<string, unknown>[]> {
  const filas: Record<string, unknown>[] = []
  for (let page = 0; page < 10; page++) {
    const { data } = await apiClient.get<unknown>(ruta, { params: { page, size } })
    const p = filasDe(data)
    filas.push(...p.filas)
    if (page + 1 >= p.totalPages) break
  }
  return filas
}

/** ms-chat no guarda nombres: se piden a ms-usuarios por id y se recuerdan. Si falla, queda «Usuario #id». */
const nombresConocidos = new Map<string, string>()
async function nombreDe(uid: string): Promise<void> {
  if (!uid || nombresConocidos.has(uid)) return
  try {
    const { data } = await apiClient.get<{ nombre?: string; name?: string }>(`/api/v1/usuarios/${encodeURIComponent(uid)}`)
    const n = data?.nombre ?? data?.name
    if (n) nombresConocidos.set(uid, n)
  } catch { /* se queda con el nombre de respaldo */ }
}

/**
 * Los «sin leer» del chat viven en ms-notificaciones: cada mensaje nuevo genera un aviso MENSAJE_NUEVO
 * con enlace a la conversación. Devuelve, por conversación, los ids de los avisos sin leer.
 */
async function avisosDeChat(): Promise<Map<string, string[]>> {
  const porConversacion = new Map<string, string[]>()
  try {
    const { data } = await apiClient.get<unknown>(NOTIFICACIONES, { params: { page: 0, size: 100, unreadOnly: true } })
    const filas = filasDe(data).filas
    for (const raw of filas) {
      const n = aNotificacion(raw)
      const m = n.enlace?.match(/^\/mensajes\?c=([^&]+)/)
      if (n.tipo === 'MENSAJE_NUEVO' && !n.leida && m) porConversacion.set(m[1], [...(porConversacion.get(m[1]) ?? []), n.id])
    }
  } catch { /* sin avisos: los contadores quedan en cero */ }
  return porConversacion
}

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
    const rol = rolDeSesion()
    // El administrador de StyleRadar no tiene conversaciones: no hay nada que pedir
    if (rol === 'STYLERADAR_ADMIN') return []
    const miId = String(mockSessionUser()?.id ?? '')
    const [filas, avisos] = await Promise.all([todas(rol === 'STORE_ADMIN' ? BANDEJA_ALMACEN : MIS_CONVERSACIONES, 100), avisosDeChat()])
    const ctx = { me: miId, rol, nombres: nombresConocidos }
    await Promise.all([...new Set(filas.filter((f) => necesitaNombre(f, ctx)).map((f) => idDelOtro(f, miId)))].map(nombreDe))
    return filas
      .map((f) => aConversacion(f, ctx, avisos.get(String(f.id))?.length ?? 0))
      .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
  },

  /** Total de mensajes sin leer, para el ícono de mensajes del menú. */
  async unreadCount(): Promise<number> {
    const l = await this.conversations()
    return l.reduce((n, c) => n + c.noLeidos, 0)
  },

  /**
   * RF-73 y RF-41: abre una conversación desde una prenda del catálogo o una donación.
   * Si ya existe una con la misma persona sobre lo mismo, devuelve esa en lugar de duplicarla.
   */
  async start(req: IniciarConversacionDto): Promise<ConversacionDto> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('publicacion-propia', 422)
      failWithScenario('publicaciones-caido', 503)
      const yo = me()
      // Como ms-chat: escribir sobre una publicación propia o no disponible es 422
      if (req.contacto.id === yo.id) throw new ApiError(422, 'Publicación propia.')
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
    // Cuerpo provisional {texto}: es el primer mensaje que pide el endpoint. Ajustar al esquema del Swagger.
    // Tienda y segunda mano llevan el primer mensaje ({ text }); la donación no lleva cuerpo
    const cuerpo = req.contacto.tipo === 'TIENDA' || req.contacto.tipo === 'VENDEDOR'
      ? { text: req.primerMensaje ?? `Hola, me interesa: ${req.asunto}` }
      : undefined
    const { data } = await apiClient.post<Record<string, unknown>>(inicio(req), cuerpo)
    return aConversacion(data, { me: String(mockSessionUser()?.id ?? ''), rol: rolDeSesion(), nombres: nombresConocidos })
  },

  /** Al abrir la conversación sus mensajes quedan leídos. */
  async messages(id: string): Promise<MensajeDto[]> {
    if (env.useMocks) {
      failIfScenario()
      const c = own(id)
      if (c.noLeidos) { c.noLeidos = 0; changed() }
      return mockDelay(db().msgs[id] ?? [])
    }
    // Vienen paginados y en orden cronológico (los más antiguos primero): se juntan todas las páginas
    const filas = await todas(conversacion(id), 100)
    // Abrir la conversación deja leídos sus avisos de mensaje nuevo; eso baja el contador del menú
    const pendientes = (await avisosDeChat()).get(id) ?? []
    await Promise.allSettled(pendientes.map((aviso) => apiClient.patch(`${NOTIFICACIONES}/${encodeURIComponent(aviso)}/read`)))
    if (pendientes.length) window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
    const r = { data: filas.map(aMensaje) }
    changed()
    return r.data
  },

  async send(id: string, texto: string): Promise<MensajeDto> {
    const t = texto.trim()
    if (!t) throw new ApiError(400, 'Escribe un mensaje.')
    if (t.length > MAX_MENSAJE) throw new ApiError(400, `El mensaje no puede superar ${MAX_MENSAJE} caracteres.`)
    if (env.useMocks) {
      failIfScenario('conflicto')
      failWithScenario('chat-cerrado', 422)
      failWithScenario('publicaciones-caido', 503)
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
    return apiClient.post<unknown>(conversacion(id), { text: t }).then((r) => aMensaje(r.data))
  },
}
