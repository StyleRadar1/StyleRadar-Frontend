import type { PaymentDto, SubscriptionStatus } from './payment.dto'
import type { CheckoutResultDto } from './plan.dto'

/**
 * Suscripción de una tienda aliada (RF-67, RF-68, B.1).
 * Estados oficiales v4: PENDIENTE, ACTIVA, VENCIDA, CANCELADA y SUSPENDIDA.
 */
export type StoreSubscriptionStatus = SubscriptionStatus

/** RF-67: DTO de entrada al activar la suscripción del almacén (almacenId sale de la sesión). */
export interface StoreSubscriptionActivationDto {
  correoPagador: string
  nit: string
  almacenId: string
}

/** RF-67: salida al iniciar suscripción de almacén */
export interface StoreSubscriptionInitOutputDto {
  suscripcionId: string
  ordenId: string
  estado: SubscriptionStatus
  initPoint: string
}

/** RF-99: suscripcionAlmacen */
export interface SuscripcionAlmacenDto {
  suscripcionId: string
  almacenId: string
  estado: SubscriptionStatus
}

export interface StoreSubscriptionDto {
  id?: string
  suscripcionId?: string
  status: StoreSubscriptionStatus
  estado?: SubscriptionStatus
  planName: string
  amount: number
  /** Correo del pagador asociado a la suscripción (RF-67, RF-93). */
  payerEmail?: string
  /** Inicio y fin del periodo pagado (RF-94). */
  fechaInicio?: string | null
  periodEndsAt?: string
  fechaFin?: string | null
  /** En false la renovación fue cancelada: la suscripción sigue activa hasta `fechaFin`. */
  renewalEnabled: boolean
  autoRenovacion?: boolean
  nit?: string
  almacenId?: string
}

/** Suscripción más el historial de pagos propios de la tienda (RF-97). */
export interface StoreSubscriptionStateDto {
  subscription: StoreSubscriptionDto
  payments: PaymentDto[]
}

/** Resultado de pagar: en producción se redirige a Mercado Pago; en mocks ya viene el resultado. */
export interface StorePayResult {
  redirectTo?: string
  result?: CheckoutResultDto
  output?: StoreSubscriptionInitOutputDto
}
