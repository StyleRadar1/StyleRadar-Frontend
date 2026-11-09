/**
 * DTOs de ms-notificaciones (Estación Guatoque Jiraguas · puerto 8300, vía API Gateway).
 * Provisionales: ajustar a los del Swagger cuando esté publicado.
 */

/** Plan de la persona: Radar (gratis) tiene límite de alertas activas; Radar+ no. */
export type PlanUsuario = 'RADAR' | 'RADAR_PLUS'

export const PLAN_LABEL: Record<PlanUsuario, string> = { RADAR: 'Radar', RADAR_PLUS: 'Radar+' }

/** RF-29: alerta de disponibilidad de una prenda agotada. */
export interface AlertaPrendaDto {
  id: string
  prendaId: string
  prenda: string
  tienda: string
  activa: boolean
  creadaEn: string
}

/** RF-28: búsqueda guardada; con `alerta` activa avisa cuando llega una prenda que coincide (RF-30). */
export interface BusquedaGuardadaDto {
  id: string
  nombre: string
  descripcion: string
  alerta: boolean
  coincidenciasNuevas: number
  creadaEn: string
}

/** Respuesta de «Búsquedas y alertas»: incluye el plan para aplicar el límite (P8). */
export interface AlertasResumenDto {
  plan: PlanUsuario
  /** Alertas activas permitidas; `null` = sin límite (Radar+). */
  limiteAlertas: number | null
  alertas: AlertaPrendaDto[]
  busquedas: BusquedaGuardadaDto[]
}

export type TipoNotificacion = 'NUEVA_COINCIDENCIA' | 'DISPONIBILIDAD_RESTABLECIDA' | 'MENSAJE'

/** RF-31: aviso que se muestra en la campana. */
export interface NotificacionDto {
  id: string
  tipo: TipoNotificacion
  titulo: string
  detalle: string
  enlace?: string
  leida: boolean
  creadaEn: string
}

/** Alertas activas en total: las de prendas más las búsquedas con alerta. */
export const alertasActivas = (r: Pick<AlertasResumenDto, 'alertas' | 'busquedas'>) =>
  r.alertas.filter((a) => a.activa).length + r.busquedas.filter((b) => b.alerta).length
