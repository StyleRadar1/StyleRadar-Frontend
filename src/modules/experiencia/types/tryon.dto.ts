/**
 * DTOs de ms-probador-virtual (8092), vía API Gateway (8080).
 * Provisionales: se ajustan al Swagger del backend cuando esté publicado.
 */

/** Zona del cuerpo que el proveedor de IA sabe vestir. Calzado y accesorios no se prueban. */
export type ZonaPrenda = 'SUPERIOR' | 'INFERIOR' | 'NO_COMPATIBLE'

/** GET /api/tryon/garments: prendas del catálogo elegibles para el probador (RF-24). */
export interface TryOnGarmentDto {
  id: string
  nombre: string
  tienda: string
  imagen: string
  zona: ZonaPrenda
  tallas: string[]
  disponible: boolean
}

/** POST /api/tryon/photos (multipart, campo "file"): foto frontal (RF-23). */
export interface PhotoUploadResponseDto {
  photoId: string
}

/** POST /api/tryon/jobs → 202 Accepted (RF-25). */
export interface TryOnJobRequestDto {
  photoId: string
  garmentId: string
}

export type TryOnJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'

export interface TryOnJobCreatedDto {
  jobId: string
  status: TryOnJobStatus
}

/** GET /api/tryon/jobs/{jobId} (RF-25 y RF-26). */
export interface TryOnJobStatusDto {
  jobId: string
  status: TryOnJobStatus
  /** Avance aproximado 0–100 si el backend lo informa. */
  progress?: number
  /** URL temporal autorizada (SAS) del resultado; solo con status COMPLETED. */
  resultUrl?: string
  /** Fecha ISO en que vence resultUrl. */
  expiresAt?: string
  /** Motivo legible cuando status es FAILED. */
  error?: string
}
