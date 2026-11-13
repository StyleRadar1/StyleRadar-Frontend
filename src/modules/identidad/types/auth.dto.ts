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

/** P14 · Ingreso con Google: el front entrega el ID token de Google y ms-auth lo valida. */
export interface GoogleLoginRequestDto {
  idToken: string
}

export interface LoginResponseDto {
  token: string
  user: UserSessionDto
  requiereOtp?: boolean
  otpExpiraEnSegundos?: number
  intentosOtpRestantes?: number
}

export interface VerifyOtpRequestDto {
  email: string
  codigoOtp: string
}

export interface ResendOtpRequestDto {
  email: string
}

export interface ResendOtpResponseDto {
  email?: string
  mensaje?: string
  expiraEnSegundos?: number
  intentosRestantes?: number
}

/**
 * RF-01: registro público de una persona (rol comprador). Las tiendas y fundaciones no se
 * registran aquí: solicitan ser aliadas (S3), y el administrador no se registra.
 */
export interface RegisterRequestDto {
  nombre: string
  email: string
  password: string
  maniqui?: Maniqui
  aceptaTerminos?: boolean
  aceptaHabeasData?: boolean
  telefono?: string
}

export const PASSWORD_MIN = 6
export const PASSWORD_MIN_BACKEND = 8
