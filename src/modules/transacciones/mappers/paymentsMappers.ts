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

const SUBSCRIPTION_STATUS_MAP: Record<string, SubscriptionStatus> = {
  PENDING: 'PENDIENTE',
  PENDIENTE: 'PENDIENTE',
  ACTIVE: 'ACTIVA',
  ACTIVA: 'ACTIVA',
  SUSPENDED: 'SUSPENDIDA',
  SUSPENDIDA: 'SUSPENDIDA',
  EXPIRED: 'VENCIDA',
  VENCIDA: 'VENCIDA',
  CANCELLED: 'CANCELADA',
  CANCELED: 'CANCELADA',
  CANCELADA: 'CANCELADA',
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

/** Traduce el estado de suscripción del OpenAPI al modelo interno v4 sin romper ante estados desconocidos. */
export function mapSubscriptionStatus(raw: unknown): MappedSubscriptionStatus {
  const normalized = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
  const mapped = SUBSCRIPTION_STATUS_MAP[normalized]
  if (mapped) return { status: mapped }
  return {
    status: 'PENDIENTE',
    unknownStatus: normalized || 'DESCONOCIDO',
  }
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
  const mappedStatus = mapSubscriptionStatus(raw.status)
  return {
    initPoint: raw.initPoint ?? '',
    preferenceId: String(raw.orderId ?? raw.subscriptionId ?? ''),
    suscripcionId: raw.subscriptionId != null ? String(raw.subscriptionId) : undefined,
    ordenId: raw.orderId != null ? String(raw.orderId) : undefined,
    estado: mappedStatus.status,
  }
}

/** Traduce `SubscriptionResponse` al modelo de comprador (`MiPlanDto`). */
export function mapSubscriptionToMiPlanDto(raw: ApiSubscriptionResponse): MiPlanDto {
  const mappedStatus = mapSubscriptionStatus(raw.status)
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
    degradedByPayment: mappedStatus.status === 'SUSPENDIDA',
    pendingRenewal: mappedStatus.status === 'PENDIENTE',
    unknownStatus: mappedStatus.unknownStatus,
  }
}

/** Traduce `SubscriptionResponse` al modelo de almacén (`StoreSubscriptionDto`). */
export function mapSubscriptionToStoreDto(raw: ApiSubscriptionResponse): StoreSubscriptionDto {
  const mappedStatus = mapSubscriptionStatus(raw.status)
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
): StoreSubscriptionDto {
  const mappedStatus = mapSubscriptionStatus(raw.status ?? previous?.status ?? 'ACTIVA')
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

/** Traduce `PaymentResponse` del OpenAPI a `PaymentDto`. */
export function mapPaymentResponse(
  raw: ApiPaymentResponse,
  context?: { subscriberId?: string; userRole?: Role; planId?: 'free' | 'plus' | 'store'; planName?: string },
): PaymentDto {
  const mappedStatus = mapPaymentStatus(raw.status)
  const amount = typeof raw.amount?.value === 'number' && Number.isFinite(raw.amount.value) ? raw.amount.value : 0
  const currency = raw.amount?.currency || 'COP'
  const id = raw.id != null ? String(raw.id) : ''
  const subscriptionId = raw.subscriptionId != null ? String(raw.subscriptionId) : undefined
  const isoDate = raw.createdAt ? raw.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)

  // TODO(contrato): PaymentResponse en ms-pagos.openapi.json no incluye subscriberId, userRole ni planName.
  // Se infiere planId/planName por monto/contexto mientras el backend agrega esos campos al DTO si se requieren.
  const inferredPlanId: 'free' | 'plus' | 'store' =
    context?.planId ?? (amount >= STORE_SUBSCRIPTION_PRICE ? 'store' : 'plus')
  const inferredPlanName =
    context?.planName ?? (inferredPlanId === 'store' ? STORE_PLAN.name : 'Radar+')
  const subscriberId = context?.subscriberId ?? subscriptionId ?? id

  return {
    id,
    pagoId: id,
    suscripcionId: subscriptionId,
    suscriptorId: subscriberId,
    userId: subscriberId,
    userRole: context?.userRole ?? (inferredPlanId === 'store' ? 'STORE_ADMIN' : 'BUYER'),
    planId: inferredPlanId,
    planName: inferredPlanName,
    amount,
    valor: amount,
    currency,
    moneda: 'COP',
    mpReference: raw.externalPaymentId ?? id,
    referencia: raw.externalPaymentId ?? id,
    referenciaExterna: raw.externalPaymentId ?? id,
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
