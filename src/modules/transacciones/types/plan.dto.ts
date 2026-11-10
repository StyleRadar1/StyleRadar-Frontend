/**
 * Planes de StyleRadar (P7) y plan de la persona (P8). El plan real lo entrega ms-pagos-suscripciones
 * (puerto 8400, vía API Gateway). Precios y beneficios provisionales: falta validarlos con Transacciones.
 */
export type PlanUsuario = 'RADAR' | 'RADAR_PLUS'

export const PLAN_LABEL: Record<PlanUsuario, string> = { RADAR: 'Radar', RADAR_PLUS: 'Radar+' }

export interface MiPlanDto {
  plan: PlanUsuario
  /** Fecha del próximo cobro; vacía en el plan gratis. */
  proximoCobro?: string
}

/** Lo que solo tiene Radar+ y se muestra con candado en el plan Radar. */
export type FuncionPago = 'probador-foto' | 'alertas-sin-limite' | 'wishlist-sin-limite'

/** Límites del plan Radar. */
export const LIMITES_RADAR = { alertas: 3, wishlist: 20 } as const

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

/** Comparación de los planes de personas: [qué, Radar, Radar+]. */
export const COMPARATIVA: [string, string, string][] = [
  ['Precio', '$0', '$14.900 al mes'],
  ['Tiendas, mapa y playlists', 'Sin límite', 'Sin límite'],
  ['Wishlist', `Hasta ${LIMITES_RADAR.wishlist} prendas`, 'Sin límite'],
  ['Alertas de disponibilidad activas', `Hasta ${LIMITES_RADAR.alertas}`, 'Sin límite'],
  ['Probador', 'Con el maniquí', 'Con el maniquí y con tu propia foto'],
  ['Vender y donar en Segunda vida', 'Sí', 'Sí'],
  ['Chat con tiendas y vendedores', 'Sí', 'Sí'],
]

/** Reglas de negocio de los planes (README de la rama feature/planes-acceso-DanielBarrera). Provisionales. */
export const REGLAS: [string, string][] = [
  ['Límites del plan gratis', 'Las alertas activas suman las de prendas y las de búsquedas guardadas. Al llegar al límite, la acción se bloquea y se ofrece «Ver planes». Quitar una prenda o apagar una alerta libera el cupo de inmediato.'],
  ['Candado antes del límite', 'Lo que es de pago se marca con candado mientras la persona no tenga Radar+, para que sepa qué está bloqueado antes de intentarlo.'],
  ['Alertas gratis', `El plan Radar conserva ${LIMITES_RADAR.alertas} alertas sin costo; Radar+ no tiene límite.`],
  ['Cambio de plan', 'Se cambia desde esta página. El cambio aplica en el siguiente ciclo; en la demostración se aplica al confirmar.'],
  ['Pago rechazado', 'Si un cobro es rechazado hay 3 días de gracia para pagar con otro medio (tarjeta, PSE o Nequi).'],
  ['Bajada automática', 'Si termina la gracia sin pago, la cuenta Radar+ pasa a Radar. Sus playlists y su wishlist se conservan; solo se pausan los beneficios.'],
  ['Tiendas', 'El periodo gratuito dura 30 días desde el registro. Una tienda solo aparece con la verificación aprobada; si la suscripción vence o no existe, su catálogo deja de verse en el radar y en el mapa. Si se cancela, sigue visible hasta la fecha de corte.'],
  ['Cancelación', 'Tiendas y Radar+ pueden cancelar la renovación cuando quieran; el plan sigue activo hasta el final del ciclo pagado.'],
  ['Fundaciones', 'No pagan. Una fundación inactiva no puede iniciar sesión.'],
]

/** Tabla de precios provisional (la misma del prototipo y del README de la rama de planes). */
export const PLANES: PlanInfo[] = [
  { id: 'RADAR', para: 'Personas', nombre: 'Radar', precio: 0, periodo: 'gratis', nota: 'Para descubrir tu estilo en la ciudad.',
    incluye: ['Tiendas, mapa y playlists sin límite', `Wishlist de hasta ${LIMITES_RADAR.wishlist} prendas`, `Hasta ${LIMITES_RADAR.alertas} alertas de disponibilidad`, 'Probador con el maniquí', 'Vender y donar en Segunda vida', 'Chat con tiendas y vendedores'] },
  { id: 'RADAR_PLUS', para: 'Personas', nombre: 'Radar+', precio: 14900, periodo: 'al mes', nota: 'Para probarte la ropa sobre ti y no perderte nada.', destacado: true,
    incluye: ['Todo lo del plan Radar', 'Probador con tu propia foto', 'Alertas de disponibilidad sin límite', 'Wishlist sin límite', 'Cancela la renovación cuando quieras'] },
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
}
