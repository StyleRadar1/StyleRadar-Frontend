import type { Role } from '@/modules/core/types/roles'

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
