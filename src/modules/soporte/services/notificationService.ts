import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedNotifications } from '../mocks/notifications'
import type { NotificacionDto } from '../types/notification.dto'
import { aNotificacion } from '../utils/notificaciones'

const idSesion = () => {
  const id = mockSessionUser()?.id
  if (!id) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return String(id)
}

/** Rutas de ms-notificaciones según su relación FINAL (sin /me), vía API Gateway. */
export const notificacionesUrl = () => `/api/v1/users/${encodeURIComponent(idSesion())}/notifications`
/** La campana escucha este evento para actualizar el contador sin esperar a la próxima consulta. */
export const NOTIFICATIONS_CHANGED = 'sr:notificaciones'

let store: Record<string, NotificacionDto[]> | null = null
const db = () => (store ??= seedNotifications())
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetNotificationsMock = () => { store = null }

const mine = (): NotificacionDto[] => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return (db()[u.id] ??= [])
}
const changed = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))

/** Avisos por página; el back acepta de 1 a 100. */
export const TAM_PAGINA = 20
export interface PaginaAvisos { items: NotificacionDto[]; hasNext: boolean }

export const notificationService = {
  /** RF-31: una página de avisos, los más recientes primero. `hasNext` dice si hay más al seguir bajando. */
  async page(n = 0): Promise<PaginaAvisos> {
    if (env.useMocks) {
      failIfScenario()
      const todos = [...mine()].sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
      const items = todos.slice(n * TAM_PAGINA, (n + 1) * TAM_PAGINA)
      return mockDelay({ items, hasNext: todos.length > (n + 1) * TAM_PAGINA })
    }
    // Con page y size devuelve { content, hasNext, … }; sin parámetros, un arreglo
    const { data } = await apiClient.get<unknown>(notificacionesUrl(), { params: { page: n, size: TAM_PAGINA } })
    const p = (Array.isArray(data) ? { content: data } : (data ?? {})) as { content?: unknown[]; hasNext?: boolean }
    return { items: (p.content ?? []).map((x) => aNotificacion(x)), hasNext: !!p.hasNext }
  },

  /** Primera página (para quien solo necesita los más recientes). */
  async list(): Promise<NotificacionDto[]> {
    return (await this.page(0)).items
  },

  async unreadCount(): Promise<number> {
    if (env.useMocks) { failIfScenario(); return mockDelay(mine().filter((n) => !n.leida).length, 150) }
    return apiClient.get<{ cantidadNoLeidas: number }>(`${notificacionesUrl()}/unread/count`).then((r) => r.data.cantidadNoLeidas ?? 0)
  },

  async markRead(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('alerta-ajena', 403)
      failWithScenario('alerta-borrada', 404)
      const n = mine().find((x) => x.id === id)
      if (n) n.leida = true
      await mockDelay(undefined, 150)
    } else await apiClient.patch(`${notificacionesUrl()}/${encodeURIComponent(id)}/read`)
    changed()
  },

  async markAllRead(): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      mine().forEach((n) => { n.leida = true })
      await mockDelay(undefined, 200)
    } else await apiClient.patch(`${notificacionesUrl()}/read-all`)
    changed()
  },
}
