import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { MOCK_CHECKOUT_RESPONSE, STORE_PLAN } from '../mocks/plans'
import type { PaymentDto } from '../types/payment.dto'
import type { CheckoutResponseDto } from '../types/plan.dto'
import type { StorePayResult, StoreSubscriptionDto, StoreSubscriptionStateDto } from '../types/storeSubscription.dto'
import { planService } from './planService'

/** Rutas del API Gateway hacia ms-pagos-suscripciones. Provisionales hasta tener el Swagger (Julian). */
const BASE = '/api/payments/subscriptions/store'

/* ─── Estado simulado: vive en la pestaña, por usuario, para sobrevivir a recargas ─── */
const key = (id: string) => `sr_store_sub_${id}`
const SEED = (): StoreSubscriptionStateDto => ({
  subscription: { status: 'PRUEBA', planName: STORE_PLAN.name, amount: STORE_PLAN.price, trialEndsAt: '2026-11-30', renewalEnabled: true },
  payments: [],
})

const sessionId = () => mockSessionUser()?.id ?? 'anon'

function readState(): StoreSubscriptionStateDto {
  try {
    const raw = sessionStorage.getItem(key(sessionId()))
    if (raw) return JSON.parse(raw) as StoreSubscriptionStateDto
  } catch { /* sin almacenamiento */ }
  return SEED()
}
function writeState(s: StoreSubscriptionStateDto) {
  try { sessionStorage.setItem(key(sessionId()), JSON.stringify(s)) } catch { /* sin almacenamiento */ }
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
    if (env.useMocks) { failIfScenario(); return mockDelay(readState(), 250) }
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
  async pay(orderId = 'MOCK_STORE_OK'): Promise<StorePayResult> {
    if (!env.useMocks) {
      const r = await apiClient.post<CheckoutResponseDto>(`${BASE}/checkout`).then((res) => res.data)
      return { redirectTo: r.initPoint }
    }
    failIfScenario()
    const before = readState()
    if (before.subscription.status === 'ACTIVA') throw new ApiError(409, 'Tu tienda ya tiene una suscripción activa.')
    await mockDelay(MOCK_CHECKOUT_RESPONSE, 300)
    const result = await planService.getCheckoutResult(orderId)

    const state = readState()
    const u = mockSessionUser()
    const payment: PaymentDto = {
      id: `SR-${2000 + state.payments.length}`,
      userId: u?.id ?? 'anon',
      userName: u?.name ?? 'Tienda',
      userEmail: `${u?.id ?? 'tienda'}@styleradar.co`,
      userRole: 'ADMIN_ALMACEN',
      planId: 'store',
      planName: result.planName,
      amount: result.amount,
      method: (result.method as PaymentDto['method'] | undefined) ?? 'Mercado Pago',
      date: new Date().toISOString().slice(0, 10),
      status: result.status === 'aprobado' ? 'aprobado' : result.status === 'pendiente' ? 'pendiente' : 'rechazado',
    }
    const next: StoreSubscriptionStateDto = { subscription: state.subscription, payments: [payment, ...state.payments] }
    if (result.status === 'aprobado') {
      next.subscription = { status: 'ACTIVA', planName: STORE_PLAN.name, amount: STORE_PLAN.price, periodEndsAt: addOneMonth(), renewalEnabled: true }
    }
    writeState(next)
    return { result }
  },

  /**
   * RF-68: cancela la renovación (y el cobro automático en la pasarela). La suscripción sigue hasta el fin del
   * periodo pagado, sin devolución por el tiempo restante. Cancelar dos veces conserva el estado sin duplicar.
   */
  async cancelRenewal(): Promise<StoreSubscriptionDto> {
    if (!env.useMocks) return apiClient.post<StoreSubscriptionDto>(`${BASE}/cancel-renewal`).then((r) => r.data)
    failIfScenario('conflicto')
    const state = readState()
    if (state.subscription.status !== 'ACTIVA') throw new ApiError(409, 'No hay una suscripción activa para cancelar.')
    if (!state.subscription.renewalEnabled) return mockDelay(state.subscription, 200)
    const subscription = { ...state.subscription, renewalEnabled: false }
    writeState({ ...state, subscription })
    return mockDelay(subscription, 400)
  },
}
