import type { GarmentType, PageDto, StyleCode } from './usuario.dto'

/** Prenda de GET /api/v1/users/{id}/feed y /recommendations (SR-RF-05 y 06). Viene del catálogo real. */
export interface FeedItemDto {
  itemId: string
  garmentId: number | string
  storeId: string
  storeNit?: string | null
  name: string
  description?: string | null
  garmentType: GarmentType
  brand?: string | null
  color?: string | null
  style?: StyleCode | null
  price: number
  stock: number
  status: 'AVAILABLE' | string
  publishedAt: string
  photos?: string[] | null
  availableSizes: string[]
  /** SR-RF-06 P-04: motivo y puntaje. El back todavía no los envía. */
  reason?: string | null
  score?: number | null
}

export type FeedPageDto = PageDto<FeedItemDto>

/** SR-RF-06: además de la página, si el comprador no tiene preferencias y el mensaje del resultado. */
export interface RecommendationsPageDto extends FeedPageDto {
  generalWithoutPreferences: boolean
  message: string
}

export interface FeedQuery { page?: number; size?: number }
/** SR-RF-05 y 06: size de 1 a 20, page desde 0. */
export const FEED_SIZE_MAX = 20

export const TEXTOS_FEED = {
  conPerfil: 'Recomendaciones generadas según tu perfil.',
  sinPreferencias: 'No tienes preferencias de estilo ni tallas registradas. Actualiza tu perfil para recibir recomendaciones.',
  catalogoCaido: 'El catálogo no está disponible en este momento',
}
