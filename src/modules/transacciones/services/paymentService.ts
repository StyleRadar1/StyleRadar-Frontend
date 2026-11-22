import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { MOCK_PAYMENTS } from '../mocks/payments'
import type { PaymentDto, PaymentFiltersDto } from '../types/payment.dto'

function applyFilters(payments: PaymentDto[], f: PaymentFiltersDto): PaymentDto[] {
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

/** Servicio de pagos para el admin (RF-75). Patrón: mock o gateway. */
export const paymentService = {
  async list(filters: PaymentFiltersDto): Promise<PaymentDto[]> {
    if (env.useMocks) { failIfScenario(); return mockDelay(applyFilters(MOCK_PAYMENTS, filters)) }
    return apiClient.get<PaymentDto[]>('/api/pagos', { params: filters }).then((r) => r.data)
  },

  getById(id: string): Promise<PaymentDto> {
    if (env.useMocks) {
      const p = MOCK_PAYMENTS.find((x) => x.id === id || x.pagoId === id)
      if (!p) return Promise.reject(new Error('Pago no encontrado'))
      return mockDelay(p)
    }
    return apiClient.get<PaymentDto>(`/api/pagos/${id}`).then((r) => r.data)
  },
}

/** Calcula ingresos acumulados: suma únicamente pagos aprobados (A.1, RF-89.1, RF-89.2). */
export function calcRevenue(payments: PaymentDto[]): number {
  return payments.reduce((sum, p) => {
    if (p.status === 'aprobado' || p.estado === 'APROBADO') return sum + (p.valor ?? p.amount)
    return sum
  }, 0)
}
