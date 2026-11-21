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
