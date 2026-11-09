/**
 * DTOs para moderación de publicaciones del catálogo (RF-61).
 * Microservicio: ms-item-catalogo (RST-ItemCatalog-Service).
 */

export type ModerationType = 'Catálogo' | 'Segunda mano'

export type ModerationStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export const REJECTION_REASONS = [
  'Las fotos no muestran bien la prenda',
  'El precio no es coherente',
  'Prenda no permitida en StyleRadar',
  'Descripción incompleta',
  'Estado de la prenda no coincide con las imágenes',
  'Otro',
] as const

export type RejectionReason = (typeof REJECTION_REASONS)[number]

export interface ModerationItemDto {
  id: string
  titulo: string
  publicador: string
  tipoPublicador: 'Tienda' | 'Persona'
  tipo: ModerationType
  precio: number
  fecha: string
  imagen: string
  categoria: string
  tallas: string[]
  nota?: string
}

export interface ModerationDecisionDto {
  itemId: string
  aprobado: boolean
  motivo?: string
  comentario?: string
}

export interface ModerationHistoryItemDto {
  id: string
  itemId: string
  titulo: string
  publicador: string
  aprobado: boolean
  motivo?: string
  fecha: string
}

