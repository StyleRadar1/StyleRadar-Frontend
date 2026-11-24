import type { Role } from '@/modules/core/types/roles'

/** Estado de un pago según ms-pagos-suscripciones v4 (SOLO PENDIENTE, APROBADO, RECHAZADO). */
export type PaymentStatus = 'aprobado' | 'rechazado' | 'pendiente'
export type PaymentStatusV4 = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

/** Estados de suscripción v4 (B.1). */
export type SubscriptionStatus = 'PENDIENTE' | 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'SUSPENDIDA'

/** Identificador interno del método de pago único (E.3). */
export type PaymentMethodCode = 'MERCADO_PAGO'

/** Método de pago visible en el front (único medio: Mercado Pago, E.3). */
export type PaymentMethod = 'MERCADO_PAGO' | 'Mercado Pago'

/** RF-93: registroPago */
export interface RegistroPagoDto {
  valor: number
  estado: PaymentStatusV4
  referenciaExterna: string
  fecha: string
}

/** RF-94: notificacionPago y vigencia */
export interface NotificacionPagoDto {
  tipo: string
  referencia: string
  firma: string
}

export interface VigenciaSuscripcionDto {
  fechaInicio: string | null
  fechaFin: string | null
}

/** RF-95: suscripcionPago y pagoRenovacion */
export interface SuscripcionPagoDto {
  suscripcionId: string
  tipo: 'ALMACEN' | 'USUARIO'
  fechaFin: string
}

export interface PagoRenovacionDto {
  monto: number
  fecha: string
  referencia: string
  estado: PaymentStatusV4
}

/** RF-96: nuevoPago */
export interface NuevoPagoDto {
  pagoId: string
  valor: number
  estado: PaymentStatusV4
}

/** RF-97: elemento de historialPagos */
export interface HistorialPagoItemDto {
  fecha: string
  valor: number
  moneda: 'COP'
  estado: PaymentStatusV4
  referencia: string
  suscripcionId: string
}

/** DTO de un pago individual devuelto por el gateway (RF-75, RF-97). */
export interface PaymentDto {
  id: string
  pagoId?: string
  suscripcionId?: string
  suscriptorId?: string
  userId: string
  userName?: string
  userEmail?: string
  userRole: Role
  planId: 'free' | 'plus' | 'store'
  /** Identificador numérico del plan devuelto por ms-pagos (`PaymentResponse.planId`). */
  backendPlanId?: number
  planName: string
  amount: number
  valor?: number
  currency?: string
  moneda?: 'COP'
  mpReference?: string
  referencia?: string
  referenciaExterna?: string
  method: PaymentMethod
  date: string
  fecha?: string
  status: PaymentStatus
  estado?: PaymentStatusV4
  /** Estado crudo cuando el backend envía un valor fuera del contrato v4. */
  unknownStatus?: string
}

/** Filtros que acepta la búsqueda de pagos (RF-75). */
export interface PaymentFiltersDto {
  status?: PaymentStatus | ''
  planId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
