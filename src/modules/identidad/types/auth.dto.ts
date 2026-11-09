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

/** P14 · Ingreso con Google: el front entrega el ID token de Google y ms-auth lo valida. */
export interface GoogleLoginRequestDto {
  idToken: string
}

export interface LoginResponseDto {
  token: string
  user: UserSessionDto
}
