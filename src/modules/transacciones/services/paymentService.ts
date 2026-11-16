import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
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

/** Calcula el saldo disponible para reembolsar de un pago (valor original menos reembolsos previos). */
export function getRefundableBalance(p: PaymentDto): number {
  const alreadyRefunded = p.refundedAmount ?? (p.status === 'reembolsado' ? p.amount : 0)
  return Math.max(0, p.amount - alreadyRefunded)
}

/** Servicio de pagos para el admin. Patrón: mock o gateway. */
export const paymentService = {
  list(filters: PaymentFiltersDto): Promise<PaymentDto[]> {
    if (env.useMocks) return mockDelay(applyFilters(MOCK_PAYMENTS, filters))
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

  /**
   * RF-98: Reembolsa total o parcialmente un pago APROBADO.
   * Valida motivo obligatorio, monto > 0 y monto <= saldo reembolsable.
   */
  refund(req: RefundRequestDto): Promise<PaymentDto> {
    if (!req.reason || !req.reason.trim()) {
      return Promise.reject(new ApiError(400, 'Debes indicar el motivo del reembolso.'))
    }
    if (env.useMocks) {
      try {
        failIfScenario()
      } catch {
        return Promise.reject(new ApiError(500, 'No fue posible procesar el reembolso. Inténtalo nuevamente.'))
      }
      const idx = MOCK_PAYMENTS.findIndex((x) => x.id === req.paymentId)
      if (idx === -1) return Promise.reject(new Error('Pago no encontrado'))
      const p = MOCK_PAYMENTS[idx]
      const balance = getRefundableBalance(p)
      const requested = req.amount ?? balance

      if (requested <= 0 || Number.isNaN(requested)) {
        return Promise.reject(new ApiError(400, 'El monto a reembolsar debe ser mayor que 0.'))
      }
      if (requested > balance) {
        return Promise.reject(new ApiError(400, 'El monto solicitado supera el saldo disponible para reembolsar.'))
      }

      const prevRefunded = p.refundedAmount ?? 0
      const totalRefunded = prevRefunded + requested
      const isFullRefund = totalRefunded >= p.amount

      const refunded: PaymentDto = {
        ...p,
        status: isFullRefund ? 'reembolsado' : 'aprobado',
        refundedAmount: totalRefunded,
        refundReason: req.reason.trim(),
        refundDate: new Date().toISOString().slice(0, 10),
      }
      MOCK_PAYMENTS[idx] = refunded
      return mockDelay(refunded)
    }
    return apiClient
      .post<PaymentDto>(`/api/pagos/${req.paymentId}/reembolso`, {
        reason: req.reason.trim(),
        amount: req.amount,
      })
      .then((r) => r.data)
  },
}

/** Calcula ingresos netos: aprobados menos reembolsados (incluyendo reembolsos parciales). */
export function calcRevenue(payments: PaymentDto[]): number {
  return payments.reduce((sum, p) => {
    if (p.status === 'aprobado') return sum + p.amount - (p.refundedAmount ?? 0)
    if (p.status === 'reembolsado') return sum - p.amount
    return sum
  }, 0)
}
