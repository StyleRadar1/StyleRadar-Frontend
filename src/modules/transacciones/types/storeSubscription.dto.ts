import type { PaymentDto } from './payment.dto'
import type { CheckoutResultDto } from './plan.dto'

/**
 * Suscripción de una tienda aliada (RF-67, RF-68). Los 30 primeros días son gratis; después se paga
 * el plan Tienda aliada para mantener el catálogo activo. Forma provisional hasta tener el Swagger de ms-pagos.
 */
export type StoreSubscriptionStatus = 'SIN_SUSCRIPCION' | 'PENDIENTE' | 'PRUEBA' | 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA'

export interface StoreSubscriptionDto {
  id?: string
  suscripcionId?: string
  status: StoreSubscriptionStatus
  planName: string
  amount: number
  /** Correo del pagador asociado a la suscripción (RF-67, RF-93). */
  payerEmail?: string
  /** Fin de los 30 días gratis (solo en PRUEBA). */
  trialEndsAt?: string
  /** Fin del periodo pagado (solo en ACTIVA). */
  periodEndsAt?: string
  fechaFin?: string
  /** En false la renovación fue cancelada: la suscripción sigue activa hasta `periodEndsAt`. */
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
}
