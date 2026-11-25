import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { seedNotifications } from '../mocks/notifications'
import type { NotificacionDto } from '../types/notification.dto'
import { aNotificacion } from '../utils/notificaciones'
import { idNumericoSesion, rutaUsuario } from '../utils/rutaUsuario'

/** Rutas de ms-notificaciones según su Swagger, vía API Gateway: /api/v1/users/{id}/notifications. */
export const notificaciones = () => `${rutaUsuario()}/notifications`
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

/**
 * Eliminar avisos: estas rutas piden el id NUMÉRICO de la persona (no el alias «me»), el mismo del token.
 * Se elimina de la bandeja (el back no tiene «restaurar»; el «Deshacer» de la pantalla es solo del front).
 */
const idNumerico = (): string => {
  const id = idNumericoSesion()
  if (!id) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return id
}
const RUTA_USUARIO = (id: string) => `/api/v1/users/${id}/notifications`
/** El servicio acepta de 1 a 100 ids por petición. */
export const MAX_ELIMINAR = 100
const eliminadas = (data: unknown) => Number((data as { cantidadEliminadas?: number } | null)?.cantidadEliminadas ?? 0) || 0

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
    const { data } = await apiClient.get<unknown>(notificaciones(), { params: { page: n, size: TAM_PAGINA } })
    const p = (Array.isArray(data) ? { content: data } : (data ?? {})) as { content?: unknown[]; hasNext?: boolean }
    return { items: (p.content ?? []).map((x) => aNotificacion(x)), hasNext: !!p.hasNext }
  },

  /** Primera página (para quien solo necesita los más recientes). */
  async list(): Promise<NotificacionDto[]> {
    return (await this.page(0)).items
  },

  async unreadCount(): Promise<number> {
    if (env.useMocks) { failIfScenario(); return mockDelay(mine().filter((n) => !n.leida).length, 150) }
    return apiClient.get<{ cantidadNoLeidas: number }>(`${notificaciones()}/unread/count`).then((r) => r.data.cantidadNoLeidas ?? 0)
  },

  async markRead(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('alerta-ajena', 403)
      failWithScenario('alerta-borrada', 404)
      const n = mine().find((x) => x.id === id)
      if (n) n.leida = true
      await mockDelay(undefined, 150)
    } else await apiClient.patch(`${notificaciones()}/${encodeURIComponent(id)}/read`)
    changed()
  },

  /** Quita un aviso de la bandeja. Un 404 se toma como éxito: ya no estaba. */
  async remove(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      const lista = mine()
      const i = lista.findIndex((x) => x.id === id)
      if (i >= 0) lista.splice(i, 1)
      await mockDelay(undefined, 150)
    } else {
      try { await apiClient.delete(`${RUTA_USUARIO(idNumerico())}/${encodeURIComponent(id)}`) } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) throw e
      }
    }
    changed()
  },

  /** Quita varios avisos (leídos o no). Más de 100 se envían en tandas de 100. Devuelve cuántos se eliminaron de verdad. */
  async removeMany(ids: string[]): Promise<number> {
    const unicos = [...new Set(ids)]
    if (!unicos.length) return 0
    let total = 0
    if (env.useMocks) {
      failIfScenario()
      const lista = mine()
      const antes = lista.length
      const quitar = new Set(unicos)
      lista.splice(0, lista.length, ...lista.filter((x) => !quitar.has(x.id)))
      total = antes - lista.length
      await mockDelay(undefined, 200)
    } else {
      const uid = idNumerico()
      for (let i = 0; i < unicos.length; i += MAX_ELIMINAR) {
        const { data } = await apiClient.delete<unknown>(RUTA_USUARIO(uid), { params: { ids: unicos.slice(i, i + MAX_ELIMINAR).join(',') } })
        total += eliminadas(data)
      }
    }
    changed()
    return total
  },

  /** Quita todos los avisos leídos; los no leídos se conservan. Devuelve cuántos se eliminaron. */
  async removeRead(): Promise<number> {
    let total: number
    if (env.useMocks) {
      failIfScenario()
      const lista = mine()
      const antes = lista.length
      lista.splice(0, lista.length, ...lista.filter((x) => !x.leida))
      total = antes - lista.length
      await mockDelay(undefined, 200)
    } else {
      const { data } = await apiClient.delete<unknown>(RUTA_USUARIO(idNumerico()), { params: { read: true } })
      total = eliminadas(data)
    }
    changed()
    return total
  },

  async markAllRead(): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      mine().forEach((n) => { n.leida = true })
      await mockDelay(undefined, 200)
    } else await apiClient.patch(`${notificaciones()}/read-all`)
    changed()
  },
}
