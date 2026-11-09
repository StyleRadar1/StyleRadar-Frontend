import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { mockPlanOf } from '@/modules/transacciones/services/userPlanService'
import { LIMITES_RADAR } from '@/modules/transacciones/types/plan.dto'
import { seedAlerts } from '../mocks/notifications'
import { alertasActivas, type AlertaPrendaDto, type AlertasResumenDto, type BusquedaGuardadaDto } from '../types/notification.dto'

/** Rutas del API Gateway hacia ms-notificaciones. Provisionales hasta tener el Swagger. */
const BASE = '/api/notifications'

let store: Record<string, AlertasResumenDto> | null = null
const db = () => (store ??= seedAlerts())
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetAlertsMock = () => { store = null }

/** El límite sale del plan de la persona (ms-pagos), para que cambie apenas se cambia de plan. */
const mine = (): AlertasResumenDto => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  const r = (db()[u.id] ??= { plan: 'RADAR', limiteAlertas: LIMITES_RADAR.alertas, alertas: [], busquedas: [] })
  r.plan = mockPlanOf(u.id)
  r.limiteAlertas = r.plan === 'RADAR' ? LIMITES_RADAR.alertas : null
  return r
}

/** P8: en el plan Radar no se puede activar una alerta más allá del límite. */
const checkLimit = (r: AlertasResumenDto) => {
  if (r.limiteAlertas !== null && alertasActivas(r) >= r.limiteAlertas) {
    throw new ApiError(422, `Con el plan Radar puedes tener hasta ${r.limiteAlertas} alertas activas. Apaga alguna o pásate a Radar+.`)
  }
}

export const alertService = {
  /** RF-28 y RF-29: búsquedas guardadas y alertas de prendas, con el plan para aplicar el límite. */
  async summary(): Promise<AlertasResumenDto> {
    if (env.useMocks) { failIfScenario(); return mockDelay(mine()) }
    return apiClient.get<AlertasResumenDto>(`${BASE}/alerts`).then((r) => r.data)
  },

  /** RF-29 y RF-32: activar o desactivar la alerta de una prenda. */
  async setAlert(id: string, activa: boolean): Promise<AlertaPrendaDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const r = mine()
      const a = r.alertas.find((x) => x.id === id)
      if (!a) throw new ApiError(404, 'Esa alerta ya no existe.')
      if (activa && !a.activa) checkLimit(r)
      a.activa = activa
      return mockDelay(a, 250)
    }
    return apiClient.patch<AlertaPrendaDto>(`${BASE}/alerts/${encodeURIComponent(id)}`, { activa }).then((r) => r.data)
  },

  async removeAlert(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      const r = mine()
      r.alertas = r.alertas.filter((x) => x.id !== id)
      return mockDelay(undefined, 250)
    }
    await apiClient.delete(`${BASE}/alerts/${encodeURIComponent(id)}`)
  },

  /** RF-30: activar o desactivar el aviso de una búsqueda guardada. */
  async setSearchAlert(id: string, alerta: boolean): Promise<BusquedaGuardadaDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      const r = mine()
      const s = r.busquedas.find((x) => x.id === id)
      if (!s) throw new ApiError(404, 'Esa búsqueda ya no existe.')
      if (alerta && !s.alerta) checkLimit(r)
      s.alerta = alerta
      return mockDelay(s, 250)
    }
    return apiClient.patch<BusquedaGuardadaDto>(`${BASE}/saved-searches/${encodeURIComponent(id)}`, { alerta }).then((r) => r.data)
  },

  async removeSearch(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      const r = mine()
      r.busquedas = r.busquedas.filter((x) => x.id !== id)
      return mockDelay(undefined, 250)
    }
    await apiClient.delete(`${BASE}/saved-searches/${encodeURIComponent(id)}`)
  },
}
