import type { Conservacion } from './secondhand.dto'

/**
 * DTOs oficiales de ms-segunda-vida-donaciones: /api/v1/donaciones
 */

export interface PuntoAcopioDto {
  id: string
  nombre: string
  direccion: string
}

/** GET /api/donations/foundations: fundaciones activas */
export interface FoundationDto {
  id: string
  nombre: string
  barrio: string
  distanciaKm: number
  categorias: string[]
  activa: boolean
  puntos: PuntoAcopioDto[]
}

export type Modalidad = 'RECOGIDA' | 'ENTREGA_EN_PUNTO'
export const FRANJAS = ['8:00 a 12:00', '12:00 a 15:00', '15:00 a 18:00'] as const

export interface LogisticaDto {
  modalidad: Modalidad
  fecha: string
  franja: string
  puntoId?: string
  direccion?: string
}

export interface PrendaDonadaDto {
  titulo: string
  categoria: string
  talla: string
  conservacion: Conservacion
  cantidad: number
  descripcion: string
}

/** Payload directo oficial: POST /api/v1/donaciones */
export interface DirectDonationRequestDto {
  publicationId: string | number
  donorId: string | number
  foundationId: string | number
  message?: string
}

/** Payload oficial: POST /api/v1/donaciones/claim */
export interface ClaimDonationRequestDto {
  publicationId: string | number
  foundationId: string | number
  message?: string
}

/** Payload oficial: PATCH /api/v1/donaciones/{id}/decide */
export interface DecideDonationRequestDto {
  foundationId: string | number
  approve: boolean
  reason?: string | null
}

/** Payload oficial: PATCH /api/v1/donaciones/{id}/pickup */
export interface PickupDonationRequestDto {
  userId: string | number
  deliveryPoint: string
  startTime: string
  endTime: string
}

/** Payload oficial: PATCH /api/v1/donaciones/{id}/confirm */
export interface ConfirmDonationRequestDto {
  foundationId: string | number
}

/** Creación tradicional / formulario frontend */
export interface DonationRequestDto {
  fundacionId: string
  prenda: PrendaDonadaDto
  logistica: LogisticaDto
  publicationId?: string | number
  donorId?: string | number
  message?: string
}

export type EstadoDonacion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_RECOGIDA' | 'ENTREGADA' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PICKUP' | 'DELIVERED'

export const ESTADO_DONACION_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PENDING: 'Pendiente',
  APROBADA: 'Aprobada',
  APPROVED: 'Aprobada',
  RECHAZADA: 'Rechazada',
  REJECTED: 'Rechazada',
  EN_RECOGIDA: 'En recogida',
  IN_PICKUP: 'En recogida',
  ENTREGADA: 'Entregada',
  DELIVERED: 'Entregada',
}

export const SIGUIENTE: Record<string, EstadoDonacion[]> = {
  PENDIENTE: ['APROBADA', 'RECHAZADA'],
  PENDING: ['APROBADA', 'RECHAZADA'],
  APROBADA: ['EN_RECOGIDA'],
  APPROVED: ['EN_RECOGIDA'],
  EN_RECOGIDA: ['ENTREGADA'],
  IN_PICKUP: ['ENTREGADA'],
  RECHAZADA: [],
  REJECTED: [],
  ENTREGADA: [],
  DELIVERED: [],
}

export interface DonationDto {
  id: string
  publicationId?: string | number
  donorId?: string | number
  foundationId?: string | number
  message?: string
  fundacion: { id: string; nombre: string }
  donante: { id: string; nombre: string }
  prenda: PrendaDonadaDto
  fotos: string[]
  logistica: LogisticaDto & { puntoNombre?: string }
  estado: EstadoDonacion
  status?: string
  justificacion?: string
  rejectionReason?: string | null
  deliveryPoint?: string
  slotStart?: string
  slotEnd?: string
  receptionDate?: string
  comprobante?: { codigo: string; emitidoEn: string }
  creadaEn: string
}

export interface DonationStatusRequestDto {
  estado: Exclude<EstadoDonacion, 'PENDIENTE' | 'PENDING'>
  justificacion?: string
}

/** Formateador oficial del comprobante simbólico sugerido por Backend */
export function formatReceiptCode(id: string | number): string {
  return `SR-DON-${String(id).replace(/\D/g, '').padStart(4, '0')}`
}
