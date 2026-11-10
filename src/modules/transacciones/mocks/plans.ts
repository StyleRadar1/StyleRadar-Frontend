import type { PlanDto, CheckoutResponseDto, CheckoutResultDto } from '../types/plan.dto'

/** Tabla provisional de planes del equipo (fuente: prototipo 05-core.js). */
export const PLANS: PlanDto[] = [
  {
    id: 'free',
    name: 'Radar',
    price: 0,
    period: 'gratis',
    features: [
      'Catálogo de prendas de Bogotá',
      'Wishlist de hasta 20 prendas',
      'Probador con maniquí',
      'Mapa de tiendas',
      'Segunda mano y donaciones',
    ],
  },
  {
    id: 'plus',
    name: 'Radar+',
    price: 14_900,
    period: 'mensual',
    highlighted: true,
    features: [
      'Todo lo del plan Radar',
      'Probador con foto propia',
      'Alertas de precio y talla',
      'Wishlist sin límite',
      'Soporte prioritario',
    ],
  },
]

/** Plan de tienda aliada (para la suscripción de almacenes). */
export const STORE_PLAN: PlanDto = {
  id: 'store',
  name: 'Tienda aliada',
  price: 89_000,
  period: 'mensual',
  features: [
    'Catálogo visible en el radar',
    'Estadísticas de tu tienda',
    'Colecciones y playlists',
    'Soporte dedicado',
  ],
}

export const MOCK_CHECKOUT_RESPONSE: CheckoutResponseDto = {
  initPoint: 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=MOCK_PREF_001',
  preferenceId: 'MOCK_PREF_001',
}

export const MOCK_CHECKOUT_RESULTS: Record<string, CheckoutResultDto> = {
  'MOCK_ORDER_OK': { orderId: 'MOCK_ORDER_OK', status: 'aprobado', planName: 'Radar+', amount: 14_900, method: 'Mercado Pago' },
  'MOCK_ORDER_PENDING': { orderId: 'MOCK_ORDER_PENDING', status: 'pendiente', planName: 'Radar+', amount: 14_900, method: 'Efecty' },
  'MOCK_ORDER_FAIL': { orderId: 'MOCK_ORDER_FAIL', status: 'rechazado', planName: 'Radar+', amount: 14_900, method: 'PSE' },
}
