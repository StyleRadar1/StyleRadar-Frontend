import type { Role } from '@/modules/core/types/roles'

/**
 * DTOs de CADCHE-Usuarios-Service (ms-usuarios 8120), vía API Gateway.
 * Antes de conectar con VITE_USE_MOCKS=false hay que compararlos con el Swagger del servicio.
 */

/** RF-66: estado de una cuenta. Activa: usa StyleRadar. Inactiva: sin uso reciente. Bloqueada: no puede entrar. */
export type EstadoCuenta = 'ACTIVA' | 'INACTIVA' | 'BLOQUEADA'
export const ESTADOS_CUENTA: readonly EstadoCuenta[] = ['ACTIVA', 'INACTIVA', 'BLOQUEADA']
export const ESTADO_CUENTA_LABEL: Record<EstadoCuenta, string> = { ACTIVA: 'Activa', INACTIVA: 'Inactiva', BLOQUEADA: 'Bloqueada' }
export const ESTADO_CUENTA_AYUDA: Record<EstadoCuenta, string> = {
  ACTIVA: 'Puede usar StyleRadar.',
  INACTIVA: 'Sin uso reciente. Se reactiva cuando vuelve a entrar.',
  BLOQUEADA: 'No puede iniciar sesión y sus publicaciones se ocultan.',
}

export type Plan = 'RADAR' | 'RADAR_PLUS'
export const PLAN_LABEL: Record<Plan, string> = { RADAR: 'Radar', RADAR_PLUS: 'Radar+' }

/** Fila de la administración de usuarios (GET /api/usuarios). */
export interface UsuarioAdminDto {
  id: string
  nombre: string
  correo: string
  rol: Role
  plan: Plan
  estado: EstadoCuenta
  barrio: string
  /** Fecha de registro en ISO 8601 (AAAA-MM-DD). */
  miembroDesde: string
}

/** PATCH /api/usuarios/{id}/estado */
export interface CambioEstadoDto {
  estado: EstadoCuenta
}

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
