import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { isValidPayerEmail } from '../utils/validation'
import { isPlanCompatibleWithRole, RADAR_PLUS_PRICE, STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import {
  mapPlansResponse,
  mapRetryPaymentResponse,
  mapStartSubscriptionResponse,
  mapSubscriptionStatus,
  type ApiPlanResponse,
  type ApiRetryPaymentRequest,
  type ApiRetryPaymentResponse,
  type ApiStartSubscriptionRequest,
  type ApiStartSubscriptionResponse,
  type ApiSubscriptionResponse,
} from '../mappers/paymentsMappers'
import { fallarSiDemoPlan } from '../mocks/demoPlan'
import { PLANS, MOCK_CHECKOUT_RESPONSE, MOCK_CHECKOUT_RESULTS } from '../mocks/plans'
import { aRol, type Role } from '@/modules/core/types/roles'
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

function getCurrentUserEmail(): string {
  try {
    const raw = localStorage.getItem('sr_user')
    if (raw) {
      const u = JSON.parse(raw) as { email?: string }
      return u.email?.trim() ?? ''
    }
  } catch { /* noop */ }
  return ''
}

function getCurrentUserRole(): Role | null {
  try {
    const raw = localStorage.getItem('sr_user')
    if (raw) {
      const u = JSON.parse(raw) as { role?: unknown }
      return aRol(u.role)
    }
  } catch { /* noop */ }
  return null
}

export const planService = {
  /** Devuelve los planes activos desde `GET /api/v1/plans` (o mocks si `env.useMocksPagos`). */
  async getPlans(): Promise<PlanDto[]> {
    if (env.useMocksPagos) return mockDelay(PLANS)
    const { data } = await apiClient.get<ApiPlanResponse[]>('/api/v1/plans')
    return mapPlansResponse(Array.isArray(data) ? data : [])
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

  /** Inicia una suscripción de usuario (`POST /api/v1/subscriptions/start`, responde 202 Accepted con `initPoint`). */
  async createCheckout(
    planId: string,
    payerEmail?: string,
    backendPlanId?: number,
  ): Promise<CheckoutResponseDto> {
    const role = getCurrentUserRole()
    if (role && (!isPlanCompatibleWithRole(planId, role) || role !== 'BUYER')) {
      return Promise.reject(new ApiError(403, 'Tu cuenta no puede cambiar a ese plan'))
    }
    if (payerEmail !== undefined && !isValidPayerEmail(payerEmail)) {
      const msg = planId === 'plus'
        ? 'Ingresa un correo electrónico válido para activar Radar+'
        : 'Ingresa un correo electrónico válido para realizar el pago'
      return Promise.reject(new ApiError(400, msg))
    }
    if (env.useMocksPagos) {
      failIfScenario()
      fallarSiDemoPlan()
      try {
        const meta: LastCheckoutMeta = {
          planId: planId === 'store' ? 'store' : 'plus',
          payerEmail: payerEmail?.trim(),
          amount: planId === 'store' ? STORE_SUBSCRIPTION_PRICE : RADAR_PLUS_PRICE,
          planName: planId === 'store' ? 'Tienda aliada' : 'Radar+',
        }
        sessionStorage.setItem(LAST_CHECKOUT_KEY, JSON.stringify(meta))
      } catch { /* sin almacenamiento */ }
      return mockDelay(MOCK_CHECKOUT_RESPONSE)
    }
    const cleanEmail = (payerEmail ?? getCurrentUserEmail()).trim()
    if (!isValidPayerEmail(cleanEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para activar Radar+')
    }
    const body: ApiStartSubscriptionRequest = {
      subscriberType: 'USER',
      payerEmail: cleanEmail,
      ...(backendPlanId !== undefined ? { planId: backendPlanId } : {}),
    }
    const { data } = await apiClient.post<ApiStartSubscriptionResponse>('/api/v1/subscriptions/start', body)
    return mapStartSubscriptionResponse(data)
  },

  /**
   * Consulta el estado tras volver de Mercado Pago (RF-94).
   * En modo real la suscripción la activa el backend por webhook: consulta `GET /api/v1/subscriptions/{subscriberId}`
   * y muestra PENDIENTE hasta que cambie.
   */
  async getCheckoutResult(orderId: string): Promise<CheckoutResultDto> {
    if (env.useMocksPagos) {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sr_demo_plan') === '401') {
        return Promise.reject(new ApiError(401, 'Tu pago continúa pendiente de confirmación'))
      }
      const custom = readCustomOrders()[orderId]
      const base = custom ?? MOCK_CHECKOUT_RESULTS[orderId]
      if (!base) {
        return Promise.reject(new ApiError(404, MENSAJES['no-existe']))
      }
      const meta = readLastCheckoutMeta()
      const today = new Date().toISOString().slice(0, 10)
      const nextMonth = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
      const isApproved = base.status === 'aprobado'
      const result: CheckoutResultDto = {
        ...base,
        payerEmail: base.payerEmail ?? meta?.payerEmail,
        planId: base.planId ?? meta?.planId ?? 'plus',
        estadoSuscripcion: isApproved ? 'ACTIVA' : 'PENDIENTE',
        fechaInicio: isApproved ? (base.fechaInicio ?? today) : null,
        fechaFin: isApproved ? (base.fechaFin ?? nextMonth) : null,
      }
      return mockDelay(result)
    }
    const user = mockSessionUser()
    if (!user?.id) {
      throw new ApiError(401, 'Tu pago continúa pendiente de confirmación')
    }
    const { data } = await apiClient.get<ApiSubscriptionResponse>(
      `/api/v1/subscriptions/${encodeURIComponent(user.id)}`,
    )
    const mappedStatus = mapSubscriptionStatus(data.status, {
      autoRenewal: data.autoRenewal,
      endDate: data.endDate,
    })
    const isActive = mappedStatus.status === 'ACTIVA'
    const meta = readLastCheckoutMeta()
    return {
      orderId,
      status: isActive ? 'aprobado' : 'pendiente',
      planName: data.plan?.name?.trim() || meta?.planName || 'Radar+',
      amount: data.plan?.price?.value ?? meta?.amount ?? RADAR_PLUS_PRICE,
      method: 'Mercado Pago',
      payerEmail: meta?.payerEmail,
      planId: data.subscriberType === 'STORE' ? 'store' : 'plus',
      estadoSuscripcion: mappedStatus.status,
      fechaInicio: data.startDate ?? null,
      fechaFin: data.endDate ?? null,
    }
  },

  /**
   * RF-96: Genera un nuevo intento de pago a partir de un pago RECHAZADO (`POST /api/v1/payments/{orderId}/retry`),
   * conservando el valor y el plan originales con una nueva referencia (nace PENDIENTE).
   */
  async retryRejectedPayment(
    originalOrder: CheckoutResultDto,
    payerEmail: string,
    nextStatus: 'aprobado' | 'pendiente' | 'rechazado' = 'pendiente',
  ): Promise<CheckoutResultDto & { initPoint?: string }> {
    if (!isValidPayerEmail(payerEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago')
    }
    if (originalOrder.status !== 'rechazado') {
      throw new ApiError(400, 'Solo se pueden reintentar pagos rechazados')
    }
    if (env.useMocksPagos) {
      try {
        failIfScenario()
      } catch {
        throw new ApiError(503, 'No fue posible generar un nuevo intento de pago')
      }
      const newOrderId = `MP-RETRY-${Math.floor(100000 + Math.random() * 900000)}`
      const newOrder: CheckoutResultDto = {
        orderId: newOrderId,
        status: nextStatus,
        planName: originalOrder.planName,
        amount: originalOrder.amount,
        method: 'Mercado Pago',
        payerEmail: payerEmail.trim(),
        planId: originalOrder.planId ?? 'plus',
        estadoSuscripcion: nextStatus === 'aprobado' ? 'ACTIVA' : 'PENDIENTE',
        fechaInicio: nextStatus === 'aprobado' ? new Date().toISOString().slice(0, 10) : null,
        fechaFin: nextStatus === 'aprobado' ? new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10) : null,
      }
      saveCustomOrderResult(newOrder)
      return mockDelay(newOrder, 300)
    }
    const body: ApiRetryPaymentRequest = { payerEmail: payerEmail.trim() }
    const { data } = await apiClient.post<ApiRetryPaymentResponse>(
      `/api/v1/payments/${encodeURIComponent(originalOrder.orderId)}/retry`,
      body,
    )
    return mapRetryPaymentResponse(data, originalOrder, payerEmail)
  },
}
