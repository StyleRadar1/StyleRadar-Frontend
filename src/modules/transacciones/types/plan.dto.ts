/**
 * Planes de StyleRadar (P7) y plan de la persona (P8). El plan real lo entrega ms-pagos-suscripciones
 * (puerto 8400, vía API Gateway). Precios y beneficios provisionales: falta validarlos con Transacciones.
 */
export type PlanUsuario = 'RADAR' | 'RADAR_PLUS'
export type PlanMockScenario = 'NORMAL' | 'DEGRADADO_POR_PAGO'

export const PLAN_LABEL: Record<PlanUsuario, string> = { RADAR: 'Radar', RADAR_PLUS: 'Radar+' }

export interface MiPlanDto {
  plan: PlanUsuario
  /** Fecha del próximo cobro; vacía en el plan gratis. */
  proximoCobro?: string
  /** Fecha hasta la que dura el periodo ya pagado cuando se cancela la renovación (RF-101). */
  periodEndsAt?: string
  /** Estado de la renovación automática en Radar+ (RF-95, RF-101). */
  renewalEnabled?: boolean
  /** Indica si la cuenta pasó de Radar+ a Radar por falta de pago (RF-103). */
  degradedByPayment?: boolean
}

/** Lo que solo tiene Radar+ y se muestra con candado en el plan Radar. */
export type FuncionPago = 'probador-foto' | 'alertas-sin-limite' | 'wishlist-sin-limite'

/** Límites concentrados del plan Radar (RF-102, C.4). */
export const PLAN_LIMITS = {
  wishlist: 20,
  alertas: 0,
  probadorFoto: 30,
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

/** Comparación de los planes de personas: [qué, Radar, Radar+] (RF-102, C.4). */
export const COMPARATIVA: [string, string, string][] = [
  ['Precio', '$0', '$14.900 al mes'],
  ['Tiendas, mapa y playlists', 'Sin límite', 'Sin límite'],
  ['Wishlist', `Hasta ${LIMITES_RADAR.wishlist} prendas`, 'Sin límite'],
  ['Alertas de disponibilidad activas', 'No disponible (exclusivo Radar+)', 'Sin límite'],
  ['Probador virtual con foto propia', `Hasta ${LIMITES_RADAR.probadorFoto} usos`, 'Sin límite'],
  ['Probador con maniquí', 'Sí', 'Sí'],
  ['Vender y donar en Segunda vida', 'Sí', 'Sí'],
  ['Chat con tiendas y vendedores', 'Sí', 'Sí'],
]

/** Reglas de negocio de los planes (RF-102, RF-101). */
export const REGLAS: [string, string][] = [
  ['Límites del plan gratis', `El plan Radar incluye hasta ${LIMITES_RADAR.wishlist} prendas en wishlist y hasta ${LIMITES_RADAR.probadorFoto} usos del probador con foto propia. No incluye alertas de disponibilidad.`],
  ['Candado antes del límite', 'Las funciones exclusivas de Radar+ se marcan con candado mientras la persona no tenga Radar+ activo.'],
  ['Alertas de disponibilidad', 'Las alertas de precio y disponibilidad son exclusivas de Radar+ y no tienen límite.'],
  ['Cambio de plan', 'El comprador puede activar Radar+ en cualquier momento mediante Mercado Pago.'],
  ['Pago rechazado', 'Si el cobro no es aprobado en Mercado Pago, se permite el reintento inmediato.'],
  ['Bajada automática', 'Si una suscripción no se renueva o vence el ciclo, la cuenta pasa a Radar conservando prendas guardadas y pausando beneficios.'],
  ['Tiendas', 'El periodo gratuito dura 30 días desde el registro. Después de 30 días se requiere la suscripción activa de Tienda aliada para mantener el catálogo visible.'],
  ['Cancelación', 'La renovación se puede cancelar en cualquier momento; el plan sigue activo hasta el final del periodo pagado.'],
  ['Fundaciones', 'Las fundaciones aliadas verificadas cuentan con acceso gratuito permanente.'],
]

/** Tabla de precios de los planes (RF-102). */
export const PLANES: PlanInfo[] = [
  { id: 'RADAR', para: 'Personas', nombre: 'Radar', precio: 0, periodo: 'gratis', nota: 'Para descubrir tu estilo en la ciudad.',
    incluye: ['Tiendas, mapa y playlists sin límite', `Wishlist de hasta ${LIMITES_RADAR.wishlist} prendas`, `Probador virtual con foto propia hasta ${LIMITES_RADAR.probadorFoto} usos`, 'Probador con el maniquí', 'Vender y donar en Segunda vida', 'Chat con tiendas y vendedores'] },
  { id: 'RADAR_PLUS', para: 'Personas', nombre: 'Radar+', precio: 14900, periodo: 'al mes', nota: 'Para probarte la ropa sobre ti y no perderte nada.', destacado: true,
    incluye: ['Todo lo del plan Radar', 'Probador con tu propia foto sin límite', 'Alertas de disponibilidad de prendas', 'Wishlist sin límite', 'Cancela la renovación cuando quieras'] },
  { id: 'TIENDA', para: 'Tiendas', nombre: 'Tienda aliada', precio: 89000, periodo: 'al mes', nota: 'Los primeros 30 días son gratis.',
    incluye: ['Tu catálogo visible en el radar y en el mapa', 'Publica en 3 pasos, con inventario por talla', 'Distintivos automáticos: Nueva llegada y Últimas unidades', 'Estadísticas de visitas y guardados', 'Cancela la renovación cuando quieras'] },
  { id: 'FUNDACION', para: 'Fundaciones', nombre: 'Fundación aliada', precio: 0, periodo: 'siempre', nota: 'Sin costo para las fundaciones verificadas.',
    incluye: ['Recibe solicitudes de donación de personas y tiendas', 'Acepta, rechaza y coordina la entrega por mensajes', 'Tu página con misión, horario y lo que más necesitas', 'Estadísticas de lo que llega cada mes'] },
]

/** Plan de suscripción de StyleRadar. Tabla provisional del equipo. */
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
}

/** Estado del pago consultado al backend tras la redirección. */
export type CheckoutStatus = 'aprobado' | 'pendiente' | 'rechazado'

export interface CheckoutResultDto {
  orderId: string
  status: CheckoutStatus
  planName: string
  amount: number
  method?: string
  payerEmail?: string
  planId?: 'free' | 'plus' | 'store'
}
