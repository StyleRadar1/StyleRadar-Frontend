import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { MOCK_PAYMENTS } from '../mocks/payments'
import type { PaymentDto, PaymentFiltersDto, RefundRequestDto } from '../types/payment.dto'

function applyFilters(payments: PaymentDto[], f: PaymentFiltersDto): PaymentDto[] {
  return payments.filter((p) => {
    if (f.status && p.status !== f.status) return false
    if (f.planId && p.planId !== f.planId) return false
    if (f.dateFrom && p.date < f.dateFrom) return false
    if (f.dateTo && p.date > f.dateTo) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!`${p.id} ${p.userName} ${p.userEmail}`.toLowerCase().includes(q)) return false
    }
    return true
  })
}

/** Servicio de pagos para el admin. Patrón: mock o gateway. */
export const paymentService = {
  async list(filters: PaymentFiltersDto): Promise<PaymentDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(applyFilters(MOCK_PAYMENTS, filters)) }
    return apiClient.get<PaymentDto[]>('/api/pagos', { params: filters }).then((r) => r.data)
  },

  getById(id: string): Promise<PaymentDto> {
    if (env.useMocks) {
      const p = MOCK_PAYMENTS.find((x) => x.id === id)
      if (!p) return Promise.reject(new Error('Pago no encontrado'))
      return mockDelay(p)
    }
    return apiClient.get<PaymentDto>(`/api/pagos/${id}`).then((r) => r.data)
  },

  async refund(req: RefundRequestDto): Promise<PaymentDto> {
    if (env.useMocks) {
      failIfScenario()
      const p = MOCK_PAYMENTS.find((x) => x.id === req.paymentId)
      if (!p) return Promise.reject(new Error('Pago no encontrado'))
      const refunded: PaymentDto = { ...p, status: 'reembolsado', refundReason: req.reason, refundDate: new Date().toISOString().slice(0, 10) }
      return mockDelay(refunded)
    }
    return apiClient.post<PaymentDto>(`/api/pagos/${req.paymentId}/reembolso`, { reason: req.reason }).then((r) => r.data)
  },
}

/** Calcula ingresos netos: aprobados menos reembolsados. */
export function calcRevenue(payments: PaymentDto[]): number {
  return payments.reduce((sum, p) => {
    if (p.status === 'aprobado') return sum + p.amount
    if (p.status === 'reembolsado') return sum - p.amount
    return sum
  }, 0)
}
