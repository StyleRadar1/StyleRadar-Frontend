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

export interface AdminFoundationDto {
  id: string
  nombre: string
  nit: string
  correo: string
  telefono: string
  barrio: string
  direccion: string
  representante: string
  estado: EstadoFundacion
  aliadaDesde: string
  donaciones: { pendientes: number; enProceso: number; recibidas: number; rechazadas: number }
}

/** Datos editables al registrar o actualizar una fundación. */
export type FoundationFormDto = Pick<AdminFoundationDto, 'nombre' | 'nit' | 'correo' | 'telefono' | 'barrio' | 'direccion' | 'representante'> & {
  certificado?: string
}
export const FUNDACION_VACIA: FoundationFormDto = { nombre: '', nit: '', correo: '', telefono: '', barrio: '', direccion: '', representante: '', certificado: '' }

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
