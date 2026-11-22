/**
 * DTOs de ms-notificaciones (Estación Guatoque Jiraguas · puerto 8300, vía API Gateway).
 * Provisionales: ajustar a los del Swagger cuando esté publicado.
 */

import type { PlanUsuario } from '@/modules/transacciones/types/plan.dto'

/** Plan de la persona: Radar (gratis) tiene límite de alertas activas; Radar+ no. */
export { PLAN_LABEL, type PlanUsuario } from '@/modules/transacciones/types/plan.dto'

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

/** Los 9 tipos de aviso de ms-notificaciones (el back dirige cada aviso al usuario del evento, no al rol). */
export const TIPOS_AVISO = [
  'REPOSICION_STOCK', 'COINCIDENCIA_BUSQUEDA', 'MENSAJE_NUEVO', 'CAMBIO_DONACION', 'MODERACION_PRENDA',
  'SOLICITUD_DONACION', 'PRENDA_VENDIDA', 'PAGO_CONFIRMADO', 'SISTEMA',
] as const
export type TipoNotificacion = (typeof TIPOS_AVISO)[number]

/** SR-RF-105: cada tipo llega siempre a la plataforma; el correo es adicional. */
export type CanalAviso = 'SOLO_PLATAFORMA' | 'CORREO_Y_PLATAFORMA'
export interface PreferenciaAvisoDto { tipo: TipoNotificacion; canal: CanalAviso }

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
