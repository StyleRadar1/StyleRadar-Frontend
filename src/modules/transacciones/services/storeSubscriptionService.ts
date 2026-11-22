import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { isValidNit, isValidPayerEmail } from '../utils/validation'
import { STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import { MOCK_CHECKOUT_RESPONSE, STORE_PLAN } from '../mocks/plans'
import type { PaymentDto } from '../types/payment.dto'
import type { CheckoutResponseDto } from '../types/plan.dto'
import type {
  StorePayResult,
  StoreSubscriptionActivationDto,
  StoreSubscriptionDto,
  StoreSubscriptionStateDto,
  StoreSubscriptionStatus,
} from '../types/storeSubscription.dto'
import { planService } from './planService'

/** Rutas del API Gateway hacia ms-pagos-suscripciones. Provisionales hasta tener el Swagger (Julian). */
const BASE = '/api/payments/subscriptions/store'

/* ─── Estado simulado: vive en la pestaña, por usuario, para sobrevivir a recargas ─── */
const key = (id: string) => `sr_store_sub_${id}`
const SUSPENDED_STORES_KEY = 'sr_suspended_store_names'
export const STORE_SUB_CHANGED = 'sr:store-sub-changed'

const SEED = (): StoreSubscriptionStateDto => ({
  subscription: {
    suscripcionId: 'SUB-ALM-1',
    status: 'PENDIENTE',
    estado: 'PENDIENTE',
    planName: STORE_PLAN.name,
    amount: STORE_SUBSCRIPTION_PRICE,
    fechaInicio: null,
    fechaFin: null,
    renewalEnabled: false,
    autoRenovacion: false,
  },
  payments: [],
})

const sessionId = () => mockSessionUser()?.id ?? 'anon'

function readSuspendedStoreNames(): string[] {
  try {
    const raw = sessionStorage.getItem(SUSPENDED_STORES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function setStoreSuspendedByName(storeName: string, suspended: boolean): void {
  try {
    const normalized = storeName.trim().toLowerCase()
    const current = readSuspendedStoreNames()
    const next = suspended
      ? Array.from(new Set([...current, normalized]))
      : current.filter((n) => n !== normalized)
    sessionStorage.setItem(SUSPENDED_STORES_KEY, JSON.stringify(next))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(STORE_SUB_CHANGED))
    }
  } catch { /* sin almacenamiento */ }
}

/**
 * RF-99: Verifica si el catálogo de una tienda está suspendido por falta de pago.
 */
export function isStoreSuspended(storeName: string): boolean {
  if (!storeName || storeName === 'Segunda mano') return false
  const normalized = storeName.trim().toLowerCase()
  if (readSuspendedStoreNames().includes(normalized)) return true
  if (normalized === 'luna store') {
    const t1 = readMockStoreSubscription('t-1')
    const current = readMockStoreSubscription()
    if (t1.subscription.status === 'SUSPENDIDA' || current.subscription.status === 'SUSPENDIDA') {
      return true
    }
  }
  return false
}

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
    const u = mockSessionUser()
    const storeName = u?.name || 'Luna Store'
    setStoreSuspendedByName(storeName, s.subscription.status === 'SUSPENDIDA')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(STORE_SUB_CHANGED))
    }
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
  try {
    sessionStorage.removeItem(key(sessionId()))
    sessionStorage.removeItem(SUSPENDED_STORES_KEY)
  } catch { /* sin almacenamiento */ }
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
    if (payerEmail !== undefined && !isValidPayerEmail(payerEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago')
    }
    if (!env.useMocks) {
      const r = await apiClient
        .post<CheckoutResponseDto>(`${BASE}/checkout`, { payerEmail })
        .then((res) => res.data)
      return { redirectTo: r.initPoint }
    }
    try {
      failIfScenario()
    } catch {
      throw new ApiError(503, 'No fue posible iniciar el pago en este momento. Inténtalo nuevamente')
    }
    const before = readMockStoreSubscription()
    if (before.subscription.status === 'ACTIVA') {
      throw new ApiError(409, 'Tu almacén ya tiene una suscripción activa o un pago pendiente')
    }
    const wasSuspended = before.subscription.status === 'SUSPENDIDA'
    await mockDelay(MOCK_CHECKOUT_RESPONSE, 300)
    const result = await planService.getCheckoutResult(orderId)

    const state = readMockStoreSubscription()
    const u = mockSessionUser()
    const resolvedEmail = payerEmail?.trim() || `${u?.id ?? 'tienda'}@styleradar.co`
    const pagoId = `SR-${2000 + state.payments.length}`
    const suscripcionId = state.subscription.suscripcionId ?? `SUB-ALM-${u?.id ?? '1'}`
    const today = new Date().toISOString().slice(0, 10)
    const payment: PaymentDto = {
      id: pagoId,
      pagoId,
      suscripcionId,
      suscriptorId: u?.id ?? 'anon',
      userId: u?.id ?? 'anon',
      userName: u?.name ?? 'Tienda',
      userEmail: resolvedEmail,
      userRole: 'ADMIN_ALMACEN',
      planId: 'store',
      planName: result.planName,
      amount: result.amount,
      valor: result.amount,
      currency: 'COP',
      moneda: 'COP',
      mpReference: orderId,
      referencia: orderId,
      referenciaExterna: orderId,
      method: (result.method as PaymentDto['method'] | undefined) ?? 'Mercado Pago',
      date: today,
      fecha: today,
      status: result.status === 'aprobado' ? 'aprobado' : result.status === 'pendiente' ? 'pendiente' : 'rechazado',
      estado: result.status === 'aprobado' ? 'APROBADO' : result.status === 'pendiente' ? 'PENDIENTE' : 'RECHAZADO',
    }
    const next: StoreSubscriptionStateDto = {
      subscription: {
        ...state.subscription,
        suscripcionId,
        ...(payerEmail ? { payerEmail: resolvedEmail } : {}),
      },
      payments: [payment, ...state.payments],
    }
    if (result.status === 'aprobado') {
      const endPeriod = addOneMonth()
      next.subscription = {
        ...state.subscription,
        suscripcionId,
        status: 'ACTIVA',
        estado: 'ACTIVA',
        planName: STORE_PLAN.name,
        amount: STORE_PLAN.price,
        payerEmail: resolvedEmail,
        fechaInicio: today,
        periodEndsAt: endPeriod,
        fechaFin: endPeriod,
        renewalEnabled: true,
        autoRenovacion: true,
      }
      if (wasSuspended && u?.name) {
        setStoreSuspendedByName(u.name, false)
      }
    }
    writeState(next)
    return {
      result: { ...result, payerEmail: resolvedEmail },
      output: {
        suscripcionId,
        ordenId: orderId,
        estado: result.status === 'aprobado' ? 'ACTIVA' : 'PENDIENTE',
        initPoint: MOCK_CHECKOUT_RESPONSE.initPoint,
      },
    }
  },

  /**
   * RF-67: activación obligatoria desde el onboarding tras el registro del almacén.
   * DTO: { correoPagador, nit, almacenId }, donde almacenId sale de la sesión y nunca del formulario.
   * Valida correo (400) y NIT de 9 caracteres (400), verifica que no tenga suscripción ACTIVA ni pago PENDIENTE (409),
   * y actualiza el estado a PENDIENTE o ACTIVA según el resultado de Mercado Pago.
   */
  async activateFromOnboarding(
    correoPagador: string,
    orderId = 'MOCK_STORE_OK',
    nit?: string,
  ): Promise<StorePayResult> {
    if (!isValidPayerEmail(correoPagador)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago')
    }
    if (nit !== undefined && !isValidNit(nit)) {
      throw new ApiError(400, 'Ingresa un NIT válido de 9 dígitos')
    }
    const sessionUser = mockSessionUser()
    const resolvedAlmacenId = sessionUser?.id ?? 'almacen-1'
    const dto: StoreSubscriptionActivationDto = {
      correoPagador: correoPagador.trim(),
      nit: (nit ?? '').trim(),
      almacenId: resolvedAlmacenId,
    }
    const before = readMockStoreSubscription()
    if (
      before.subscription.status === 'ACTIVA' ||
      before.payments.some((p) => p.status === 'pendiente')
    ) {
      throw new ApiError(409, 'Tu almacén ya tiene una suscripción activa o un pago pendiente')
    }
    if (!env.useMocks) {
      const r = await apiClient
        .post<CheckoutResponseDto>(`${BASE}/checkout`, dto)
        .then((res) => res.data)
      return { redirectTo: r.initPoint }
    }
    try {
      failIfScenario()
    } catch {
      throw new ApiError(503, 'No fue posible iniciar el pago en este momento. Inténtalo nuevamente')
    }
    await mockDelay(MOCK_CHECKOUT_RESPONSE, 300)
    const result = await planService.getCheckoutResult(orderId)

    const state = readMockStoreSubscription()
    const u = sessionUser
    const resolvedEmail = dto.correoPagador
    const pagoId = `SR-${2000 + state.payments.length}`
    const suscripcionId = state.subscription.suscripcionId ?? `SUB-ALM-${dto.almacenId}`
    const today = new Date().toISOString().slice(0, 10)
    const payment: PaymentDto = {
      id: pagoId,
      pagoId,
      suscripcionId,
      suscriptorId: dto.almacenId,
      userId: u?.id ?? 'anon',
      userName: u?.name ?? 'Tienda',
      userEmail: resolvedEmail,
      userRole: 'ADMIN_ALMACEN',
      planId: 'store',
      planName: result.planName,
      amount: result.amount,
      valor: result.amount,
      currency: 'COP',
      moneda: 'COP',
      mpReference: orderId,
      referencia: orderId,
      referenciaExterna: orderId,
      method: (result.method as PaymentDto['method'] | undefined) ?? 'Mercado Pago',
      date: today,
      fecha: today,
      status: result.status === 'aprobado' ? 'aprobado' : result.status === 'pendiente' ? 'pendiente' : 'rechazado',
      estado: result.status === 'aprobado' ? 'APROBADO' : result.status === 'pendiente' ? 'PENDIENTE' : 'RECHAZADO',
    }
    const nextStatus: StoreSubscriptionStatus =
      result.status === 'aprobado' ? 'ACTIVA' : 'PENDIENTE'
    const endPeriod = addOneMonth()
    const next: StoreSubscriptionStateDto = {
      subscription: {
        ...state.subscription,
        suscripcionId,
        status: nextStatus,
        estado: nextStatus,
        planName: STORE_PLAN.name,
        amount: STORE_SUBSCRIPTION_PRICE,
        payerEmail: resolvedEmail,
        nit: dto.nit || state.subscription.nit,
        almacenId: dto.almacenId,
        ...(result.status === 'aprobado'
          ? {
              fechaInicio: today,
              periodEndsAt: endPeriod,
              fechaFin: endPeriod,
              renewalEnabled: true,
              autoRenovacion: true,
            }
          : {
              fechaInicio: null,
              fechaFin: null,
              renewalEnabled: false,
              autoRenovacion: false,
            }),
      },
      payments: [payment, ...state.payments],
    }
    writeState(next)
    return {
      result: { ...result, payerEmail: resolvedEmail },
      output: {
        suscripcionId,
        ordenId: orderId,
        estado: result.status === 'aprobado' ? 'ACTIVA' : 'PENDIENTE',
        initPoint: MOCK_CHECKOUT_RESPONSE.initPoint,
      },
    }
  },

  /**
   * RF-68: Reactiva la renovación automática.
   */
  async reactivateRenewal(): Promise<StoreSubscriptionDto> {
    if (!env.useMocks) return apiClient.post<StoreSubscriptionDto>(`${BASE}/reactivate-renewal`).then((r) => r.data)
    failIfScenario('conflicto')
    const state = readMockStoreSubscription()
    const subscription: StoreSubscriptionDto = {
      ...state.subscription,
      renewalEnabled: true,
      autoRenovacion: true,
    }
    writeState({ ...state, subscription })
    return mockDelay(subscription, 250)
  },

  /**
   * RF-96: Reintenta un pago RECHAZADO de la tienda indicando el correo del pagador.
   * Crea una nueva transacción por el mismo valor (nace PENDIENTE) y conserva el pago rechazado original en el historial.
   */
  async retryPayment(paymentId: string, payerEmail: string, orderId = 'MOCK_STORE_OK'): Promise<StorePayResult> {
    if (!isValidPayerEmail(payerEmail)) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido para realizar el pago')
    }
    const before = readMockStoreSubscription()
    const original = before.payments.find((p) => p.id === paymentId && p.status === 'rechazado') ??
      before.payments.find((p) => p.status === 'rechazado')
    if (!original) {
      throw new ApiError(400, 'Solo se pueden reintentar pagos rechazados')
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
      throw new ApiError(503, 'No fue posible generar un nuevo intento de pago')
    }
    await mockDelay(MOCK_CHECKOUT_RESPONSE, 300)
    const result = await planService.getCheckoutResult(orderId)

    const state = readMockStoreSubscription()
    const u = mockSessionUser()
    const resolvedEmail = payerEmail.trim()
    const newRef = `SR-R${2000 + state.payments.length}`
    const today = new Date().toISOString().slice(0, 10)
    const payment: PaymentDto = {
      id: newRef,
      pagoId: newRef,
      suscripcionId: state.subscription.suscripcionId ?? 'SUB-ALM-1',
      suscriptorId: u?.id ?? original.userId,
      userId: u?.id ?? original.userId,
      userName: u?.name ?? original.userName,
      userEmail: resolvedEmail,
      userRole: 'ADMIN_ALMACEN',
      planId: 'store',
      planName: original.planName,
      amount: original.amount,
      valor: original.amount,
      currency: 'COP',
      moneda: 'COP',
      mpReference: newRef,
      referencia: newRef,
      referenciaExterna: newRef,
      method: (result.method as PaymentDto['method'] | undefined) ?? 'Mercado Pago',
      date: today,
      fecha: today,
      status: result.status === 'aprobado' ? 'aprobado' : result.status === 'pendiente' ? 'pendiente' : 'rechazado',
      estado: result.status === 'aprobado' ? 'APROBADO' : result.status === 'pendiente' ? 'PENDIENTE' : 'RECHAZADO',
    }
    const next: StoreSubscriptionStateDto = {
      subscription: {
        ...state.subscription,
        payerEmail: resolvedEmail,
      },
      payments: [payment, ...state.payments],
    }
    if (result.status === 'aprobado') {
      const endPeriod = addOneMonth()
      next.subscription = {
        ...state.subscription,
        status: 'ACTIVA',
        estado: 'ACTIVA',
        planName: original.planName,
        amount: original.amount,
        payerEmail: resolvedEmail,
        fechaInicio: today,
        periodEndsAt: endPeriod,
        fechaFin: endPeriod,
        renewalEnabled: true,
        autoRenovacion: true,
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
   * RF-68: cancela la renovación (y el cobro automático en la pasarela). La suscripción sigue ACTIVA hasta el fin del
   * periodo pagado (fechaFin), con autoRenovacion = false, sin devolución por el tiempo restante.
   */
  async cancelRenewal(): Promise<StoreSubscriptionDto> {
    if (!env.useMocks) return apiClient.post<StoreSubscriptionDto>(`${BASE}/cancel-renewal`).then((r) => r.data)
    try {
      failIfScenario('conflicto')
    } catch {
      throw new ApiError(503, 'No fue posible desactivar la renovación. Inténtalo nuevamente')
    }
    const state = readMockStoreSubscription()
    if (state.subscription.status !== 'ACTIVA') throw new ApiError(409, 'No hay una suscripción activa para cancelar')
    if (!state.subscription.renewalEnabled) return mockDelay(state.subscription, 200)
    const subscription: StoreSubscriptionDto = {
      ...state.subscription,
      renewalEnabled: false,
      autoRenovacion: false,
    }
    writeState({ ...state, subscription })
    return mockDelay(subscription, 400)
  },
}
