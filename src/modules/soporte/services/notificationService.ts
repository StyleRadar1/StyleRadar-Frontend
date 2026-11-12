import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedNotifications } from '../mocks/notifications'
import type { NotificacionDto } from '../types/notification.dto'

/** Rutas del API Gateway hacia ms-notificaciones. Provisionales hasta tener el Swagger. */
const BASE = '/api/notifications'
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

export const notificationService = {
  /** RF-31: avisos más recientes primero. */
  async list(): Promise<NotificacionDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay([...mine()].sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))) }
    return apiClient.get<NotificacionDto[]>(BASE, { params: { page: 0, size: 20 } }).then((r) => r.data)
  },

  async unreadCount(): Promise<number> {
    if (env.useMocks) { failIfScenario(); return mockDelay(mine().filter((n) => !n.leida).length, 150) }
    return apiClient.get<{ count: number }>(`${BASE}/unread-count`).then((r) => r.data.count)
  },

  async markRead(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('alerta-ajena', 403)
      failWithScenario('alerta-borrada', 404)
      const n = mine().find((x) => x.id === id)
      if (n) n.leida = true
      await mockDelay(undefined, 150)
    } else await apiClient.patch(`${BASE}/${encodeURIComponent(id)}/read`)
    changed()
  },

  async markAllRead(): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      mine().forEach((n) => { n.leida = true })
      await mockDelay(undefined, 200)
    } else await apiClient.patch(`${BASE}/read-all`)
    changed()
  },
}
