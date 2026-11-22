import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { mockPlanOf } from '@/modules/transacciones/services/userPlanService'
import { LIMITES_RADAR } from '@/modules/transacciones/types/plan.dto'
import { seedAlerts } from '../mocks/notifications'
import { itemService } from '@/modules/catalogo/services/itemService'
import { type AlertaPrendaDto, type AlertasResumenDto, type BusquedaGuardadaDto } from '../types/notification.dto'

/** Rutas de ms-notificaciones según su Swagger, vía API Gateway. «me» es el usuario del token. */
const ALERTAS = '/api/v1/users/me/alerts'
/** Las búsquedas guardadas son de ms-usuarios; su ruta sigue provisional hasta tener su Swagger. */
const BUSQUEDAS = '/api/notifications/saved-searches'

const texto = (v: unknown) => (typeof v === 'string' && v ? v : undefined)

/**
 * Convierte la lista de alertas del servidor (solo ids) a las dos listas de la pantalla.
 * Una alerta con busquedaGuardadaId es de búsqueda; las demás, de una prenda agotada.
 * Los nombres de campo se toleran hasta tener el esquema del Swagger.
 */
async function aResumen(data: unknown): Promise<AlertasResumenDto> {
  const filas = (Array.isArray(data) ? data : ((data as { content?: unknown[] } | null)?.content ?? [])) as Record<string, unknown>[]
  const alertas: AlertaPrendaDto[] = []
  const busquedas: BusquedaGuardadaDto[] = []
  for (const r of filas) {
    const id = String(r.id ?? r.alertaId ?? '')
    const activa = String(r.estado ?? 'ACTIVA').toUpperCase() === 'ACTIVA'
    const creadaEn = texto(r.fechaCreacion ?? r.creadaEn) ?? new Date().toISOString()
    const busqueda = texto(r.busquedaGuardadaId)
    if (busqueda) busquedas.push({ id, nombre: 'Búsqueda guardada', descripcion: 'Te avisamos cuando llegue algo que coincida', alerta: activa, coincidenciasNuevas: 0, creadaEn })
    else {
      const talla = texto(r.tallaObjetivo)
      alertas.push({ id, prendaId: String(r.itemId ?? ''), prenda: talla ? `Prenda agotada · talla ${talla}` : 'Prenda agotada', tienda: '', activa, creadaEn })
    }
  }
  // La lista trae solo ids: el nombre y la tienda de cada prenda se piden al catálogo; si falla, queda el texto genérico
  await Promise.all(alertas.map(async (a) => {
    try {
      const p = await itemService.getById(a.prendaId)
      a.prenda = a.prenda.includes('talla') ? `${p.nombre} · ${a.prenda.split('· ')[1]}` : p.nombre
      a.tienda = p.tienda
    } catch { /* se queda con el texto genérico */ }
  }))
  const u = mockSessionUser()
  const plan = u ? mockPlanOf(u.id) : 'RADAR'
  return { plan, limiteAlertas: plan === 'RADAR' ? LIMITES_RADAR.alertas : null, alertas, busquedas }
}

/** Última lista leída: sirve para devolver la alerta actualizada sin pedir todo otra vez. */
let ultima: AlertasResumenDto | null = null

let store: Record<string, AlertasResumenDto> | null = null
const db = () => (store ??= seedAlerts())
/** Solo para pruebas: vuelve a los datos iniciales. */
export const resetAlertsMock = () => { store = null }

/** El plan de la persona (ms-pagos) define si las alertas están disponibles (solo en Radar+). */
const mine = (): AlertasResumenDto => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  const r = (db()[u.id] ??= { plan: 'RADAR', limiteAlertas: LIMITES_RADAR.alertas, alertas: [], busquedas: [] })
  r.plan = mockPlanOf(u.id)
  r.limiteAlertas = r.plan === 'RADAR' ? LIMITES_RADAR.alertas : null
  return r
}

/** RF-102: en el plan Radar no hay alertas de disponibilidad; solo en Radar+. */
const checkLimit = (r: AlertasResumenDto) => {
  if (r.plan === 'RADAR') {
    throw new ApiError(422, 'Esta función está disponible en el plan Radar+', LIMITE_PLAN)
  }
}

/** Código propio del front para el límite del plan Radar: el backend no lo aplica (lo hace el React). */
export const LIMITE_PLAN = 'LIMITE_PLAN'

/** Escenarios de prueba para cambiar o borrar una alerta ajena o ya borrada. */
const alertaAjenaOBorrada = () => {
  failWithScenario('alerta-ajena', 403, 'FORBIDDEN')
  failWithScenario('alerta-borrada', 404)
}

/** Activar es PATCH /alerts/{id}/activate; apagar es DELETE /alerts/{id} (desactiva, no borra). */
const cambiarEstado = async (id: string, activa: boolean) => {
  const url = `${ALERTAS}/${encodeURIComponent(id)}`
  if (activa) await apiClient.patch(`${url}/activate`)
  else await apiClient.delete(url)
}

export const alertService = {
  /** RF-28 y RF-29: búsquedas guardadas y alertas de prendas, con el plan para aplicar el límite. */
  async summary(): Promise<AlertasResumenDto> {
    if (env.useMocks) { failIfScenario(); return mockDelay(mine()) }
    return aResumen((await apiClient.get<unknown>(ALERTAS)).data).then((r) => (ultima = r))
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
    await cambiarEstado(id, activa)
    const a = ultima?.alertas.find((x) => x.id === id)
    if (!a) throw new ApiError(404, 'Esa alerta ya no existe.')
    return (a.activa = activa, a)
  },

  /**
   * «Cancelar seguimiento»: el servicio no borra la alerta, la desactiva (DELETE). Queda en la lista como apagada
   * y se puede volver a encender; ya no genera avisos.
   */
  async cancelAlert(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      alertaAjenaOBorrada()
      const a = mine().alertas.find((x) => x.id === id)
      if (!a) throw new ApiError(404, 'Esa alerta ya no existe.')
      a.activa = false
      return mockDelay(undefined, 250)
    }
    await cambiarEstado(id, false)
  },

  /**
   * ¿Ya sigo esta prenda (y talla)? Sirve para pintar el botón «Avisarme» sin descargar la lista.
   * Si el servicio no responde, el botón se ve como «Avisarme» y el 409 de crear evita duplicados.
   */
  async check(itemId: string, talla?: string): Promise<{ suscrita: boolean; alertaId?: string }> {
    if (env.useMocks) {
      const a = mine().alertas.find((x) => x.prendaId === itemId && x.activa)
      return mockDelay(a ? { suscrita: true, alertaId: a.id } : { suscrita: false }, 120)
    }
    try {
      const { data } = await apiClient.get<{ suscrita?: boolean; alertaId?: string | number }>(`${ALERTAS}/check`, { params: { itemId, tallaObjetivo: talla || undefined } })
      return { suscrita: !!data.suscrita, alertaId: data.alertaId != null ? String(data.alertaId) : undefined }
    } catch { return { suscrita: false } }
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
    await cambiarEstado(id, alerta)
    const s = ultima?.busquedas.find((x) => x.id === id)
    if (!s) throw new ApiError(404, 'Esa búsqueda ya no existe.')
    return (s.alerta = alerta, s)
  },

  async removeSearch(id: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      alertaAjenaOBorrada()
      const r = mine()
      r.busquedas = r.busquedas.filter((x) => x.id !== id)
      return mockDelay(undefined, 250)
    }
    await apiClient.delete(`${BUSQUEDAS}/${encodeURIComponent(id)}`)
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
    return apiClient.post<BusquedaGuardadaDto>(BUSQUEDAS, { nombre, descripcion }).then((r) => r.data)
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
    // tipoAlerta del back: ITEM_AGOTADO (prenda agotada) o BUSQUEDA_GUARDADA
    const { data } = await apiClient.post<{ id?: string | number; alertaId?: string | number }>(ALERTAS, { tipoAlerta: 'ITEM_AGOTADO', itemId: prendaId, tallaObjetivo: talla || undefined, canal: 'IN_APP' })
    return { id: String(data.id ?? data.alertaId ?? ''), prendaId, prenda: talla ? `${prenda} · talla ${talla}` : prenda, tienda, activa: true, creadaEn: new Date().toISOString() }
  },
}
