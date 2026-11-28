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
  id?: string | null
  almacenId?: string | null
  sedeId?: string | null
  nit: string
  tradeName: string
  description?: string | null
  phone?: string | null
  contactEmail?: string | null
  address?: string | null
  barrio?: string | null
  hours?: string | null
  payoutAccount?: string | null
  latitude?: number | null
  longitude?: number | null
  rating?: number | null
  categories?: string[] | null
  verificationStatus?: VerificationStatus | null
  representative?: string | null
}

/** PUT /api/v1/stores/{nit}: actualización del perfil comercial del almacén. */
export interface UpdateStoreRequestDto {
  tradeName?: string
  description?: string
  phone?: string
  contactEmail?: string
  representative?: string
  payoutAccount?: string
  address?: string
  barrio?: string
  hours?: string
  categories?: StoreCategory[]
  latitude?: number
  longitude?: number
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

/** SR-RF-74: fotografía de la tienda física (GET y POST /api/v1/stores/{nit}/photos). */
export interface StorePhotoDto {
  id: number | string
  storeNit: string
  url: string
  /** De 1 a 6. La posición 1 es la portada. */
  position: number
  cover: boolean
  registeredAt?: string
}
/** PUT /api/v1/stores/{nit}/photos/order: exactamente las fotos actuales, en el orden nuevo. */
export interface ReorderPhotosRequestDto { photoIds: (number | string)[] }

export const MAX_STORE_PHOTOS = 6
export const MAX_STORE_PHOTO_BYTES = 6 * 1024 * 1024
export const ALLOWED_STORE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/*
 * F-21 · registro del almacén (anexo de ms-tiendas y precondición de SR-RF-62).
 * POST /api/v1/stores/documents/rut (multipart, campo file, PDF de máximo 5 MB) devuelve la URL del RUT;
 * POST /api/v1/stores registra el almacén con esa URL y queda PENDING hasta que el administrador lo verifique.
 */
export type StoreCategory = 'CASUAL' | 'FORMAL' | 'SPORTY' | 'VINTAGE' | 'ACCESSORIES'
export const STORE_CATEGORIES: StoreCategory[] = ['CASUAL', 'FORMAL', 'SPORTY', 'VINTAGE', 'ACCESSORIES']
export const STORE_CATEGORY_TEXT: Record<StoreCategory, string> = {
  CASUAL: 'Casual', FORMAL: 'Formal', SPORTY: 'Deportivo', VINTAGE: 'Vintage', ACCESSORIES: 'Accesorios',
}

export interface RegisterStoreRequestDto {
  nit: string
  tradeName: string
  description?: string
  phone?: string
  contactEmail: string
  latitude?: number
  longitude?: number
  categories: StoreCategory[]
  rutPdfUrl: string
}

/** Respuesta del registro (201): el almacén con su estado de verificación. */
export interface RegisteredStoreDto extends StoreResponseDto {
  rutPdfUrl?: string | null
}

/** Respuesta de POST /api/v1/stores/documents/rut. */
export interface UploadedDocumentDto {
  url: string
  fileName?: string
  contentType?: string
  registeredAt?: string
}

export const MAX_RUT_BYTES = 5 * 1024 * 1024
/** Límites de RegistrarAlmacenRequestDTO. */
export const STORE_REGISTER_LIMITS = { tradeNameMin: 2, tradeNameMax: 120, description: 500, phone: 30 } as const
