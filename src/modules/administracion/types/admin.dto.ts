/**
 * DTOs del módulo de administración (tiendas, fundaciones y playlists destacadas), con los mismos datos
 * del «Módulo de administración» del prototipo. Rutas provisionales del API Gateway hasta tener el Swagger.
 */

export type Verificacion = 'Verificada' | 'Pendiente' | 'Rechazada'
export type EstadoSuscripcion = 'Activa' | 'Periodo gratuito' | 'Cancelada' | 'Vencida' | 'Sin suscripción'

export interface AdminStoreDto {
  id: string
  nombre: string
  categoria: string
  barrio: string
  direccion: string
  telefono: string
  correo: string
  /** «—» cuando la tienda aún no lo envía. */
  nit: string
  representante: string
  aliadaDesde: string
  verificacion: Verificacion
  motivoRechazo?: string
  suscripcion: { estado: EstadoSuscripcion; proximo: string; inicio: string }
  /** Documentos de verificación recibidos. Con el back real, el RUT trae su enlace (rutPdfUrl). */
  documentos: { nombre: string; recibido: boolean; url?: string }[]
  catalogo: { publicadas: number; revision: number; agotadas: number; retiradas: number }
}

/* ── ms-tiendas · SR-RF-62 y anexo de administradores (nombres en inglés, D1) ── */

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
/** En el PATCH solo se decide APPROVED o REJECTED; volver a PENDING es con review-request (D14). */
export type VerificationDecision = Exclude<VerificationStatus, 'PENDING'>
export const VERIFICACION_DE: Record<VerificationStatus, Verificacion> = { PENDING: 'Pendiente', APPROVED: 'Verificada', REJECTED: 'Rechazada' }

/** Categorías comerciales del almacén y su texto en pantalla. */
export type StoreCategory = 'CASUAL' | 'FORMAL' | 'SPORTY' | 'VINTAGE' | 'ACCESSORIES'
export const STORE_CATEGORY_LABEL: Record<StoreCategory, string> = {
  CASUAL: 'Casual', FORMAL: 'Formal', SPORTY: 'Deportivo', VINTAGE: 'Vintage', ACCESSORIES: 'Accesorios',
}

/** GET /api/v1/admin/stores/verifications (content[]) y GET /api/v1/admin/stores/{nit}/verification. */
export interface StoreVerificationDto {
  nit: string
  tradeName: string
  description?: string | null
  phone?: string | null
  contactEmail: string
  latitude?: number | null
  longitude?: number | null
  rating?: number | null
  categories: StoreCategory[]
  verificationStatus: VerificationStatus
  verificationDecidedAt?: string | null
  decisionAdminId?: number | string | null
  verificationReason?: string | null
  rutPdfUrl?: string | null
  legacyUnverified?: boolean
}
export interface StoreVerificationPageDto {
  content: StoreVerificationDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
/** PATCH /api/v1/admin/stores/{nit}/verification: solo estos dos campos (FA-07). */
export interface VerificationDecisionRequestDto { decision: VerificationDecision; reason?: string }
/** El rechazo exige un motivo de 10 a 1000 caracteres (RN-05). */
export const MOTIVO_RECHAZO_MIN = 10
export const MOTIVO_RECHAZO_MAX = 1000

/** Anexo: administrador autorizado de un almacén (GET y PUT /api/v1/admin/stores/{nit}/administrators). */
export interface StoreAdministratorDto {
  id: number | string
  userId: number | string
  storeNit: string
  assignedById?: number | string | null
  assignedAt?: string | null
}

export type EstadoFundacion = 'Activa' | 'Inactiva'

/** SR-RF-63: tipos de prenda que recibe una fundación (acceptedCategories). */
export type GarmentCategory = 'TOP' | 'BOTTOM' | 'FOOTWEAR' | 'DRESS' | 'ACCESSORY'
export const GARMENT_CATEGORIES: GarmentCategory[] = ['TOP', 'BOTTOM', 'FOOTWEAR', 'DRESS', 'ACCESSORY']
export const GARMENT_CATEGORY_LABEL: Record<GarmentCategory, string> = {
  TOP: 'Prendas superiores', BOTTOM: 'Prendas inferiores', FOOTWEAR: 'Calzado', DRESS: 'Vestidos', ACCESSORY: 'Accesorios',
}

/** Respuesta de GET, POST y PUT /api/v1/admin/foundations y de PATCH …/{id}/deactivate|activate (SR-RF-63 a 65). */
export interface FoundationResponseDto {
  id: number | string
  name: string
  nit: string
  neighborhood: string
  description?: string | null
  address: string
  phone?: string | null
  email: string
  latitude: number
  longitude: number
  acceptedCategories: GarmentCategory[]
  representativeId: number | string
  legalEntityCertificateUrl: string
  supportedCauses?: string | null
  openingHours?: string | null
  donationPolicies?: string | null
  active: boolean
  registeredAt: string
}

/** Cuerpo de POST y PUT /api/v1/admin/foundations. */
export type FoundationRequestDto = Omit<FoundationResponseDto, 'id' | 'active' | 'registeredAt'>

/** Límites de SR-RF-63 y 64. */
export const FOUNDATION_LIMITS = {
  nameMin: 4, nameMax: 120, neighborhood: 80, description: 500, address: 200, phone: 30,
  certificateUrl: 300, supportedCauses: 250, openingHours: 150, donationPolicies: 500, reason: 500,
} as const

/** Fundación como la muestra el admin: los datos del back más lo que la pantalla calcula. */
export interface AdminFoundationDto extends Omit<FoundationResponseDto, 'id'> {
  id: string
  estado: EstadoFundacion
  aliadaDesde: string
  /** ms-tiendas no las envía (vienen del servicio de donaciones): en cero hasta conectarlo. */
  donaciones: { pendientes: number; enProceso: number; recibidas: number; rechazadas: number }
}

/** Datos del formulario de registro y edición. Los números van como texto mientras se escriben. */
export interface FoundationFormDto {
  name: string
  nit: string
  email: string
  phone: string
  neighborhood: string
  address: string
  description: string
  latitude: string
  longitude: string
  acceptedCategories: GarmentCategory[]
  representativeId: string
  /** Solo para mostrar en el formulario; no se envía. */
  representativeName: string
  legalEntityCertificateUrl: string
  /** Nombre del PDF que se acaba de subir; no se envía. */
  certificateName: string
  supportedCauses: string
  openingHours: string
  donationPolicies: string
}
export const FUNDACION_VACIA: FoundationFormDto = {
  name: '', nit: '', email: '', phone: '', neighborhood: '', address: '', description: '', latitude: '', longitude: '',
  acceptedCategories: [], representativeId: '', representativeName: '', legalEntityCertificateUrl: '', certificateName: '',
  supportedCauses: '', openingHours: '', donationPolicies: '',
}

export interface AdminPlaylistDto {
  id: string
  nombre: string
  creador: string
  meGusta: number
  guardados: number
  prendas: number
  destacada: boolean
}

/** Máximo de playlists destacadas en el inicio. */
export const MAX_DESTACADAS = 3
/** Interacción para ordenar las playlists: me gusta + guardados × 2. */
export const interaccion = (p: Pick<AdminPlaylistDto, 'meGusta' | 'guardados'>) => p.meGusta + p.guardados * 2
/** Precio mensual del plan de tienda aliada (el mismo de Planes). */
export const PRECIO_TIENDA = 89_000
