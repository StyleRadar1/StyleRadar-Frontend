import { RADAR_PLUS_PRICE, STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import type { PlanDto, CheckoutResponseDto, CheckoutResultDto } from '../types/plan.dto'

/** Tabla de planes de usuario (RF-100, RF-102). */
export const PLANS: PlanDto[] = [
  {
    id: 'free',
    name: 'Radar',
    price: 0,
    period: 'gratis',
    features: [
      'Probador con maniquí',
      'Sin probador con foto propia',
      'Sin alertas de disponibilidad',
    ],
  },
  {
    id: 'plus',
    name: 'Radar+',
    price: RADAR_PLUS_PRICE,
    period: 'mensual',
    highlighted: true,
    features: [
      'Probador con maniquí',
      'Probador con foto propia hasta 30 usos',
      'Alertas de disponibilidad',
    ],
  },
]

/** Plan de tienda aliada (para la suscripción de almacenes, RF-67). */
export const STORE_PLAN: PlanDto = {
  id: 'store',
  name: 'Tienda aliada',
  price: STORE_SUBSCRIPTION_PRICE,
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
  'MOCK_ORDER_OK': { orderId: 'MOCK_ORDER_OK', status: 'aprobado', planName: 'Radar+', amount: RADAR_PLUS_PRICE, method: 'Mercado Pago' },
  'MOCK_ORDER_PENDING': { orderId: 'MOCK_ORDER_PENDING', status: 'pendiente', planName: 'Radar+', amount: RADAR_PLUS_PRICE, method: 'Mercado Pago' },
  'MOCK_ORDER_FAIL': { orderId: 'MOCK_ORDER_FAIL', status: 'rechazado', planName: 'Radar+', amount: RADAR_PLUS_PRICE, method: 'Mercado Pago' },
  // Suscripción de tienda aliada (RF-67)
  'MOCK_STORE_OK': { orderId: 'MOCK_STORE_OK', status: 'aprobado', planName: 'Tienda aliada', amount: STORE_SUBSCRIPTION_PRICE, method: 'Mercado Pago' },
  'MOCK_STORE_PENDING': { orderId: 'MOCK_STORE_PENDING', status: 'pendiente', planName: 'Tienda aliada', amount: STORE_SUBSCRIPTION_PRICE, method: 'Mercado Pago' },
  'MOCK_STORE_FAIL': { orderId: 'MOCK_STORE_FAIL', status: 'rechazado', planName: 'Tienda aliada', amount: STORE_SUBSCRIPTION_PRICE, method: 'Mercado Pago' },
}
