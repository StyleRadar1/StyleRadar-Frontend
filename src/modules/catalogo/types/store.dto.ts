/**
 * DTOs de ms-tiendas (CADche) vía API Gateway, con los nombres en inglés acordados el 17/11 (D1).
 * Almacén público: GET /api/v1/stores (paginado, solo APPROVED) y GET /api/v1/stores/{nit}.
 * Almacén de la Tienda: GET /api/v1/users/{userId}/store (Mi tienda lo usa para obtener el NIT).
 */

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Texto que muestra la pantalla para cada estado de verificación. */
export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Verificada',
  REJECTED: 'Rechazada',
}

export interface StoreResponseDto {
  nit: string
  tradeName: string
  description?: string | null
  phone?: string | null
  contactEmail?: string | null
  latitude?: number | null
  longitude?: number | null
  rating?: number | null
  categories?: string[] | null
  verificationStatus?: VerificationStatus | null
}

/** Página de almacenes (content[] y paginación), igual que las demás búsquedas de los micros. */
export interface StorePageDto {
  content: StoreResponseDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

/** SR-RF-59 · SR-RF-60: reglas de distintivos del almacén (GET y PUT /api/v1/stores/{nit}/catalog-settings). */
export interface CatalogSettingsDto {
  nit: string
  lowStockThreshold: number
  newArrivalDays: number
  updatedAt?: string
}
export type CatalogSettingsRequestDto = Pick<CatalogSettingsDto, 'lowStockThreshold' | 'newArrivalDays'>

/** Umbral de «Últimas unidades»: de 0 a 50, por defecto 3 (RN-03). */
export const LOW_STOCK_MIN = 0
export const LOW_STOCK_MAX = 50
export const LOW_STOCK_DEFAULT = 3
/** Periodo de «Nueva llegada»: de 1 a 60 días, por defecto 7 (RN-03). La pantalla ofrece 7, 14 o 30. */
export const NEW_ARRIVAL_MIN = 1
export const NEW_ARRIVAL_MAX = 60
export const NEW_ARRIVAL_DEFAULT = 7
export const NEW_ARRIVAL_OPTIONS = [7, 14, 30] as const

export type ActiveBadge = 'LOW_STOCK' | 'NEW_ARRIVAL' | 'NONE'

/** PATCH /api/v1/stores/{nit}/items/{itemId}/low-stock */
export interface LowStockRequestDto { currentStock: number; available: boolean }
/** PATCH /api/v1/stores/{nit}/items/{itemId}/new-arrival */
export interface NewArrivalRequestDto { publishedAt: string; withdrawn: boolean }

/** Distintivo calculado por ms-tiendas para una prenda. */
export interface ItemBadgeDto {
  nit: string
  itemId: number
  lowStockThreshold: number
  newArrivalDays: number
  lowStock?: boolean
  newArrival?: boolean
  activeBadge: ActiveBadge
  updatedAt?: string
}
