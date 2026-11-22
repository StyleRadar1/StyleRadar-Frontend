/**
 * DTOs de ms-probador-virtual (8092), vía API Gateway (8080).
 * Actualizados conforme a los RF del Paquete 5 (17/11/2026).
 */

/** Zona del cuerpo que el proveedor de IA sabe vestir. Calzado y accesorios no se prueban. */
export type ZonaPrenda = 'SUPERIOR' | 'INFERIOR' | 'CUERPO_COMPLETO' | 'NO_COMPATIBLE'

/** GET /api/v1/try-on/garments: prendas del catálogo elegibles para el probador (RF-24). */
export interface TryOnGarmentDto {
  id: string
  nombre: string
  tienda: string
  imagen: string
  zona: ZonaPrenda
  tallas: string[]
  disponible: boolean
  precio?: number
}

/** POST /api/v1/try-on/photos (multipart, campo "photo"): foto frontal (RF-23). */
export interface PhotoUploadResponseDto {
  photoId: string
  photoUrl?: string
}

/** RF-24: Validación de prenda y compatibilidad de talla */
export interface GarmentValidationResponseDto {
  garmentId: string
  name: string
  category: 'TOP' | 'BOTTOM' | 'ONE_PIECE' | string
  imageUrl: string
  compatible: boolean
  visible: boolean
  zone: 'UPPER_BODY' | 'LOWER_BODY' | 'FULL_BODY' | string
  validationMessage: string
  sizeEligible?: boolean | null
  fitMessage?: string
  quotaAvailable?: boolean
  eligibleForTryOn?: boolean
  replacedGarmentIds?: string[]
}

/** SR-P5-N01: Gestión de consentimiento biométrico (Ley 1581) */
export interface BiometricConsentStatusDto {
  consentId?: string
  userId: string
  accepted: boolean
  termsVersion: string
  purposes?: string[]
  revokedAt?: string | null
}

/** SR-P5-N02: Consulta de cuotas mensuales */
export interface TryOnQuotaDto {
  monthlyLimit: number
  usedCount: number
  remainingCount: number
  billingPeriod?: string
}

/** POST /api/v1/try-on/jobs → 202 Accepted (RF-25). */
export interface TryOnJobRequestDto {
  photoId: string
  garmentId: string
  selectedSize?: string
  photoUrl?: string
  biometricConsent?: boolean
  userId?: string
}

export type TryOnJobStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

export interface TryOnJobCreatedDto {
  jobId: string
  status: TryOnJobStatus
  location?: string
  estimatedDurationSeconds?: number
}

/** GET /api/v1/try-on/jobs/{jobId} y GET /api/v1/try-on/jobs (RF-25, RF-26 y SR-P5-N03). */
export interface TryOnJobStatusDto {
  jobId: string
  status: TryOnJobStatus
  garmentId?: string
  garmentName?: string
  userId?: string
  photoUrl?: string
  /** Avance aproximado 0–100 si el backend lo informa. */
  progress?: number
  /** URL temporal autorizada (SAS) del resultado; solo con status COMPLETED. */
  resultUrl?: string
  resultImageUrl?: string
  /** Fecha ISO en que vence resultUrl. */
  expiresAt?: string
  /** Motivo legible cuando status es FAILED. */
  error?: string
  errorMessage?: string
  createdAt?: string
  completedAt?: string
  executionDurationMs?: number
}
