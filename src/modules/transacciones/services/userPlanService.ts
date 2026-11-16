import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { MOCK_BUYER_PAYMENTS } from '../mocks/payments'
import type { PaymentDto } from '../types/payment.dto'
import type { MiPlanDto, PlanUsuario } from '../types/plan.dto'

/** Rutas del API Gateway hacia ms-pagos-suscripciones. Provisionales hasta tener el Swagger (Julian). */
const BASE = '/api/payments/subscriptions/me'
const BUYER_PAYMENTS_KEY = (id: string) => `sr_buyer_payments_${id}`
/** Las pantallas que muestran candados escuchan este evento para actualizarse al cambiar de plan. */
export const PLAN_CHANGED = 'sr:plan'

/**
 * Plan simulado por usuario. La cuenta Usuario (u-1) empieza en Radar+, como en el prototipo:
 * para ver los candados se baja a Radar desde /planes. Se guarda en la pestaña para sobrevivir a recargas.
 */
const SEED: Record<string, PlanUsuario> = { 'u-1': 'RADAR_PLUS' }
const key = (id: string) => `sr_plan_${id}`
export const mockPlanOf = (userId: string): PlanUsuario => {
  try { return (sessionStorage.getItem(key(userId)) as PlanUsuario | null) ?? SEED[userId] ?? 'RADAR' } catch { return SEED[userId] ?? 'RADAR' }
}
/** Solo para pruebas y para el cambio de plan simulado. */
export const setMockPlan = (userId: string, plan: PlanUsuario) => {
  try { sessionStorage.setItem(key(userId), plan) } catch { /* sin almacenamiento */ }
}

export function readMockBuyerPayments(userId: string): PaymentDto[] {
  try {
    const raw = sessionStorage.getItem(BUYER_PAYMENTS_KEY(userId))
    if (raw) return JSON.parse(raw) as PaymentDto[]
  } catch { /* sin almacenamiento */ }
  return MOCK_BUYER_PAYMENTS[userId] ? [...MOCK_BUYER_PAYMENTS[userId]] : []
}

export function setMockBuyerPayments(userId: string, payments: PaymentDto[]): void {
  try {
    sessionStorage.setItem(BUYER_PAYMENTS_KEY(userId), JSON.stringify(payments))
  } catch { /* sin almacenamiento */ }
}

const me = () => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  return u
}
const mio = (plan: PlanUsuario): MiPlanDto => ({ plan, proximoCobro: plan === 'RADAR_PLUS' ? '2026-12-09' : undefined })

export const userPlanService = {
  /** P8: plan de la persona, del que dependen los candados. */
  async mine(): Promise<MiPlanDto> {
    if (env.useMocks) { failIfScenario(); return mockDelay(mio(mockPlanOf(me().id)), 200) }
    return apiClient.get<MiPlanDto>(BASE).then((r) => r.data)
  },

  /**
   * RF-97: Consultar historial de pagos propios del comprador autenticado.
   * Endpoint: GET /api/payments/subscriptions/me/payments
   */
  async getMyPayments(): Promise<PaymentDto[]> {
    if (env.useMocks) {
      failIfScenario()
      const user = me()
      const list = readMockBuyerPayments(user.id)
      const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date))
      return mockDelay(sorted, 250)
    }
    return apiClient.get<PaymentDto[]>(`${BASE}/payments`).then((r) =>
      [...r.data].sort((a, b) => b.date.localeCompare(a.date)),
    )
  },

  /** RF-100 y RF-101: cambiar entre Radar y Radar+. El cobro real lo hace ms-pagos con la pasarela. */
  async change(plan: PlanUsuario): Promise<MiPlanDto> {
    if (env.useMocks) {
      failIfScenario('conflicto')
      setMockPlan(me().id, plan)
      const r = await mockDelay(mio(plan), 500)
      window.dispatchEvent(new Event(PLAN_CHANGED))
      return r
    }
    const r = await apiClient.put<MiPlanDto>(BASE, { plan }).then((res) => res.data)
    window.dispatchEvent(new Event(PLAN_CHANGED))
    return r
  },

  /**
   * RF-100: el plan de pago solo queda activo con un pago aprobado. Se llama desde la pantalla de resultado del pago.
   * En mocks simula la activación; con el backend real ms-pagos ya la hizo, y aquí solo se avisa a las pantallas.
   */
  activatePaid(plan: PlanUsuario): void {
    if (env.useMocks) {
      const u = mockSessionUser()
      if (u) setMockPlan(u.id, plan)
    }
    window.dispatchEvent(new Event(PLAN_CHANGED))
  },
}
