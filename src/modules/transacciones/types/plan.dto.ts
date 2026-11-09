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
