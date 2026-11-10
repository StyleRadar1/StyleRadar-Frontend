import type { Role } from '@/modules/core/types/roles'

/** Estado de un pago según ms-pagos-suscripciones. */
export type PaymentStatus = 'aprobado' | 'rechazado' | 'pendiente' | 'reembolsado'

/** Método de pago visible en el front. */
export type PaymentMethod = 'Mercado Pago' | 'PSE' | 'Efecty' | 'Nequi'

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
  method: PaymentMethod
  date: string
  status: PaymentStatus
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

/** Payload para solicitar un reembolso. */
export interface RefundRequestDto {
  paymentId: string
  reason: string
}
