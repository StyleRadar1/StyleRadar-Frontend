import type { Role } from '@/modules/core/types/roles'

/** Estado de un pago según ms-pagos-suscripciones. */
export type PaymentStatus = 'aprobado' | 'rechazado' | 'pendiente' | 'reembolsado'

/** Identificador interno del método de pago único (E.3). */
export type PaymentMethodCode = 'MERCADO_PAGO'

/** Método de pago visible en el front (único medio: Mercado Pago, E.3). */
export type PaymentMethod = 'MERCADO_PAGO' | 'Mercado Pago'

/** DTO de un pago individual devuelto por el gateway. */
export interface PaymentDto {
  id: string
  userId: string
  userName: string
  userEmail: string
  userRole: Role
  planId: 'free' | 'plus' | 'store'
  planName: string
  amount: number
  currency?: string
  mpReference?: string
  method: PaymentMethod
  date: string
  status: PaymentStatus
  refundedAmount?: number
  refundReason?: string
  refundDate?: string
}

/** Filtros que acepta la búsqueda de pagos. */
export interface PaymentFiltersDto {
  status?: PaymentStatus | ''
  planId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
