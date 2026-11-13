import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
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
    throw new ApiError(422, `Con el plan Radar puedes tener hasta ${r.limiteAlertas} alertas activas. Apaga alguna o pásate a Radar+.`, LIMITE_PLAN)
  }
}

/** Código propio del front para el límite del plan Radar: el backend no lo aplica (lo hace el React). */
export const LIMITE_PLAN = 'LIMITE_PLAN'

/** Escenarios de prueba para cambiar o borrar una alerta ajena o ya borrada. */
const alertaAjenaOBorrada = () => {
  failWithScenario('alerta-ajena', 403, 'FORBIDDEN')
  failWithScenario('alerta-borrada', 404)
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
      alertaAjenaOBorrada()
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
      alertaAjenaOBorrada()
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
      failWithScenario('busqueda-pendiente', 422)
      alertaAjenaOBorrada()
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
      alertaAjenaOBorrada()
      const r = mine()
      r.busquedas = r.busquedas.filter((x) => x.id !== id)
      return mockDelay(undefined, 250)
    }
    await apiClient.delete(`${BASE}/saved-searches/${encodeURIComponent(id)}`)
  },

  /** RF-28: guarda la búsqueda del catálogo (la guarda ms-usuarios; la alerta va aparte). */
  async saveSearch(nombre: string, descripcion: string): Promise<BusquedaGuardadaDto> {
    if (env.useMocks) {
      failIfScenario()
      const r = mine()
      const ya = r.busquedas.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase())
      if (ya) return mockDelay(ya, 200)
      const nueva: BusquedaGuardadaDto = { id: `b-${Date.now().toString(36)}`, nombre, descripcion, alerta: false, coincidenciasNuevas: 0, creadaEn: new Date().toISOString() }
      r.busquedas.unshift(nueva)
      return mockDelay(nueva, 250)
    }
    return apiClient.post<BusquedaGuardadaDto>(`${BASE}/saved-searches`, { nombre, descripcion }).then((r) => r.data)
  },

  /**
   * RF-29: «Avisarme» en una prenda. El servidor responde 409 si ya hay una alerta, 422 si la prenda
   * sí tiene unidades y 503 si no pudo consultar el catálogo.
   */
  async createAlert(prendaId: string, prenda: string, tienda: string, talla?: string): Promise<AlertaPrendaDto> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('alerta-duplicada', 409)
      failWithScenario('alerta-con-stock', 422)
      failWithScenario('catalogo-caido', 503)
      const r = mine()
      if (r.alertas.some((x) => x.prendaId === prendaId && x.activa)) throw new ApiError(409, 'Ya existe una alerta activa para esa prenda.')
      checkLimit(r)
      const nueva: AlertaPrendaDto = { id: `a-${Date.now().toString(36)}`, prendaId, prenda: talla ? `${prenda} · talla ${talla}` : prenda, tienda, activa: true, creadaEn: new Date().toISOString() }
      r.alertas.unshift(nueva)
      return mockDelay(nueva, 250)
    }
    return apiClient.post<AlertaPrendaDto>(`${BASE}/alerts`, { prendaId, talla }).then((r) => r.data)
  },
}
