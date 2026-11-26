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

/** Propuesta de entrega para creación directa de donación (SR-RF-45) */
export interface DeliveryProposalDto {
  mode: Modalidad | string
  point?: string
  startTime?: string
  endTime?: string
  address?: string
}

/** Payload directo oficial: POST /api/v1/donaciones / /api/v1/donations (SR-RF-45) */
export interface DirectDonationRequestDto {
  publicationId: string | number
  donorId: string | number
  foundationId: string | number
  message?: string
  deliveryProposal?: DeliveryProposalDto
  deliveryMode?: Modalidad | string
  deliveryPoint?: string
  pickupWindowStart?: string
  pickupWindowEnd?: string
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

export type EstadoDonacionCanonico = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_RECOGIDA' | 'ENTREGADA'

export type EstadoDonacion =
  | EstadoDonacionCanonico
  | 'PENDING'
  | 'SOLICITADA'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PICKUP'
  | 'SCHEDULED'
  | 'DELIVERED'
  | 'CONFIRMED'

const ESTADO_DONACION_MAP: Record<string, EstadoDonacionCanonico> = {
  PENDIENTE: 'PENDIENTE',
  PENDING: 'PENDIENTE',
  SOLICITADA: 'PENDIENTE',
  SOLICITADO: 'PENDIENTE',
  REQUESTED: 'PENDIENTE',
  CREADA: 'PENDIENTE',
  CREATED: 'PENDIENTE',
  APROBADA: 'APROBADA',
  APPROVED: 'APROBADA',
  ACEPTADA: 'APROBADA',
  ACCEPTED: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  REJECTED: 'RECHAZADA',
  DECLINED: 'RECHAZADA',
  EN_RECOGIDA: 'EN_RECOGIDA',
  IN_PICKUP: 'EN_RECOGIDA',
  PICKUP: 'EN_RECOGIDA',
  PICKUP_SCHEDULED: 'EN_RECOGIDA',
  SCHEDULED: 'EN_RECOGIDA',
  RECOGIDA: 'EN_RECOGIDA',
  ENTREGADA: 'ENTREGADA',
  DELIVERED: 'ENTREGADA',
  CONFIRMED: 'ENTREGADA',
  CONFIRMADA: 'ENTREGADA',
  COMPLETED: 'ENTREGADA',
  COMPLETADA: 'ENTREGADA',
  RECIBIDA: 'ENTREGADA',
  RECEIVED: 'ENTREGADA',
}

/** Normaliza variantes de estado (español/inglés, sinónimos, mayúsculas/minúsculas) al enum canónico. */
export function normalizeDonationStatus(status: unknown): EstadoDonacionCanonico {
  if (typeof status !== 'string') return 'PENDIENTE'
  const key = status.trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (!key) return 'PENDIENTE'
  return ESTADO_DONACION_MAP[key] ?? (key as EstadoDonacionCanonico)
}

export const ESTADO_DONACION_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PENDING: 'Pendiente',
  SOLICITADA: 'Pendiente',
  APROBADA: 'Aprobada',
  APPROVED: 'Aprobada',
  RECHAZADA: 'Rechazada',
  REJECTED: 'Rechazada',
  EN_RECOGIDA: 'En recogida',
  IN_PICKUP: 'En recogida',
  SCHEDULED: 'En recogida',
  ENTREGADA: 'Entregada',
  DELIVERED: 'Entregada',
  CONFIRMED: 'Entregada',
}

export const SIGUIENTE: Record<string, EstadoDonacion[]> = {
  PENDIENTE: ['APROBADA', 'RECHAZADA'],
  PENDING: ['APROBADA', 'RECHAZADA'],
  SOLICITADA: ['APROBADA', 'RECHAZADA'],
  APROBADA: ['EN_RECOGIDA'],
  APPROVED: ['EN_RECOGIDA'],
  EN_RECOGIDA: ['ENTREGADA'],
  IN_PICKUP: ['ENTREGADA'],
  SCHEDULED: ['ENTREGADA'],
  RECHAZADA: [],
  REJECTED: [],
  ENTREGADA: [],
  DELIVERED: [],
  CONFIRMED: [],
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
