import type { Role } from '@/modules/core/types/roles'

/**
 * DTOs de CADCHE-Usuarios-Service (ms-usuarios 8120), vía API Gateway.
 * Antes de conectar con VITE_USE_MOCKS=false hay que compararlos con el Swagger del servicio.
 */

/** SR-RF-66: estados de cuenta del contrato (D4: en inglés). La pantalla los muestra en español. */
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export const ACCOUNT_STATUSES: readonly AccountStatus[] = ['ACTIVE', 'INACTIVE', 'BLOCKED']
export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = { ACTIVE: 'Activa', INACTIVE: 'Inactiva', BLOCKED: 'Bloqueada' }
export const ACCOUNT_STATUS_HELP: Record<AccountStatus, string> = {
  ACTIVE: 'Puede usar StyleRadar.',
  INACTIVE: 'Sin uso reciente. Se reactiva cuando vuelve a entrar.',
  BLOCKED: 'No puede iniciar sesión y sus publicaciones se ocultan.',
}

export type Plan = 'RADAR' | 'RADAR_PLUS'
export const PLAN_LABEL: Record<Plan, string> = { RADAR: 'Radar', RADAR_PLUS: 'Radar+' }

/** SR-RF-66: cuenta en la administración (GET /api/v1/admin/users y /{id}). El back manda el id como número. */
export interface AdminUserDto {
  id: string
  name: string
  email: string
  /** Vacío si no lo registró. */
  neighborhood?: string
  /** Lista con un solo rol (D3): el front lee roles[0]. */
  roles: Role[]
  accountStatus: AccountStatus
  registeredAt: string
  /** Auditoría del último cambio de estado. */
  statusChangedAt?: string | null
  statusChangedBy?: number | string | null
  statusChangeReason?: string | null
}

/** Página de resultados de la búsqueda (content[] y paginación). */
export interface PageDto<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

/** Filtros de GET /api/v1/admin/users. q hasta 100 caracteres, page desde 0, size de 1 a 100. */
export interface AdminUsersQuery {
  status?: AccountStatus
  role?: Role
  q?: string
  page?: number
  size?: number
}
export const ADMIN_Q_MAX = 100
export const ADMIN_PAGE_SIZE_MAX = 100

/** PATCH /api/v1/admin/users/{id}/status. reason es obligatorio con BLOCKED. */
export interface ChangeStatusRequestDto {
  status: AccountStatus
  reason?: string
}
export const REASON_MAX = 1000

export type Maniqui = 'MUJER' | 'HOMBRE'
export const MANIQUI_LABEL: Record<Maniqui, string> = { MUJER: 'Mujer', HOMBRE: 'Hombre' }

export const TALLAS_SUPERIOR = ['XS', 'S', 'M', 'L', 'XL'] as const
export const TALLAS_INFERIOR = ['26', '28', '30', '32', '34', '36'] as const
export const TALLAS_CALZADO = ['36', '37', '38', '39', '40', '41', '42', '43'] as const
export type TallaSuperior = (typeof TALLAS_SUPERIOR)[number]
export type TallaInferior = (typeof TALLAS_INFERIOR)[number]
export type TallaCalzado = (typeof TALLAS_CALZADO)[number]

/** Tallas por tipo de prenda (RF-04). */
export interface TallasDto {
  superior: TallaSuperior
  inferior: TallaInferior
  calzado: TallaCalzado
}

/**
 * SR-RF-03: estilos del perfil (códigos del contrato en inglés, de 1 a 5).
 * Los textos que ve la persona siguen en español.
 */
export const STYLES = ['CASUAL', 'FORMAL', 'SPORTY', 'URBAN', 'VINTAGE'] as const
export type StyleCode = (typeof STYLES)[number]
export const STYLE_LABEL: Record<StyleCode, string> = {
  CASUAL: 'Casual', FORMAL: 'Formal', SPORTY: 'Deportivo', URBAN: 'Urbano', VINTAGE: 'Vintage',
}
export const MIN_ESTILOS = 1
export const MAX_ESTILOS = 5

/** SR-RF-04: tallas por tipo de prenda. TOP de XS a XXL, BOTTOM de 26 a 36 y FOOTWEAR de 34 a 45. */
export const SIZES_TOP = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
export const SIZES_BOTTOM = ['26', '28', '30', '32', '34', '36'] as const
export const SIZES_FOOTWEAR = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] as const
export type GarmentType = 'TOP' | 'BOTTOM' | 'FOOTWEAR'
export const GARMENT_TYPES: readonly GarmentType[] = ['TOP', 'BOTTOM', 'FOOTWEAR']
export const SIZES_BY_TYPE: Record<GarmentType, readonly string[]> = { TOP: SIZES_TOP, BOTTOM: SIZES_BOTTOM, FOOTWEAR: SIZES_FOOTWEAR }
export const GARMENT_LABEL: Record<GarmentType, string> = { TOP: 'Talla superior', BOTTOM: 'Talla inferior', FOOTWEAR: 'Calzado' }
/** Varias tallas por tipo; un tipo sin tallas no se envía. */
export type SizesByGarmentType = Partial<Record<GarmentType, string[]>>

/** Respuesta de GET y PUT /api/v1/users/{id}, /style-preferences y /sizes (SR-RF-03, SR-RF-04 y anexo D15). */
export interface UserProfileDto {
  id: string | number
  name: string
  email: string
  phone?: string | null
  neighborhood?: string | null
  emailVerified: boolean
  registeredAt: string
  stylePreferences: StyleCode[]
  usualSizes: string[]
  sizesByGarmentType: SizesByGarmentType
}

/**
 * Perfil que usa la pantalla (F-12): los campos del contrato más dos datos solo del front
 * que el documento de ms-usuarios no define (maniquí del probador y plan).
 */
export interface PerfilDto {
  id: string
  name: string
  email: string
  phone: string
  neighborhood: string
  emailVerified: boolean
  registeredAt: string
  stylePreferences: StyleCode[]
  usualSizes: string[]
  sizesByGarmentType: SizesByGarmentType
  maniqui: Maniqui
  /** Solo en datos de prueba: con el back real el plan lo da ms-pagos, no ms-usuarios. */
  plan?: Plan
}

/** Lo que se edita en el perfil. El correo, el plan y la fecha de registro no se cambian desde aquí. */
export type ActualizarPerfilDto = Pick<PerfilDto, 'name' | 'phone' | 'neighborhood' | 'maniqui' | 'stylePreferences' | 'sizesByGarmentType'>

/** Cuerpo de PUT /api/v1/users/{id} (anexo D15: propuesta por confirmar con ms-usuarios). */
export interface UpdateUserRequestDto {
  name: string
  phone?: string
  neighborhood?: string
}
