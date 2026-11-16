import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { correoValido } from '@/modules/identidad/utils/formato'
import { MOCK_CHECKOUT_RESPONSE, STORE_PLAN } from '../mocks/plans'
import type { PaymentDto } from '../types/payment.dto'
import type { CheckoutResponseDto } from '../types/plan.dto'
import type {
  StorePayResult,
  StoreSubscriptionDto,
  StoreSubscriptionStateDto,
  StoreSubscriptionStatus,
} from '../types/storeSubscription.dto'
import { planService } from './planService'

/** Rutas del API Gateway hacia ms-pagos-suscripciones. Provisionales hasta tener el Swagger (Julian). */
const BASE = '/api/payments/subscriptions/store'

/* ─── Estado simulado: vive en la pestaña, por usuario, para sobrevivir a recargas ─── */
const key = (id: string) => `sr_store_sub_${id}`
const SEED = (): StoreSubscriptionStateDto => ({
  subscription: {
    status: 'PRUEBA',
    planName: STORE_PLAN.name,
    amount: STORE_PLAN.price,
    trialEndsAt: '2026-11-30',
    renewalEnabled: true,
  },
  payments: [],
})

const sessionId = () => mockSessionUser()?.id ?? 'anon'

export function readMockStoreSubscription(userId?: string): StoreSubscriptionStateDto {
  try {
    const raw = sessionStorage.getItem(key(userId ?? sessionId()))
    if (raw) return JSON.parse(raw) as StoreSubscriptionStateDto
  } catch { /* sin almacenamiento */ }
  return SEED()
}

function writeState(s: StoreSubscriptionStateDto, userId?: string) {
  try {
    sessionStorage.setItem(key(userId ?? sessionId()), JSON.stringify(s))
  } catch { /* sin almacenamiento */ }
}

/** Permite fijar el estado de suscripción en modo mock (útil para pruebas de suspensión/onboarding). */
export function setMockStoreSubscriptionStatus(status: StoreSubscriptionStatus, userId?: string) {
  const current = readMockStoreSubscription(userId)
  writeState(
    {
      ...current,
      subscription: {
        ...current.subscription,
        status,
        renewalEnabled: status === 'ACTIVA' ? current.subscription.renewalEnabled : false,
      },
    },
    userId,
  )
}

/** Solo para pruebas: deja la tienda otra vez en su periodo gratuito. */
export const resetMockStoreSubscription = () => {
  try { sessionStorage.removeItem(key(sessionId())) } catch { /* sin almacenamiento */ }
}

const addOneMonth = (): string => {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export const storeSubscriptionService = {
  /** Suscripción vigente y su historial de pagos. */
  async get(): Promise<StoreSubscriptionStateDto> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(readMockStoreSubscription(), 250)
    }
    const [subscription, payments] = await Promise.all([
      apiClient.get<StoreSubscriptionDto>(BASE).then((r) => r.data),
      apiClient.get<PaymentDto[]>(`${BASE}/payments`).then((r) => r.data),
    ])
    return { subscription, payments }
  },

  /**
   * RF-67 y RF-93: paga la suscripción con Mercado Pago. La suscripción solo se activa con un pago aprobado
   * (RF-94); un pago rechazado o pendiente queda en el historial y no activa nada. No se duplica una suscripción activa.
   * En mocks no hay redirección: se resuelve con `orderId` (por defecto uno aprobado).
   */
  async pay(orderId = 'MOCK_STORE_OK', payerEmail?: string): Promise<StorePayResult> {
    if (payerEmail !== undefined && !correoValido(payerEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago.')
    }
    if (!env.useMocks) {
      const r = await apiClient
        .post<CheckoutResponseDto>(`${BASE}/checkout`, { payerEmail })
        .then((res) => res.data)
      return { redirectTo: r.initPoint }
    }
    failIfScenario()
    const before = readMockStoreSubscription()
    if (before.subscription.status === 'ACTIVA') {
      throw new ApiError(409, 'Tu almacén ya tiene una suscripción activa o un pago pendiente.')
    }
    await mockDelay(MOCK_CHECKOUT_RESPONSE, 300)
    const result = await planService.getCheckoutResult(orderId)

    const state = readMockStoreSubscription()
    const u = mockSessionUser()
    const resolvedEmail = payerEmail?.trim() || `${u?.id ?? 'tienda'}@styleradar.co`
    const payment: PaymentDto = {
      id: `SR-${2000 + state.payments.length}`,
      userId: u?.id ?? 'anon',
      userName: u?.name ?? 'Tienda',
      userEmail: resolvedEmail,
      userRole: 'ADMIN_ALMACEN',
      planId: 'store',
      planName: result.planName,
      amount: result.amount,
      method: (result.method as PaymentDto['method'] | undefined) ?? 'Mercado Pago',
      date: new Date().toISOString().slice(0, 10),
      status: result.status === 'aprobado' ? 'aprobado' : result.status === 'pendiente' ? 'pendiente' : 'rechazado',
    }
    const next: StoreSubscriptionStateDto = {
      subscription: {
        ...state.subscription,
        ...(payerEmail ? { payerEmail: resolvedEmail } : {}),
      },
      payments: [payment, ...state.payments],
    }
    if (result.status === 'aprobado') {
      next.subscription = {
        status: 'ACTIVA',
        planName: STORE_PLAN.name,
        amount: STORE_PLAN.price,
        payerEmail: resolvedEmail,
        periodEndsAt: addOneMonth(),
        renewalEnabled: true,
      }
    }
    writeState(next)
    return { result: { ...result, payerEmail: resolvedEmail } }
  },

  /**
   * RF-67: activación obligatoria desde el onboarding tras el registro del almacén.
   * Valida correo (400), verifica que no tenga suscripción ACTIVA ni pago PENDIENTE (403),
   * y actualiza el estado a PENDIENTE o ACTIVA según el resultado de Mercado Pago.
   */
  async activateFromOnboarding(payerEmail: string, orderId = 'MOCK_STORE_OK'): Promise<StorePayResult> {
    if (!correoValido(payerEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago.')
    }
    const before = readMockStoreSubscription()
    if (
      before.subscription.status === 'ACTIVA' ||
      before.subscription.status === 'PENDIENTE' ||
      before.payments.some((p) => p.status === 'pendiente')
    ) {
      throw new ApiError(403, 'Tu almacén ya tiene una suscripción activa o un pago pendiente.')
    }
    if (!env.useMocks) {
      const r = await apiClient
        .post<CheckoutResponseDto>(`${BASE}/checkout`, { payerEmail: payerEmail.trim() })
        .then((res) => res.data)
      return { redirectTo: r.initPoint }
    }
    failIfScenario()
    await mockDelay(MOCK_CHECKOUT_RESPONSE, 300)
    const result = await planService.getCheckoutResult(orderId)

    const state = readMockStoreSubscription()
    const u = mockSessionUser()
    const resolvedEmail = payerEmail.trim()
    const payment: PaymentDto = {
      id: `SR-${2000 + state.payments.length}`,
      userId: u?.id ?? 'anon',
      userName: u?.name ?? 'Tienda',
      userEmail: resolvedEmail,
      userRole: 'ADMIN_ALMACEN',
      planId: 'store',
      planName: result.planName,
      amount: result.amount,
      method: (result.method as PaymentDto['method'] | undefined) ?? 'Mercado Pago',
      date: new Date().toISOString().slice(0, 10),
      status: result.status === 'aprobado' ? 'aprobado' : result.status === 'pendiente' ? 'pendiente' : 'rechazado',
    }
    const nextStatus: StoreSubscriptionStatus =
      result.status === 'aprobado'
        ? 'ACTIVA'
        : result.status === 'pendiente'
          ? 'PENDIENTE'
          : state.subscription.status
    const next: StoreSubscriptionStateDto = {
      subscription: {
        ...state.subscription,
        status: nextStatus,
        planName: STORE_PLAN.name,
        amount: STORE_PLAN.price,
        payerEmail: resolvedEmail,
        ...(result.status === 'aprobado' ? { periodEndsAt: addOneMonth(), renewalEnabled: true } : {}),
      },
      payments: [payment, ...state.payments],
    }
    writeState(next)
    return { result: { ...result, payerEmail: resolvedEmail } }
  },

  /**
   * RF-96: Reintenta un pago RECHAZADO de la tienda indicando el correo del pagador.
   * Crea una nueva transacción por el mismo valor y conserva el pago rechazado original en el historial.
   */
  async retryPayment(paymentId: string, payerEmail: string, orderId = 'MOCK_STORE_OK'): Promise<StorePayResult> {
    if (!correoValido(payerEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago.')
    }
    const before = readMockStoreSubscription()
    const original = before.payments.find((p) => p.id === paymentId && p.status === 'rechazado') ??
      before.payments.find((p) => p.status === 'rechazado')
    if (!original) {
      throw new ApiError(400, 'Solo se pueden reintentar pagos rechazados.')
    }
    if (!env.useMocks) {
      const r = await apiClient
        .post<CheckoutResponseDto>(`${BASE}/payments/${original.id}/retry`, { payerEmail: payerEmail.trim() })
        .then((res) => res.data)
      return { redirectTo: r.initPoint }
    }
    try {
      failIfScenario()
    } catch {
      throw new ApiError(500, 'No fue posible generar un nuevo intento de pago.')
    }
    await mockDelay(MOCK_CHECKOUT_RESPONSE, 300)
    const result = await planService.getCheckoutResult(orderId)

    const state = readMockStoreSubscription()
    const u = mockSessionUser()
    const resolvedEmail = payerEmail.trim()
    const newRef = `SR-R${2000 + state.payments.length}`
    const payment: PaymentDto = {
      id: newRef,
      userId: u?.id ?? original.userId,
      userName: u?.name ?? original.userName,
      userEmail: resolvedEmail,
      userRole: 'ADMIN_ALMACEN',
      planId: 'store',
      planName: original.planName,
      amount: original.amount,
      method: (result.method as PaymentDto['method'] | undefined) ?? 'Mercado Pago',
      date: new Date().toISOString().slice(0, 10),
      status: result.status === 'aprobado' ? 'aprobado' : result.status === 'pendiente' ? 'pendiente' : 'rechazado',
    }
    const next: StoreSubscriptionStateDto = {
      subscription: {
        ...state.subscription,
        payerEmail: resolvedEmail,
      },
      payments: [payment, ...state.payments],
    }
    if (result.status === 'aprobado') {
      next.subscription = {
        status: 'ACTIVA',
        planName: original.planName,
        amount: original.amount,
        payerEmail: resolvedEmail,
        periodEndsAt: addOneMonth(),
        renewalEnabled: true,
      }
    }
    writeState(next)
    return {
      result: {
        ...result,
        orderId: newRef,
        planName: original.planName,
        amount: original.amount,
        payerEmail: resolvedEmail,
      },
    }
  },

  /**
   * RF-68: cancela la renovación (y el cobro automático en la pasarela). La suscripción sigue hasta el fin del
   * periodo pagado, sin devolución por el tiempo restante. Cancelar dos veces conserva el estado sin duplicar.
   */
  async cancelRenewal(): Promise<StoreSubscriptionDto> {
    if (!env.useMocks) return apiClient.post<StoreSubscriptionDto>(`${BASE}/cancel-renewal`).then((r) => r.data)
    failIfScenario('conflicto')
    const state = readMockStoreSubscription()
    if (state.subscription.status !== 'ACTIVA') throw new ApiError(409, 'No hay una suscripción activa para cancelar.')
    if (!state.subscription.renewalEnabled) return mockDelay(state.subscription, 200)
    const subscription = { ...state.subscription, renewalEnabled: false }
    writeState({ ...state, subscription })
    return mockDelay(subscription, 400)
  },
}
