/**
 * Planes de StyleRadar (P7) y plan de la persona (P8). El plan real lo entrega ms-pagos-suscripciones
 * (puerto 8400, vía API Gateway). Precios y beneficios provisionales: falta validarlos con Transacciones.
 */
export type PlanUsuario = 'RADAR' | 'RADAR_PLUS'
export type PlanMockScenario = 'NORMAL' | 'DEGRADADO_POR_PAGO' | 'RENOVACION_PENDIENTE'

export const PLAN_LABEL: Record<PlanUsuario, string> = { RADAR: 'Radar', RADAR_PLUS: 'Radar+' }

export interface MiPlanDto {
  plan: PlanUsuario
  suscripcionId?: string
  estado?: SubscriptionStatus
  fechaInicio?: string | null
  fechaFin?: string | null
  /** Fecha del próximo cobro; vacía en el plan gratis. */
  proximoCobro?: string
  /** Fecha hasta la que dura el periodo ya pagado cuando se cancela la renovación (RF-101). */
  periodEndsAt?: string
  /** Estado de la renovación automática en Radar+ (RF-95, RF-101). */
  renewalEnabled?: boolean
  /** Indica si la cuenta pasó de Radar+ a Radar por falta de pago (RF-103). */
  degradedByPayment?: boolean
  /** Indica si el pago de renovación sigue PENDIENTE al terminar el periodo (RF-103). */
  pendingRenewal?: boolean
}

/** Lo que solo tiene Radar+ y se muestra con candado en el plan Radar (RF-102). */
export type FuncionPago = 'probador-foto' | 'alertas-sin-limite'

/**
 * Configuración única de beneficios y límites por plan (RF-102, B.14, A.3):
 * - RADAR: probador con maniquí. Sin alertas de disponibilidad y sin probador con foto propia.
 * - RADAR+: probador con foto propia con máximo 30 usos, y alertas de disponibilidad.
 */
export const PLAN_LIMITS = {
  alertas: 0,
  probadorFoto: 30,
  RADAR: {
    probadorManiqui: true,
    probadorFoto: 0,
    alertasDisponibilidad: false,
  },
  RADAR_PLUS: {
    probadorManiqui: true,
    probadorFoto: 30,
    alertasDisponibilidad: true,
  },
} as const

/** Alias de compatibilidad previa. */
export const LIMITES_RADAR = PLAN_LIMITS

export interface PlanInfo {
  id: string
  para: 'Personas' | 'Tiendas' | 'Fundaciones'
  nombre: string
  precio: number
  periodo: string
  nota: string
  incluye: string[]
  destacado?: boolean
}

/** Comparación de los planes de personas: [qué, Radar, Radar+] (RF-102, B.14, A.3). */
export const COMPARATIVA: [string, string, string][] = [
  ['Precio', '$0', '$14.900 al mes'],
  ['Tiendas, mapa y playlists', 'Sin límite', 'Sin límite'],
  ['Probador con maniquí', 'Sí', 'Sí'],
  ['Probador virtual con foto propia', 'No incluido', `Hasta ${PLAN_LIMITS.probadorFoto} usos`],
  ['Alertas de disponibilidad activas', 'No incluido', 'Incluidas'],
  ['Vender y donar en Segunda vida', 'Sí', 'Sí'],
  ['Chat con tiendas y vendedores', 'Sí', 'Sí'],
]

/** Reglas de negocio de los planes (RF-102, RF-101, RF-103). */
export const REGLAS: [string, string][] = [
  ['Plan Radar (gratis)', 'Incluye probador con maniquí. No incluye alertas de disponibilidad ni probador con foto propia'],
  ['Plan Radar+', `Incluye probador con foto propia con máximo ${PLAN_LIMITS.probadorFoto} usos y alertas de disponibilidad`],
  ['Candado de función', 'Esta función está disponible en el plan Radar+'],
  ['Límite de probador', `Alcanzaste el límite de ${PLAN_LIMITS.probadorFoto} usos del probador con foto propia`],
  ['Cambio de plan', 'El comprador puede activar Radar+ en cualquier momento mediante Mercado Pago'],
  ['Pago rechazado', 'El pago no fue aprobado. Puedes intentarlo nuevamente'],
  ['Bajada automática', 'Si una suscripción no se renueva o vence el ciclo, la cuenta pasa a Radar conservando tus fotos y alertas'],
  ['Tiendas', 'El periodo gratuito dura 30 días desde el registro. Después de 30 días se requiere la suscripción activa de Tienda aliada para mantener el catálogo visible'],
  ['Cancelación', 'La renovación se puede cancelar en cualquier momento; el plan sigue activo hasta el final del periodo pagado'],
  ['Fundaciones', 'Las fundaciones aliadas verificadas cuentan con acceso gratuito permanente'],
]

/** Tabla de precios de los planes (RF-102, A.3, B.14). */
export const PLANES: PlanInfo[] = [
  { id: 'RADAR', para: 'Personas', nombre: 'Radar', precio: 0, periodo: 'gratis', nota: 'Para descubrir tu estilo en la ciudad',
    incluye: ['Tiendas, mapa y playlists sin límite', 'Probador con el maniquí', 'Vender y donar en Segunda vida', 'Chat con tiendas y vendedores'] },
  { id: 'RADAR_PLUS', para: 'Personas', nombre: 'Radar+', precio: 14900, periodo: 'al mes', nota: 'Para probarte la ropa sobre ti y no perderte nada', destacado: true,
    incluye: ['Todo lo del plan Radar', `Probador con foto propia hasta ${PLAN_LIMITS.probadorFoto} usos`, 'Alertas de disponibilidad de prendas', 'Cancela la renovación cuando quieras'] },
  { id: 'TIENDA', para: 'Tiendas', nombre: 'Tienda aliada', precio: 89000, periodo: 'al mes', nota: 'Los primeros 30 días son gratis',
    incluye: ['Tu catálogo visible en el radar y en el mapa', 'Publica en 3 pasos, con inventario por talla', 'Distintivos automáticos: Nueva llegada y Últimas unidades', 'Estadísticas de visitas y mensajes', 'Cancela la renovación cuando quieras'] },
  { id: 'FUNDACION', para: 'Fundaciones', nombre: 'Fundación aliada', precio: 0, periodo: 'siempre', nota: 'Sin costo para las fundaciones verificadas',
    incluye: ['Recibe solicitudes de donación de personas y tiendas', 'Acepta, rechaza y coordina la entrega por mensajes', 'Tu página con misión, horario y lo que más necesitas', 'Estadísticas de lo que llega cada mes'] },
]

/** Plan de suscripción de StyleRadar. Tabla provisional del equipo. */
import type { PaymentMethod, SubscriptionStatus } from './payment.dto'

/** RF-100 y RF-103: suscripcionRadarPlus */
export interface SuscripcionRadarPlusDto {
  suscripcionId: string
  usuarioId?: string
  estado: SubscriptionStatus
  fechaInicio: string | null
  fechaFin: string | null
}

/** RF-101: salida al cancelar renovación */
export interface CancelacionPlanOutputDto {
  nombrePlanCancelado: string
  fechaFin: string
}

/** RF-102 y RF-103: planVigente, planAplicado y resultado de uso */
export interface PlanVigenteDto {
  nombre: 'Radar' | 'Radar+'
  fechaFin: string | null
}

export interface PlanAplicadoDto {
  nombre: 'Radar' | 'Radar+'
}

export interface VerificacionBeneficioResultDto {
  planVigente: { nombre: 'Radar' | 'Radar+' }
  fechaFin: string | null
  planAplicado: { nombre: 'Radar' | 'Radar+' }
  resultadoDeUso: boolean
}

export interface PlanDto {
  id: 'free' | 'plus' | 'store'
  name: string
  price: number
  period: 'gratis' | 'mensual'
  features: string[]
  highlighted?: boolean
}

/** Intención guardada cuando el usuario elige un plan sin sesión. */
export interface PlanIntentDto {
  planId: string
  accountType: 'COMPRADOR' | 'ADMIN_ALMACEN'
  returnPath: string
  expiresAt: number
}

/** Respuesta simulada de crear una preferencia de pago. */
export interface CheckoutResponseDto {
  initPoint: string
  preferenceId: string
  suscripcionId?: string
  ordenId?: string
  estado?: SubscriptionStatus
}

/** Estado del pago consultado al backend tras la redirección. */
export type CheckoutStatus = 'aprobado' | 'pendiente' | 'rechazado'

export interface CheckoutResultDto {
  orderId: string
  status: CheckoutStatus
  planName: string
  amount: number
  method?: PaymentMethod
  payerEmail?: string
  planId?: 'free' | 'plus' | 'store'
  estadoSuscripcion?: SubscriptionStatus
  fechaInicio?: string | null
  fechaFin?: string | null
}
