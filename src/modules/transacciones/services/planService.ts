import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { isValidPayerEmail } from '../utils/validation'
import { isPlanCompatibleWithRole } from '../constants/plansByRole'
import { fallarSiDemoPlan } from '../mocks/demoPlan'
import { PLANS, MOCK_CHECKOUT_RESPONSE, MOCK_CHECKOUT_RESULTS } from '../mocks/plans'
import type { Role } from '@/modules/core/types/roles'
import type { PlanDto, PlanIntentDto, CheckoutResponseDto, CheckoutResultDto } from '../types/plan.dto'

const INTENT_KEY = 'sr_plan_intent'
const LAST_CHECKOUT_KEY = 'sr_last_checkout_meta'
const CUSTOM_ORDERS_KEY = 'sr_custom_checkout_orders'
const TTL_MS = 30 * 60 * 1000 // 30 min

interface LastCheckoutMeta {
  planId: 'free' | 'plus' | 'store'
  payerEmail?: string
  amount: number
  planName: string
}

function readCustomOrders(): Record<string, CheckoutResultDto> {
  try {
    const raw = sessionStorage.getItem(CUSTOM_ORDERS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CheckoutResultDto>) : {}
  } catch {
    return {}
  }
}

export function saveCustomOrderResult(order: CheckoutResultDto): void {
  try {
    const current = readCustomOrders()
    current[order.orderId] = order
    sessionStorage.setItem(CUSTOM_ORDERS_KEY, JSON.stringify(current))
  } catch { /* sin almacenamiento */ }
}

export function readLastCheckoutMeta(): LastCheckoutMeta | null {
  try {
    const raw = sessionStorage.getItem(LAST_CHECKOUT_KEY)
    return raw ? (JSON.parse(raw) as LastCheckoutMeta) : null
  } catch {
    return null
  }
}

function getCurrentUserRole(): Role | null {
  try {
    const raw = localStorage.getItem('sr_user')
    if (raw) {
      const u = JSON.parse(raw) as { role?: Role }
      return u.role ?? null
    }
  } catch { /* noop */ }
  return null
}

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
  createCheckout(planId: string, payerEmail?: string): Promise<CheckoutResponseDto> {
    const role = getCurrentUserRole()
    if (role && (!isPlanCompatibleWithRole(planId, role) || role !== 'COMPRADOR')) {
      return Promise.reject(new ApiError(403, 'Tu cuenta no puede cambiar a ese plan.'))
    }
    if (payerEmail !== undefined && !isValidPayerEmail(payerEmail)) {
      const msg = planId === 'plus'
        ? 'Ingresa un correo electrónico válido para activar Radar+.'
        : 'Ingresa un correo electrónico válido para realizar el pago.'
      return Promise.reject(new ApiError(400, msg))
    }
    if (env.useMocks) {
      failIfScenario()
      fallarSiDemoPlan()
      try {
        const meta: LastCheckoutMeta = {
          planId: planId === 'store' ? 'store' : 'plus',
          payerEmail: payerEmail?.trim(),
          amount: planId === 'store' ? 89_000 : 14_900,
          planName: planId === 'store' ? 'Tienda aliada' : 'Radar+',
        }
        sessionStorage.setItem(LAST_CHECKOUT_KEY, JSON.stringify(meta))
      } catch { /* sin almacenamiento */ }
      return mockDelay(MOCK_CHECKOUT_RESPONSE)
    }
    return apiClient.post<CheckoutResponseDto>('/api/pagos/checkout', { planId, payerEmail }).then((r) => r.data)
  },

  /** Consulta el estado del pago al backend (ignora el status de la query de MP). */
  getCheckoutResult(orderId: string): Promise<CheckoutResultDto> {
    if (env.useMocks) {
      const custom = readCustomOrders()[orderId]
      const base = custom ?? MOCK_CHECKOUT_RESULTS[orderId]
      if (!base) {
        return Promise.reject(new ApiError(404, MENSAJES['no-existe']))
      }
      const meta = readLastCheckoutMeta()
      const result: CheckoutResultDto = {
        ...base,
        payerEmail: base.payerEmail ?? meta?.payerEmail,
        planId: base.planId ?? (base.planName === 'Tienda aliada' ? 'store' : 'plus'),
      }
      return mockDelay(result)
    }
    return apiClient.get<CheckoutResultDto>(`/api/pagos/resultado/${orderId}`).then((r) => r.data)
  },

  /**
   * RF-96: Genera un nuevo intento de pago a partir de un pago RECHAZADO,
   * conservando el valor y el plan originales con una nueva referencia.
   */
  async retryRejectedPayment(
    originalOrder: CheckoutResultDto,
    payerEmail: string,
    nextStatus: 'aprobado' | 'pendiente' | 'rechazado' = 'aprobado',
  ): Promise<CheckoutResultDto> {
    if (!isValidPayerEmail(payerEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago.')
    }
    if (originalOrder.status !== 'rechazado') {
      throw new ApiError(400, 'Solo se pueden reintentar pagos rechazados.')
    }
    if (env.useMocks) {
      try {
        failIfScenario()
      } catch {
        throw new ApiError(500, 'No fue posible generar un nuevo intento de pago.')
      }
      const newOrderId = `MP-RETRY-${Math.floor(100000 + Math.random() * 900000)}`
      const newOrder: CheckoutResultDto = {
        orderId: newOrderId,
        status: nextStatus,
        planName: originalOrder.planName,
        amount: originalOrder.amount,
        method: 'Mercado Pago',
        payerEmail: payerEmail.trim(),
        planId: originalOrder.planId ?? (originalOrder.planName === 'Tienda aliada' ? 'store' : 'plus'),
      }
      saveCustomOrderResult(newOrder)
      return mockDelay(newOrder, 300)
    }
    return apiClient
      .post<CheckoutResultDto>(`/api/pagos/${originalOrder.orderId}/reintentar`, {
        payerEmail: payerEmail.trim(),
      })
      .then((r) => r.data)
  },
}
