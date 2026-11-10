import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { PLANS, MOCK_CHECKOUT_RESPONSE, MOCK_CHECKOUT_RESULTS } from '../mocks/plans'
import type { PlanDto, PlanIntentDto, CheckoutResponseDto, CheckoutResultDto } from '../types/plan.dto'

const INTENT_KEY = 'sr_plan_intent'
const TTL_MS = 30 * 60 * 1000 // 30 min

export const planService = {
  /** Devuelve los planes de usuario (Radar y Radar+). */
  getPlans(): Promise<PlanDto[]> {
    if (env.useMocks) return mockDelay(PLANS)
    return apiClient.get<PlanDto[]>('/api/planes').then((r) => r.data)
  },

  /** Guarda la intención de suscripción en localStorage con TTL. */
  saveIntent(intent: Omit<PlanIntentDto, 'expiresAt'>): void {
    try {
      const data: PlanIntentDto = { ...intent, expiresAt: Date.now() + TTL_MS }
      localStorage.setItem(INTENT_KEY, JSON.stringify(data))
    } catch { /* sin almacenamiento */ }
  },

  /** Lee y valida la intención guardada. Devuelve null si venció o no existe. */
  readIntent(): PlanIntentDto | null {
    try {
      const raw = localStorage.getItem(INTENT_KEY)
      if (!raw) return null
      const intent: PlanIntentDto = JSON.parse(raw)
      if (Date.now() > intent.expiresAt) {
        localStorage.removeItem(INTENT_KEY)
        return null
      }
      return intent
    } catch {
      return null
    }
  },

  clearIntent(): void {
    try { localStorage.removeItem(INTENT_KEY) } catch { /* sin almacenamiento */ }
  },

  /** Crea una preferencia de pago (mock: devuelve un initPoint simulado). */
  createCheckout(planId: string): Promise<CheckoutResponseDto> {
    if (env.useMocks) return mockDelay(MOCK_CHECKOUT_RESPONSE)
    return apiClient.post<CheckoutResponseDto>('/api/pagos/checkout', { planId }).then((r) => r.data)
  },

  /** Consulta el estado del pago al backend (ignora el status de la query de MP). */
  getCheckoutResult(orderId: string): Promise<CheckoutResultDto> {
    if (env.useMocks) {
      const result = MOCK_CHECKOUT_RESULTS[orderId] ?? MOCK_CHECKOUT_RESULTS['MOCK_ORDER_OK']
      return mockDelay(result)
    }
    return apiClient.get<CheckoutResultDto>(`/api/pagos/resultado/${orderId}`).then((r) => r.data)
  },
}
