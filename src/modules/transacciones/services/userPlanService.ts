import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import type { MiPlanDto, PlanUsuario } from '../types/plan.dto'

/** Rutas del API Gateway hacia ms-pagos-suscripciones. Provisionales hasta tener el Swagger (Julian). */
const BASE = '/api/payments/subscriptions/me'
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
}
