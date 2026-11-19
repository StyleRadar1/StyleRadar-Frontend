import type { PaymentDto, PaymentMethod, PaymentStatus } from '../types/payment.dto'

const names = ['Ana Torres', 'Luis García', 'María López', 'Carlos Sánchez', 'Sofía Herrera', 'Diego Ramírez', 'Laura Cortés', 'Andrés Peña', 'Camila Ríos', 'Juan Morales']
const methods: PaymentMethod[] = ['Mercado Pago']
const statuses: PaymentStatus[] = ['aprobado', 'aprobado', 'aprobado', 'rechazado', 'pendiente', 'reembolsado']

function mockPayment(i: number): PaymentDto {
  const s = statuses[i % statuses.length]
  const day = 1 + (i * 3) % 28
  const plan = i % 5 === 0 ? 'store' as const : i % 3 === 0 ? 'free' as const : 'plus' as const
  const planNames = { free: 'Radar', plus: 'Radar+', store: 'Tienda aliada' }
  const prices = { free: 0, plus: 14_900, store: 89_000 }
  return {
    id: `SR-${String(1000 + i).padStart(4, '0')}`,
    userId: `u${i + 1}`,
    userName: names[i % names.length],
    userEmail: `${names[i % names.length].toLowerCase().replace(/ /g, '.')}@mail.co`,
    userRole: plan === 'store' ? 'ADMIN_ALMACEN' : 'COMPRADOR',
    planId: plan,
    planName: planNames[plan],
    amount: prices[plan],
    currency: 'COP',
    mpReference: `MP-${74000000 + i * 1357}`,
    method: methods[i % methods.length],
    date: `2026-09-${String(day).padStart(2, '0')}`,
    status: s,
    ...(s === 'reembolsado' ? { refundedAmount: prices[plan], refundReason: 'Solicitud del usuario', refundDate: `2026-09-${String(day + 2).padStart(2, '0')}` } : {}),
  }
}

export const MOCK_PAYMENTS: PaymentDto[] = Array.from({ length: 24 }, (_, i) => mockPayment(i))

/** Historial de pagos mock para usuarios compradores autenticados (RF-97), coherente con useUserPlan. */
export const MOCK_BUYER_PAYMENTS: Record<string, PaymentDto[]> = {
  'u-1': [
    {
      id: 'SR-3012',
      userId: 'u-1',
      userName: 'Valentina Rojas',
      userEmail: 'valentina@styleradar.co',
      userRole: 'COMPRADOR',
      planId: 'plus',
      planName: 'Radar+',
      amount: 14_900,
      currency: 'COP',
      mpReference: 'MP-88941205',
      method: 'Mercado Pago',
      date: '2026-11-09',
      status: 'aprobado',
    },
    {
      id: 'SR-2940',
      userId: 'u-1',
      userName: 'Valentina Rojas',
      userEmail: 'valentina@styleradar.co',
      userRole: 'COMPRADOR',
      planId: 'plus',
      planName: 'Radar+',
      amount: 14_900,
      currency: 'COP',
      mpReference: 'MP-88410092',
      method: 'Mercado Pago',
      date: '2026-10-09',
      status: 'aprobado',
    },
    {
      id: 'SR-2885',
      userId: 'u-1',
      userName: 'Valentina Rojas',
      userEmail: 'valentina@styleradar.co',
      userRole: 'COMPRADOR',
      planId: 'plus',
      planName: 'Radar+',
      amount: 14_900,
      currency: 'COP',
      mpReference: 'MP-87990314',
      method: 'Mercado Pago',
      date: '2026-09-09',
      status: 'rechazado',
    },
  ],
}
