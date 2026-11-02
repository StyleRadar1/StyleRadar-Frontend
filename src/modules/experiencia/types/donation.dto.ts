import type { Conservacion } from './secondhand.dto'

/** DTOs de ms-segunda-vida-donaciones (8093), parte de donaciones. Provisionales hasta el Swagger. */

export interface PuntoAcopioDto { id: string; nombre: string; direccion: string }

/** GET /api/donations/foundations: fundaciones activas, ordenadas por cercanía (RF-44). */
export interface FoundationDto {
  id: string
  nombre: string
  barrio: string
  distanciaKm: number
  /** Categorías de prenda que recibe. */
  categorias: string[]
  activa: boolean
  puntos: PuntoAcopioDto[]
}

export type Modalidad = 'RECOGIDA' | 'ENTREGA_EN_PUNTO'
export const FRANJAS = ['8:00 a 12:00', '12:00 a 15:00', '15:00 a 18:00'] as const

export interface LogisticaDto {
  modalidad: Modalidad
  /** Fecha ISO (AAAA-MM-DD). */
  fecha: string
  franja: string
  /** Con ENTREGA_EN_PUNTO. */
  puntoId?: string
  /** Con RECOGIDA. */
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

/** POST /api/donations (multipart: "data" en JSON y hasta 4 "files"). 409 si ya existe la misma solicitud (RF-42, 45, 48). */
export interface DonationRequestDto {
  fundacionId: string
  prenda: PrendaDonadaDto
  logistica: LogisticaDto
}

export type EstadoDonacion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_RECOGIDA' | 'ENTREGADA'
export const ESTADO_DONACION_LABEL: Record<EstadoDonacion, string> = {
  PENDIENTE: 'Pendiente', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', EN_RECOGIDA: 'En recogida', ENTREGADA: 'Entregada',
}

/** Transiciones que permite el backend. La interfaz solo ofrece estas (RF-46, 47, 49). */
export const SIGUIENTE: Record<EstadoDonacion, EstadoDonacion[]> = {
  PENDIENTE: ['APROBADA', 'RECHAZADA'],
  APROBADA: ['EN_RECOGIDA'],
  EN_RECOGIDA: ['ENTREGADA'],
  RECHAZADA: [],
  ENTREGADA: [],
}

export interface DonationDto {
  id: string
  fundacion: { id: string; nombre: string }
  donante: { id: string; nombre: string }
  prenda: PrendaDonadaDto
  fotos: string[]
  logistica: LogisticaDto & { puntoNombre?: string }
  estado: EstadoDonacion
  justificacion?: string
  /** Comprobante simbólico al confirmar la recepción (RF-49). */
  comprobante?: { codigo: string; emitidoEn: string }
  creadaEn: string
}

/** PATCH /api/donations/{id}/status. RECHAZADA exige justificación. */
export interface DonationStatusRequestDto {
  estado: Exclude<EstadoDonacion, 'PENDIENTE'>
  justificacion?: string
}
