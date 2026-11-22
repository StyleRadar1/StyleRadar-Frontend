import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { fallarSiDemoPlan } from '../mocks/demoPlan'
import { MOCK_BUYER_PAYMENTS } from '../mocks/payments'
import type { PaymentDto } from '../types/payment.dto'
import {
  PLAN_LIMITS,
  type FuncionPago,
  type MiPlanDto,
  type PlanMockScenario,
  type PlanUsuario,
  type VerificacionBeneficioResultDto,
} from '../types/plan.dto'

/** Rutas del API Gateway hacia ms-pagos-suscripciones. Provisionales hasta tener el Swagger (Julian). */
const BASE = '/api/payments/subscriptions/me'
const BUYER_PAYMENTS_KEY = (id: string) => `sr_buyer_payments_${id}`
const PLAN_STATE_KEY = (id: string) => `sr_user_plan_state_${id}`
const PLAN_SCENARIO_KEY = (id: string) => `sr_plan_scenario_${id}`
const DEGRADED_DISMISSED_KEY = (id: string) => `sr_degraded_dismissed_${id}`
const TRYON_USES_KEY = (id: string) => `sr_tryon_photo_uses_${id}`

/** Las pantallas que muestran candados escuchan este evento para actualizarse al cambiar de plan. */
export const PLAN_CHANGED = 'sr:plan'

const DEFAULT_PERIOD_END = '2026-12-09'
const DEFAULT_PERIOD_START = '2026-11-09'

/**
 * Plan simulado por usuario. La cuenta Usuario (u-1) empieza en Radar+, como en el prototipo.
 */
const SEED: Record<string, PlanUsuario> = { 'u-1': 'RADAR_PLUS' }
const key = (id: string) => `sr_plan_${id}`

function evaluateVigencia(dto: MiPlanDto): MiPlanDto {
  if (dto.plan === 'RADAR_PLUS' && dto.renewalEnabled === false && dto.periodEndsAt) {
    const today = new Date().toISOString().slice(0, 10)
    if (dto.periodEndsAt < today) {
      return {
        plan: 'RADAR',
        estado: 'VENCIDA',
        fechaInicio: null,
        fechaFin: null,
        renewalEnabled: false,
        degradedByPayment: dto.degradedByPayment,
        pendingRenewal: dto.pendingRenewal,
      }
    }
  }
  return dto
}

export function readMockPlanState(userId: string): MiPlanDto {
  try {
    const globalMock = sessionStorage.getItem('sr_mock')
    const userScenario = sessionStorage.getItem(PLAN_SCENARIO_KEY(userId)) as PlanMockScenario | null
    if (globalMock === 'DEGRADADO_POR_PAGO' || userScenario === 'DEGRADADO_POR_PAGO') {
      return {
        plan: 'RADAR',
        suscripcionId: `SUB-USR-${userId}`,
        estado: 'SUSPENDIDA',
        fechaInicio: null,
        fechaFin: null,
        renewalEnabled: false,
        degradedByPayment: true,
        pendingRenewal: false,
      }
    }
    if (globalMock === 'RENOVACION_PENDIENTE' || userScenario === 'RENOVACION_PENDIENTE') {
      return {
        plan: 'RADAR',
        suscripcionId: `SUB-USR-${userId}`,
        estado: 'PENDIENTE',
        fechaInicio: null,
        fechaFin: null,
        renewalEnabled: true,
        degradedByPayment: false,
        pendingRenewal: true,
      }
    }

    const rawState = sessionStorage.getItem(PLAN_STATE_KEY(userId))
    if (rawState) {
      const parsed = JSON.parse(rawState) as MiPlanDto
      const evaluated = evaluateVigencia(parsed)
      if (evaluated.plan !== parsed.plan) {
        sessionStorage.setItem(PLAN_STATE_KEY(userId), JSON.stringify(evaluated))
        sessionStorage.setItem(key(userId), evaluated.plan)
      }
      return evaluated
    }

    const legacyPlan = (sessionStorage.getItem(key(userId)) as PlanUsuario | null) ?? SEED[userId] ?? 'RADAR'
    return {
      plan: legacyPlan,
      suscripcionId: legacyPlan === 'RADAR_PLUS' ? `SUB-USR-${userId}` : undefined,
      estado: legacyPlan === 'RADAR_PLUS' ? 'ACTIVA' : undefined,
      fechaInicio: legacyPlan === 'RADAR_PLUS' ? DEFAULT_PERIOD_START : null,
      fechaFin: legacyPlan === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : null,
      proximoCobro: legacyPlan === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : undefined,
      periodEndsAt: legacyPlan === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : undefined,
      renewalEnabled: legacyPlan === 'RADAR_PLUS',
      degradedByPayment: false,
      pendingRenewal: false,
    }
  } catch {
    const fallback = SEED[userId] ?? 'RADAR'
    return {
      plan: fallback,
      suscripcionId: fallback === 'RADAR_PLUS' ? `SUB-USR-${userId}` : undefined,
      estado: fallback === 'RADAR_PLUS' ? 'ACTIVA' : undefined,
      fechaInicio: fallback === 'RADAR_PLUS' ? DEFAULT_PERIOD_START : null,
      fechaFin: fallback === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : null,
      proximoCobro: fallback === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : undefined,
      periodEndsAt: fallback === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : undefined,
      renewalEnabled: fallback === 'RADAR_PLUS',
    }
  }
}

export const mockPlanOf = (userId: string): PlanUsuario => readMockPlanState(userId).plan

/** Solo para pruebas y para fijar el plan directamente en mocks. */
export const setMockPlan = (
  userId: string,
  plan: PlanUsuario,
  options?: { periodEndsAt?: string; renewalEnabled?: boolean; degradedByPayment?: boolean; pendingRenewal?: boolean },
) => {
  try {
    const end = options?.periodEndsAt ?? (plan === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : undefined)
    const renewal = options?.renewalEnabled ?? (plan === 'RADAR_PLUS')
    const state: MiPlanDto = evaluateVigencia({
      plan,
      suscripcionId: plan === 'RADAR_PLUS' ? `SUB-USR-${userId}` : undefined,
      estado: plan === 'RADAR_PLUS' ? 'ACTIVA' : options?.pendingRenewal ? 'PENDIENTE' : options?.degradedByPayment ? 'SUSPENDIDA' : undefined,
      fechaInicio: plan === 'RADAR_PLUS' ? DEFAULT_PERIOD_START : null,
      fechaFin: plan === 'RADAR_PLUS' ? (end ?? null) : null,
      proximoCobro: plan === 'RADAR_PLUS' && renewal ? end : undefined,
      periodEndsAt: plan === 'RADAR_PLUS' ? end : undefined,
      renewalEnabled: renewal,
      degradedByPayment: options?.degradedByPayment ?? false,
      pendingRenewal: options?.pendingRenewal ?? false,
    })
    sessionStorage.setItem(key(userId), state.plan)
    sessionStorage.setItem(PLAN_STATE_KEY(userId), JSON.stringify(state))
    if (!options?.degradedByPayment && !options?.pendingRenewal) {
      sessionStorage.removeItem(PLAN_SCENARIO_KEY(userId))
    }
  } catch { /* sin almacenamiento */ }
}

/** RF-103: Activa o limpia los escenarios mock DEGRADADO_POR_PAGO y RENOVACION_PENDIENTE. */
export function setMockPlanScenario(userId: string, scenario: PlanMockScenario): void {
  try {
    if (scenario === 'DEGRADADO_POR_PAGO') {
      sessionStorage.setItem(PLAN_SCENARIO_KEY(userId), 'DEGRADADO_POR_PAGO')
      sessionStorage.removeItem(DEGRADED_DISMISSED_KEY(userId))
      setMockPlan(userId, 'RADAR', { renewalEnabled: false, degradedByPayment: true, pendingRenewal: false })
      sessionStorage.setItem(PLAN_SCENARIO_KEY(userId), 'DEGRADADO_POR_PAGO')
    } else if (scenario === 'RENOVACION_PENDIENTE') {
      sessionStorage.setItem(PLAN_SCENARIO_KEY(userId), 'RENOVACION_PENDIENTE')
      sessionStorage.removeItem(DEGRADED_DISMISSED_KEY(userId))
      setMockPlan(userId, 'RADAR', { renewalEnabled: true, degradedByPayment: false, pendingRenewal: true })
      sessionStorage.setItem(PLAN_SCENARIO_KEY(userId), 'RENOVACION_PENDIENTE')
    } else {
      sessionStorage.removeItem(PLAN_SCENARIO_KEY(userId))
      sessionStorage.removeItem(DEGRADED_DISMISSED_KEY(userId))
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PLAN_CHANGED))
    }
  } catch { /* sin almacenamiento */ }
}

export function isPlanDegradedDismissed(userId: string): boolean {
  try {
    return sessionStorage.getItem(DEGRADED_DISMISSED_KEY(userId)) === '1'
  } catch {
    return false
  }
}

export function dismissPlanDegradedNotice(userId: string): void {
  try {
    sessionStorage.setItem(DEGRADED_DISMISSED_KEY(userId), '1')
  } catch { /* sin almacenamiento */ }
}

/* ─── Contador de usos de probador con foto propia y evaluación de beneficios (RF-102, B.14) ─── */
export function getTryOnPhotoUses(userId = 'u-1'): number {
  try {
    const raw = sessionStorage.getItem(TRYON_USES_KEY(userId))
    const n = raw ? Number(raw) : 0
    return Number.isNaN(n) ? 0 : n
  } catch {
    return 0
  }
}

export function setTryOnPhotoUses(count: number, userId = 'u-1'): void {
  try {
    sessionStorage.setItem(TRYON_USES_KEY(userId), String(Math.max(0, count)))
  } catch { /* sin almacenamiento */ }
}

/**
 * RF-102 (B.2 y B.14): Evalúa si una función está incluida en el plan vigente y dentro del límite.
 * - Si el plan es Radar, la función exclusiva de Radar+ lanza 403 «Esta función está disponible en el plan Radar+»
 * - Si el plan es Radar+ y alcanzó el límite de 30 usos del probador con foto propia, lanza 422 «Alcanzaste el límite de 30 usos del probador con foto propia»
 */
export function checkFeatureAccess(feature: FuncionPago, userId = 'u-1'): VerificacionBeneficioResultDto {
  const state = readMockPlanState(userId)
  const nombrePlan = state.plan === 'RADAR_PLUS' ? 'Radar+' as const : 'Radar' as const
  const fechaFin = state.plan === 'RADAR_PLUS' ? (state.fechaFin ?? state.periodEndsAt ?? DEFAULT_PERIOD_END) : null

  if (state.plan !== 'RADAR_PLUS') {
    throw new ApiError(403, 'Esta función está disponible en el plan Radar+')
  }

  if (feature === 'probador-foto') {
    const uses = getTryOnPhotoUses(userId)
    if (uses >= PLAN_LIMITS.probadorFoto) {
      throw new ApiError(422, 'Alcanzaste el límite de 30 usos del probador con foto propia')
    }
  }

  return {
    planVigente: { nombre: nombrePlan },
    fechaFin,
    planAplicado: { nombre: nombrePlan },
    resultadoDeUso: true,
  }
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

function getCurrentUserRole(): string | null {
  try {
    const raw = localStorage.getItem('sr_user')
    if (raw) {
      const u = JSON.parse(raw) as { role?: string }
      return u.role ?? null
    }
  } catch { /* noop */ }
  return null
}

const me = () => {
  const u = mockSessionUser()
  if (!u) throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez')
  return u
}

export const userPlanService = {
  /** P8: plan de la persona, del que dependen los candados y la vigencia. */
  async mine(): Promise<MiPlanDto> {
    if (env.useMocks) {
      const mockMode = sessionStorage.getItem('sr_mock')
      if (mockMode !== 'DEGRADADO_POR_PAGO' && mockMode !== 'RENOVACION_PENDIENTE') {
        failIfScenario()
      }
      return mockDelay(readMockPlanState(me().id), 200)
    }
    return apiClient.get<MiPlanDto>(BASE).then((r) => r.data)
  },

  /**
   * RF-97: Consultar historial de pagos propios del comprador autenticado.
   * Endpoint: GET /api/payments/subscriptions/me/payments
   */
  async getMyPayments(): Promise<PaymentDto[]> {
    if (env.useMocks) {
      const mockMode = sessionStorage.getItem('sr_mock')
      if (mockMode === 'HISTORIAL_CAIDO' || mockMode === '503') {
        throw new ApiError(503, 'No pudimos cargar tu historial. Inténtalo en unos minutos')
      }
      try {
        failIfScenario()
      } catch {
        throw new ApiError(503, 'No pudimos cargar tu historial. Inténtalo en unos minutos')
      }
      const user = me()
      const list = readMockBuyerPayments(user.id)
      const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date))
      return mockDelay(sorted, 250)
    }
    return apiClient.get<PaymentDto[]>(`${BASE}/payments`).then((r) =>
      [...r.data].sort((a, b) => b.date.localeCompare(a.date)),
    )
  },

  /**
   * RF-100 y RF-101:
   * - Al cancelar Radar+ (solicitar cambio a RADAR), conserva RADAR_PLUS activo hasta `periodEndsAt`
   *   con `renewalEnabled: false` (RN-01). Al vencer `periodEndsAt`, `evaluateVigencia` pasa a RADAR.
   */
  async change(plan: PlanUsuario): Promise<MiPlanDto> {
    const role = getCurrentUserRole()
    if (role && role !== 'BUYER') {
      throw new ApiError(403, 'Tu cuenta no puede cambiar a ese plan')
    }
    if (env.useMocks) {
      failIfScenario('conflicto')
      fallarSiDemoPlan()
      const user = me()
      const current = readMockPlanState(user.id)
      if (plan === 'RADAR' && current.plan === 'RADAR_PLUS') {
        const end = current.periodEndsAt ?? current.proximoCobro ?? DEFAULT_PERIOD_END
        setMockPlan(user.id, 'RADAR_PLUS', {
          periodEndsAt: end,
          renewalEnabled: false,
          degradedByPayment: false,
          pendingRenewal: false,
        })
      } else {
        setMockPlan(user.id, plan, {
          periodEndsAt: plan === 'RADAR_PLUS' ? DEFAULT_PERIOD_END : undefined,
          renewalEnabled: plan === 'RADAR_PLUS',
          degradedByPayment: false,
          pendingRenewal: false,
        })
      }
      const next = readMockPlanState(user.id)
      const r = await mockDelay(next, 350)
      window.dispatchEvent(new Event(PLAN_CHANGED))
      return r
    }
    const r = await apiClient.put<MiPlanDto>(BASE, { plan }).then((res) => res.data)
    window.dispatchEvent(new Event(PLAN_CHANGED))
    return r
  },

  /**
   * RF-95 y RF-101: Activa o desactiva la renovación automática de Radar+ sin perder la vigencia pagada.
   */
  async setRenewal(enabled: boolean): Promise<MiPlanDto> {
    if (env.useMocks) {
      try {
        failIfScenario('conflicto')
      } catch {
        throw new ApiError(503, 'No fue posible cancelar la renovación de Radar+')
      }
      const user = me()
      const current = readMockPlanState(user.id)
      const end = current.periodEndsAt ?? current.proximoCobro ?? DEFAULT_PERIOD_END
      setMockPlan(user.id, 'RADAR_PLUS', {
        periodEndsAt: end,
        renewalEnabled: enabled,
        degradedByPayment: false,
        pendingRenewal: false,
      })
      const next = readMockPlanState(user.id)
      const r = await mockDelay(next, 250)
      window.dispatchEvent(new Event(PLAN_CHANGED))
      return r
    }
    const r = await apiClient
      .post<MiPlanDto>(`${BASE}/${enabled ? 'reactivate-renewal' : 'cancel-renewal'}`)
      .then((res) => res.data)
    window.dispatchEvent(new Event(PLAN_CHANGED))
    return r
  },

  /**
   * RF-100: el plan de pago solo queda activo con un pago aprobado. Se llama desde la pantalla de resultado del pago.
   */
  activatePaid(plan: PlanUsuario): void {
    if (env.useMocks) {
      const u = mockSessionUser()
      if (u) {
        sessionStorage.removeItem(PLAN_SCENARIO_KEY(u.id))
        sessionStorage.removeItem(DEGRADED_DISMISSED_KEY(u.id))
        setMockPlan(u.id, plan, {
          periodEndsAt: DEFAULT_PERIOD_END,
          renewalEnabled: true,
          degradedByPayment: false,
          pendingRenewal: false,
        })
      }
    }
    window.dispatchEvent(new Event(PLAN_CHANGED))
  },
}
