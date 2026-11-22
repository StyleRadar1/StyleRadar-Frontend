import type { GarmentType, StyleCode } from './usuario.dto'

/** SR-RF-28: la talla del filtro solo admite XS a XXL (P-06: el back no acepta tallas numéricas). */
export const SAVED_SEARCH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
export type SavedSearchSize = (typeof SAVED_SEARCH_SIZES)[number]
export const SAVED_SEARCH_NAME_MAX = 100

/** Cuerpo de POST /api/v1/users/{id}/saved-searches. Solo name es obligatorio. */
export interface SavedSearchRequestDto {
  name: string
  query?: string
  garmentType?: GarmentType
  color?: string
  size?: SavedSearchSize
  minPrice?: number
  maxPrice?: number
  brand?: string
  style?: StyleCode
  latitude?: number
  longitude?: number
}

/** Respuesta de POST y de cada elemento de GET (la más reciente primero, RN-07). */
export interface SavedSearchDto extends SavedSearchRequestDto {
  id: number | string
  createdAt: string
}
