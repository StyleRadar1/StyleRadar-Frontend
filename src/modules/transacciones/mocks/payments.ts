import { RADAR_PLUS_PRICE, STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import type { PaymentDto, PaymentMethod, PaymentStatus, PaymentStatusV4 } from '../types/payment.dto'

const methods: PaymentMethod[] = ['Mercado Pago']
const statuses: PaymentStatus[] = ['aprobado', 'aprobado', 'aprobado', 'rechazado', 'pendiente']

function toV4Status(s: PaymentStatus): PaymentStatusV4 {
  if (s === 'aprobado') return 'APROBADO'
  if (s === 'rechazado') return 'RECHAZADO'
  return 'PENDIENTE'
}

function mockPayment(i: number): PaymentDto {
  const s = statuses[i % statuses.length]
  const day = 1 + (i * 3) % 28
  const plan = i % 3 === 0 ? 'store' as const : 'plus' as const
  const planNames = { free: 'Radar', plus: 'Radar+', store: 'Tienda aliada' }
  const prices = { free: 0, plus: RADAR_PLUS_PRICE, store: STORE_SUBSCRIPTION_PRICE }
  const pagoId = `SR-${String(1000 + i).padStart(4, '0')}`
  const suscripcionId = plan === 'store' ? `SUB-ALM-${100 + i}` : `SUB-USR-${100 + i}`
  const suscriptorId =
    plan === 'store'
      ? `alm-${String((i % 6) + 1).padStart(2, '0')}`
      : `usr-${String((i % 10) + 1).padStart(2, '0')}`
  const ref = `MP-${74000000 + i * 1357}`
  const fecha = `2026-09-${String(day).padStart(2, '0')}`
  return {
    id: pagoId,
    pagoId,
    suscripcionId,
    suscriptorId,
    userId: suscriptorId,
    userRole: plan === 'store' ? 'ADMIN_ALMACEN' : 'COMPRADOR',
    planId: plan,
    planName: planNames[plan],
    amount: prices[plan],
    valor: prices[plan],
    currency: 'COP',
    moneda: 'COP',
    mpReference: ref,
    referencia: ref,
    referenciaExterna: ref,
    method: methods[i % methods.length],
    date: fecha,
    fecha,
    status: s,
    estado: toV4Status(s),
  }
}

export const MOCK_PAYMENTS: PaymentDto[] = Array.from({ length: 24 }, (_, i) => mockPayment(i))

/** Historial de pagos mock para usuarios compradores autenticados (RF-97), del más reciente al más antiguo. */
export const MOCK_BUYER_PAYMENTS: Record<string, PaymentDto[]> = {
  'u-1': [
    {
      id: 'SR-3012',
      pagoId: 'SR-3012',
      suscripcionId: 'SUB-USR-001',
      suscriptorId: 'u-1',
      userId: 'u-1',
      userRole: 'COMPRADOR',
      planId: 'plus',
      planName: 'Radar+',
      amount: RADAR_PLUS_PRICE,
      valor: RADAR_PLUS_PRICE,
      currency: 'COP',
      moneda: 'COP',
      mpReference: 'MP-88941205',
      referencia: 'MP-88941205',
      referenciaExterna: 'MP-88941205',
      method: 'Mercado Pago',
      date: '2026-11-09',
      fecha: '2026-11-09',
      status: 'aprobado',
      estado: 'APROBADO',
    },
    {
      id: 'SR-2940',
      pagoId: 'SR-2940',
      suscripcionId: 'SUB-USR-001',
      suscriptorId: 'u-1',
      userId: 'u-1',
      userRole: 'COMPRADOR',
      planId: 'plus',
      planName: 'Radar+',
      amount: RADAR_PLUS_PRICE,
      valor: RADAR_PLUS_PRICE,
      currency: 'COP',
      moneda: 'COP',
      mpReference: 'MP-88410092',
      referencia: 'MP-88410092',
      referenciaExterna: 'MP-88410092',
      method: 'Mercado Pago',
      date: '2026-10-09',
      fecha: '2026-10-09',
      status: 'aprobado',
      estado: 'APROBADO',
    },
    {
      id: 'SR-2885',
      pagoId: 'SR-2885',
      suscripcionId: 'SUB-USR-001',
      suscriptorId: 'u-1',
      userId: 'u-1',
      userRole: 'COMPRADOR',
      planId: 'plus',
      planName: 'Radar+',
      amount: RADAR_PLUS_PRICE,
      valor: RADAR_PLUS_PRICE,
      currency: 'COP',
      moneda: 'COP',
      mpReference: 'MP-87990314',
      referencia: 'MP-87990314',
      referenciaExterna: 'MP-87990314',
      method: 'Mercado Pago',
      date: '2026-09-09',
      fecha: '2026-09-09',
      status: 'rechazado',
      estado: 'RECHAZADO',
    },
  ],
}
