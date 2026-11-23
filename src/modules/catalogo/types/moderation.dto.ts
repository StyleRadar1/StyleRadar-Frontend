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
  almacenId?: string
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
  moderadorId?: string
}

export type BackendModerationDecision = 'APROBADA' | 'RECHAZADA'

export interface BackendModerationRequestDto {
  decision: BackendModerationDecision
  motivo?: string
  moderadorId?: string
}

export interface ModerationPendingGroupDto {
  almacenId?: string
  nombreAlmacen?: string
  publicador?: string
  tipoPublicador?: string
  prendas?: Record<string, any>[]
  publicaciones?: Record<string, any>[]
}

export interface ModerationPendingResponseDto {
  tipoPublicador?: string
  total?: number
  grupos?: ModerationPendingGroupDto[]
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

