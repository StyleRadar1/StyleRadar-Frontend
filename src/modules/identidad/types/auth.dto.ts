import type { Role } from '@/modules/core/types/roles'
import type { Maniqui } from './usuario.dto'

/** DTOs de CADCHE-Authentication-Service. Ajustar a los del Swagger cuando esté publicado. */
export interface LoginRequestDto {
  email: string
  password: string
}

export interface UserSessionDto {
  id: string
  name: string
  email: string
  role: Role
}

export interface LoginResponseDto {
  token: string
  user: UserSessionDto
}

/**
 * RF-01: registro público de una persona (rol comprador). Las tiendas y fundaciones no se
 * registran aquí: solicitan ser aliadas (S3), y el administrador no se registra.
 */
export interface RegisterRequestDto {
  nombre: string
  email: string
  password: string
  maniqui: Maniqui
  aceptaTerminos: boolean
}

export const PASSWORD_MIN = 6
