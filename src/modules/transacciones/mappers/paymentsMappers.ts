import { aRol, type Role } from '@/modules/core/types/roles'
import { RADAR_PLUS_PRICE, STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import { PLANS, STORE_PLAN } from '../mocks/plans'
import type { PaymentDto, PaymentStatus, PaymentStatusV4, SubscriptionStatus } from '../types/payment.dto'
import type { CheckoutResponseDto, CheckoutResultDto, MiPlanDto, PlanDto, PlanUsuario } from '../types/plan.dto'
import type { StoreSubscriptionDto } from '../types/storeSubscription.dto'

/* ─── Contratos crudos según docs/api/ms-pagos.openapi.json ─── */

export type ApiSubscriberType = 'USER' | 'STORE'
export type ApiSubscriptionStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | (string & {})
export type ApiPaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | (string & {})

export interface ApiAmountResponse {
  value?: number
  currency?: string
}

export interface ApiPlanResponse {
  id?: number
  name?: string
  subscriberType?: ApiSubscriberType | string
  price?: ApiAmountResponse
  limits?: Record<string, unknown>
  active?: boolean
}

export interface ApiStartSubscriptionRequest {
  subscriberType: ApiSubscriberType
  payerEmail: string
  planId?: number
  taxId?: string
  storeId?: string
}

export interface ApiStartSubscriptionResponse {
  subscriptionId?: number
  orderId?: number
  status?: ApiSubscriptionStatus
  initPoint?: string
  message?: string
}

export interface ApiSubscriptionResponse {
  id?: number
  subscriberId?: string
  subscriberType?: ApiSubscriberType | string
  plan?: ApiPlanResponse
  status?: ApiSubscriptionStatus
  startDate?: string | null
  endDate?: string | null
  autoRenewal?: boolean
  access?: boolean
  taxId?: string | null
  storeId?: string | null
  message?: string
}

export interface ApiCancelSubscriptionRequest {
  confirmed: boolean
}

export interface ApiCancellationResponse {
  subscriptionId?: number
  autoRenewal?: boolean
  status?: ApiSubscriptionStatus
  endDate?: string | null
  cancellationConfirmed?: boolean
  message?: string
}

export interface ApiPaymentResponse {
  id?: number
  subscriptionId?: number
  subscriberId?: string
  planId?: number
  planName?: string
  amount?: ApiAmountResponse
  status?: ApiPaymentStatus
  externalPaymentId?: string
  createdAt?: string
}

export interface ApiRetryPaymentRequest {
  payerEmail: string
}

export interface ApiRetryPaymentResponse {
  orderId?: number
  status?: ApiPaymentStatus
  initPoint?: string
  message?: string
}

export interface MappedSubscriptionStatus {
  status: SubscriptionStatus
  label: string
  unknownStatus?: string
}

export interface MappedPaymentStatus {
  status: PaymentStatus
  estado: PaymentStatusV4
  unknownStatus?: string
}

export interface PriceDiscrepancy {
  planId: 'free' | 'plus' | 'store'
  planName: string
  expectedV4: number
  backendValue: number
}

const PAYMENT_STATUS_MAP: Record<string, { status: PaymentStatus; estado: PaymentStatusV4 }> = {
  PENDING: { status: 'pendiente', estado: 'PENDIENTE' },
  PENDIENTE: { status: 'pendiente', estado: 'PENDIENTE' },
  APPROVED: { status: 'aprobado', estado: 'APROBADO' },
  APROBADO: { status: 'aprobado', estado: 'APROBADO' },
  REJECTED: { status: 'rechazado', estado: 'RECHAZADO' },
  RECHAZADO: { status: 'rechazado', estado: 'RECHAZADO' },
}

const API_PAYMENT_FILTER_MAP: Record<PaymentStatus, 'PENDING' | 'APPROVED' | 'REJECTED'> = {
  pendiente: 'PENDING',
  aprobado: 'APPROVED',
  rechazado: 'REJECTED',
}

/**
 * Deriva el estado interno y la etiqueta visual según el contrato confirmado de ms-pagos:
 * - PENDING → PENDIENTE
 * - ACTIVE + autoRenewal=true → ACTIVA («ACTIVA»)
 * - ACTIVE + autoRenewal=false → ACTIVA («Activa sin renovación»)
 * - SUSPENDED + endDate < hoy → VENCIDA («VENCIDA»)
 * - SUSPENDED en otro caso → SUSPENDIDA («SUSPENDIDA»)
 */
export function deriveSubscriptionStatus(
  rawStatus: unknown,
  options?: { autoRenewal?: boolean | null; endDate?: string | null; today?: string },
): MappedSubscriptionStatus {
  const normalized = typeof rawStatus === 'string' ? rawStatus.trim().toUpperCase() : ''
  const todayIso = options?.today ?? new Date().toISOString().slice(0, 10)
  const endDateIso = typeof options?.endDate === 'string' && options.endDate.trim() ? options.endDate.slice(0, 10) : null

  if (normalized === 'PENDING' || normalized === 'PENDIENTE') {
    return { status: 'PENDIENTE', label: 'PENDIENTE' }
  }
  if (normalized === 'ACTIVE' || normalized === 'ACTIVA') {
    const autoRenewal = options?.autoRenewal !== false
    return {
      status: 'ACTIVA',
      label: autoRenewal ? 'ACTIVA' : 'Activa sin renovación',
    }
  }
  if (normalized === 'SUSPENDED' || normalized === 'SUSPENDIDA') {
    if (endDateIso && endDateIso < todayIso) {
      return { status: 'VENCIDA', label: 'VENCIDA' }
    }
    return { status: 'SUSPENDIDA', label: 'SUSPENDIDA' }
  }
  if (normalized === 'VENCIDA') {
    return { status: 'VENCIDA', label: 'VENCIDA' }
  }
  if (normalized === 'CANCELADA') {
    return { status: 'CANCELADA', label: 'CANCELADA' }
  }

  const unknown = normalized || 'DESCONOCIDO'
  return {
    status: 'PENDIENTE',
    label: `No reconocido (${unknown})`,
    unknownStatus: unknown,
  }
}

/** Alias de compatibilidad para traducción directa de estado de suscripción. */
export function mapSubscriptionStatus(
  raw: unknown,
  options?: { autoRenewal?: boolean | null; endDate?: string | null; today?: string },
): MappedSubscriptionStatus {
  return deriveSubscriptionStatus(raw, options)
}

/** Traduce el estado de pago del OpenAPI al modelo interno v4 sin romper ante estados desconocidos. */
export function mapPaymentStatus(raw: unknown): MappedPaymentStatus {
  const normalized = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
  const mapped = PAYMENT_STATUS_MAP[normalized]
  if (mapped) return mapped
  return {
    status: 'pendiente',
    estado: 'PENDIENTE',
    unknownStatus: normalized || 'DESCONOCIDO',
  }
}

/** Traduce el filtro interno de estado de pago al query param `?status=` del OpenAPI. */
export function toApiPaymentStatusFilter(status?: PaymentStatus | ''): 'PENDING' | 'APPROVED' | 'REJECTED' | undefined {
  if (!status) return undefined
  return API_PAYMENT_FILTER_MAP[status]
}

/** Reutiliza el mapper oficial de roles de core (`aRol`). */
export function mapBackendRole(raw: unknown): Role {
  return aRol(raw) ?? 'BUYER'
}

/** Traduce el rol interno al `subscriberType` esperado por ms-pagos. */
export function toSubscriberType(role: Role | null | undefined): ApiSubscriberType {
  return role === 'STORE_ADMIN' ? 'STORE' : 'USER'
}

/** Etiqueta visible para un estado de suscripción o pago, contemplando valores no reconocidos. */
export function formatStatusLabel(knownLabel: string, unknownStatus?: string): string {
  return unknownStatus ? `No reconocido (${unknownStatus})` : knownLabel
}

/** Compara precios del backend contra las constantes v4 y devuelve las diferencias detectadas. */
export function detectPlanPriceDiscrepancies(plans: PlanDto[]): PriceDiscrepancy[] {
  const diffs: PriceDiscrepancy[] = []
  for (const plan of plans) {
    if (plan.id === 'plus' && plan.price !== RADAR_PLUS_PRICE) {
      diffs.push({ planId: 'plus', planName: plan.name, expectedV4: RADAR_PLUS_PRICE, backendValue: plan.price })
    }
    if (plan.id === 'store' && plan.price !== STORE_SUBSCRIPTION_PRICE) {
      diffs.push({ planId: 'store', planName: plan.name, expectedV4: STORE_SUBSCRIPTION_PRICE, backendValue: plan.price })
    }
  }
  return diffs
}

/** Traduce un `PlanResponse` del OpenAPI a `PlanDto`, manteniendo el precio real del backend. */
export function mapPlanResponse(raw: ApiPlanResponse): PlanDto {
  const subType = String(raw.subscriberType ?? '').toUpperCase()
  const priceValue = typeof raw.price?.value === 'number' && Number.isFinite(raw.price.value) ? raw.price.value : 0
  const rawName = (raw.name ?? '').trim()

  const isStore = subType === 'STORE' || /store|tienda|almac[eé]n/i.test(rawName)
  const isPlus = !isStore && (priceValue > 0 || /plus|\+/i.test(rawName))
  const id: PlanDto['id'] = isStore ? 'store' : isPlus ? 'plus' : 'free'

  const basePlan = id === 'store'
    ? STORE_PLAN
    : (PLANS.find((p) => p.id === id) ?? PLANS[0])

  return {
    id,
    backendPlanId: typeof raw.id === 'number' ? raw.id : undefined,
    name: rawName || basePlan.name,
    price: priceValue,
    period: priceValue === 0 ? 'gratis' : 'mensual',
    features: basePlan.features,
    highlighted: id === 'plus',
  }
}

/** Traduce una lista de `PlanResponse` (solo planes activos) y advierte en desarrollo si difieren de los precios v4. */
export function mapPlansResponse(rawList: ApiPlanResponse[]): PlanDto[] {
  const activePlans = rawList.filter((p) => p.active !== false).map(mapPlanResponse)
  const diffs = detectPlanPriceDiscrepancies(activePlans)
  if (diffs.length > 0 && import.meta.env.DEV) {
    console.warn('[pagos] Diferencia de precio entre GET /api/v1/plans y constantes v4:', diffs)
  }
  return activePlans
}

/** Traduce `StartSubscriptionResponse` (202 Accepted) a `CheckoutResponseDto`. */
export function mapStartSubscriptionResponse(raw: ApiStartSubscriptionResponse): CheckoutResponseDto {
  const mappedStatus = deriveSubscriptionStatus(raw.status)
  return {
    initPoint: raw.initPoint ?? '',
    preferenceId: String(raw.orderId ?? raw.subscriptionId ?? ''),
    suscripcionId: raw.subscriptionId != null ? String(raw.subscriptionId) : undefined,
    ordenId: raw.orderId != null ? String(raw.orderId) : undefined,
    estado: mappedStatus.status,
  }
}

/** Traduce `SubscriptionResponse` al modelo de comprador (`MiPlanDto`). */
export function mapSubscriptionToMiPlanDto(raw: ApiSubscriptionResponse, today?: string): MiPlanDto {
  const mappedStatus = deriveSubscriptionStatus(raw.status, {
    autoRenewal: raw.autoRenewal,
    endDate: raw.endDate,
    today,
  })
  const planPrice = raw.plan?.price?.value ?? 0
  const planName = raw.plan?.name ?? ''
  const isPaidPlan = planPrice > 0 || /plus|\+/i.test(planName)
  const isRadarPlus: PlanUsuario = (mappedStatus.status === 'ACTIVA' || raw.access === true) && isPaidPlan
    ? 'RADAR_PLUS'
    : 'RADAR'

  return {
    plan: isRadarPlus,
    suscripcionId: raw.id != null ? String(raw.id) : undefined,
    estado: mappedStatus.status,
    fechaInicio: raw.startDate ?? null,
    fechaFin: raw.endDate ?? null,
    periodEndsAt: raw.endDate ?? undefined,
    proximoCobro: raw.autoRenewal && raw.endDate ? raw.endDate : undefined,
    renewalEnabled: Boolean(raw.autoRenewal),
    degradedByPayment: mappedStatus.status === 'SUSPENDIDA' || mappedStatus.status === 'VENCIDA',
    pendingRenewal: mappedStatus.status === 'PENDIENTE',
    unknownStatus: mappedStatus.unknownStatus,
  }
}

/** Traduce `SubscriptionResponse` al modelo de almacén (`StoreSubscriptionDto`). */
export function mapSubscriptionToStoreDto(raw: ApiSubscriptionResponse, today?: string): StoreSubscriptionDto {
  const mappedStatus = deriveSubscriptionStatus(raw.status, {
    autoRenewal: raw.autoRenewal,
    endDate: raw.endDate,
    today,
  })
  const amount = typeof raw.plan?.price?.value === 'number' && Number.isFinite(raw.plan.price.value)
    ? raw.plan.price.value
    : STORE_SUBSCRIPTION_PRICE

  return {
    id: raw.id != null ? String(raw.id) : undefined,
    suscripcionId: raw.id != null ? String(raw.id) : undefined,
    status: mappedStatus.status,
    estado: mappedStatus.status,
    planName: raw.plan?.name?.trim() || STORE_PLAN.name,
    amount,
    fechaInicio: raw.startDate ?? null,
    fechaFin: raw.endDate ?? null,
    periodEndsAt: raw.endDate ?? undefined,
    renewalEnabled: Boolean(raw.autoRenewal),
    autoRenovacion: Boolean(raw.autoRenewal),
    nit: raw.taxId ?? undefined,
    almacenId: raw.storeId ?? undefined,
    unknownStatus: mappedStatus.unknownStatus,
  }
}

/** Traduce `CancellationResponse` sobre el estado previo de una suscripción de tienda. */
export function mapCancellationToStoreDto(
  raw: ApiCancellationResponse,
  previous?: StoreSubscriptionDto,
  today?: string,
): StoreSubscriptionDto {
  const mappedStatus = deriveSubscriptionStatus(raw.status ?? previous?.status ?? 'ACTIVE', {
    autoRenewal: raw.autoRenewal ?? false,
    endDate: raw.endDate ?? previous?.fechaFin,
    today,
  })
  return {
    ...(previous ?? {
      planName: STORE_PLAN.name,
      amount: STORE_SUBSCRIPTION_PRICE,
      renewalEnabled: false,
    }),
    id: raw.subscriptionId != null ? String(raw.subscriptionId) : previous?.id,
    suscripcionId: raw.subscriptionId != null ? String(raw.subscriptionId) : previous?.suscripcionId,
    status: mappedStatus.status,
    estado: mappedStatus.status,
    fechaFin: raw.endDate ?? previous?.fechaFin ?? null,
    periodEndsAt: raw.endDate ?? previous?.periodEndsAt,
    renewalEnabled: raw.autoRenewal ?? false,
    autoRenovacion: raw.autoRenewal ?? false,
    unknownStatus: mappedStatus.unknownStatus,
  }
}

/**
 * Traduce `PaymentResponse` del OpenAPI a `PaymentDto` usando únicamente los campos reales del contrato:
 * `id`, `subscriptionId`, `subscriberId`, `planId`, `planName`, `amount { value, currency }`, `status`,
 * `externalPaymentId` y `createdAt` (sin inferir plan por monto ni contexto).
 */
export function mapPaymentResponse(raw: ApiPaymentResponse): PaymentDto {
  const mappedStatus = mapPaymentStatus(raw.status)
  const amount = typeof raw.amount?.value === 'number' && Number.isFinite(raw.amount.value) ? raw.amount.value : 0
  const currency = raw.amount?.currency?.trim() || 'COP'
  const id = raw.id != null ? String(raw.id) : ''
  const subscriptionId = raw.subscriptionId != null ? String(raw.subscriptionId) : undefined
  const subscriberId = raw.subscriberId?.trim() || '—'
  const planName = raw.planName?.trim() || '—'
  const isoDate = raw.createdAt ? raw.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)

  const planId: PaymentDto['planId'] =
    /store|tienda|almac[eé]n/i.test(planName)
      ? 'store'
      : /plus|\+/i.test(planName)
        ? 'plus'
        : 'free'

  return {
    id,
    pagoId: id,
    suscripcionId: subscriptionId,
    suscriptorId: subscriberId,
    userId: subscriberId,
    // TODO(contrato): PaymentResponse no incluye userRole; se asigna rol base BUYER/STORE_ADMIN según planName solo para tipado interno.
    userRole: planId === 'store' ? 'STORE_ADMIN' : 'BUYER',
    planId,
    backendPlanId: typeof raw.planId === 'number' ? raw.planId : undefined,
    planName,
    amount,
    valor: amount,
    currency,
    moneda: 'COP',
    mpReference: raw.externalPaymentId?.trim() || id,
    referencia: raw.externalPaymentId?.trim() || id,
    referenciaExterna: raw.externalPaymentId?.trim() || id,
    method: 'Mercado Pago',
    date: isoDate,
    fecha: isoDate,
    status: mappedStatus.status,
    estado: mappedStatus.estado,
    unknownStatus: mappedStatus.unknownStatus,
  }
}

/** Traduce `RetryPaymentResponse` al modelo de resultado de checkout. */
export function mapRetryPaymentResponse(
  raw: ApiRetryPaymentResponse,
  originalOrder: CheckoutResultDto,
  payerEmail: string,
): CheckoutResultDto & { initPoint?: string } {
  const mappedStatus = mapPaymentStatus(raw.status)
  return {
    orderId: raw.orderId != null ? String(raw.orderId) : originalOrder.orderId,
    status: mappedStatus.status,
    planName: originalOrder.planName,
    amount: originalOrder.amount,
    method: 'Mercado Pago',
    payerEmail: payerEmail.trim(),
    planId: originalOrder.planId,
    estadoSuscripcion: mappedStatus.status === 'aprobado' ? 'ACTIVA' : 'PENDIENTE',
    fechaInicio: null,
    fechaFin: null,
    initPoint: raw.initPoint,
  }
}

/** Genera el texto CSV del listado de pagos (sin dependencias externas). */
export function buildPaymentsCsv(payments: PaymentDto[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = ['pagoId', 'suscripcionId', 'suscriptorId', 'plan', 'valor', 'moneda', 'estado', 'fecha', 'referencia']
  const rows = payments.map((p) => [
    p.pagoId ?? p.id,
    p.suscripcionId ?? '',
    p.suscriptorId ?? p.userId,
    p.planName || '—',
    p.valor ?? p.amount,
    p.currency ?? p.moneda ?? 'COP',
    formatStatusLabel(p.estado ?? p.status.toUpperCase(), p.unknownStatus),
    p.fecha ?? p.date,
    p.referencia ?? p.mpReference ?? p.id,
  ])
  return [header, ...rows].map((row) => row.map(esc).join(';')).join('\n')
}
