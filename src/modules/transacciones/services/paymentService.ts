import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { mapPaymentResponse, toApiPaymentStatusFilter, type ApiPaymentResponse } from '../mappers/paymentsMappers'
import { MOCK_PAYMENTS } from '../mocks/payments'
import type { PaymentDto, PaymentFiltersDto } from '../types/payment.dto'

export function filterPayments(payments: PaymentDto[], f: PaymentFiltersDto): PaymentDto[] {
  return payments.filter((p) => {
    if (f.status && p.status !== f.status) return false
    if (f.planId && p.planId !== f.planId) return false
    if (f.dateFrom && p.date < f.dateFrom) return false
    if (f.dateTo && p.date > f.dateTo) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      const hay = `${p.pagoId ?? p.id} ${p.suscripcionId ?? ''} ${p.suscriptorId ?? p.userId} ${p.referencia ?? p.mpReference ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

/** Servicio de pagos para el admin (RF-75). Patrón: mock o gateway (`GET /api/v1/admin/payments`). */
export const paymentService = {
  async list(filters: PaymentFiltersDto): Promise<PaymentDto[]> {
    if (env.useMocksPagos) {
      failIfScenario()
      return mockDelay(filterPayments(MOCK_PAYMENTS, filters))
    }
    const status = toApiPaymentStatusFilter(filters.status)
    const { data } = await apiClient.get<ApiPaymentResponse[]>('/api/v1/admin/payments', {
      params: status ? { status } : undefined,
    })
    const mapped = (Array.isArray(data) ? data : []).map((item) => mapPaymentResponse(item))
    return filterPayments(mapped, filters)
  },

  async getById(id: string): Promise<PaymentDto> {
    if (env.useMocksPagos) {
      const p = MOCK_PAYMENTS.find((x) => x.id === id || x.pagoId === id)
      if (!p) return Promise.reject(new ApiError(404, 'Pago no encontrado'))
      return mockDelay(p)
    }
    const { data } = await apiClient.get<ApiPaymentResponse>(`/api/v1/admin/payments/${encodeURIComponent(id)}`)
    return mapPaymentResponse(data)
  },
}

/** Calcula ingresos acumulados: suma únicamente pagos aprobados (A.1, RF-89.1, RF-89.2). */
export function calcRevenue(payments: PaymentDto[]): number {
  return payments.reduce((sum, p) => {
    if (p.status === 'aprobado' || p.estado === 'APROBADO') return sum + (p.valor ?? p.amount)
    return sum
  }, 0)
}
