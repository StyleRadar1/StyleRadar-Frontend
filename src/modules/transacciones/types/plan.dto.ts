/** Plan de suscripción de StyleRadar. Tabla provisional del equipo. */
export interface PlanDto {
  id: 'free' | 'plus' | 'store'
  name: string
  price: number
  period: 'gratis' | 'mensual'
  features: string[]
  highlighted?: boolean
}

/** Intención guardada cuando el usuario elige un plan sin sesión. */
export interface PlanIntentDto {
  planId: string
  accountType: 'COMPRADOR' | 'ADMIN_ALMACEN'
  returnPath: string
  expiresAt: number
}

/** Respuesta simulada de crear una preferencia de pago. */
export interface CheckoutResponseDto {
  initPoint: string
  preferenceId: string
}

/** Estado del pago consultado al backend tras la redirección. */
export type CheckoutStatus = 'aprobado' | 'pendiente' | 'rechazado'

export interface CheckoutResultDto {
  orderId: string
  status: CheckoutStatus
  planName: string
  amount: number
  method?: string
}
