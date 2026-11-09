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

export const ESTILOS = ['Formal', 'Casual', 'Urbana', 'Deportivo', 'Vintage'] as const
export type Estilo = (typeof ESTILOS)[number]
export const MAX_ESTILOS = 4

/** Perfil de la persona con sesión (GET /api/usuarios/me). RF-03 a RF-06. */
export interface PerfilDto {
  id: string
  nombre: string
  correo: string
  celular: string
  barrio: string
  maniqui: Maniqui
  tallas: TallasDto
  estilos: Estilo[]
  plan: Plan
  miembroDesde: string
}

/** PUT /api/usuarios/me. El correo, el plan y la fecha de registro no se cambian desde el perfil. */
export type ActualizarPerfilDto = Pick<PerfilDto, 'nombre' | 'celular' | 'barrio' | 'maniqui' | 'tallas' | 'estilos'>
