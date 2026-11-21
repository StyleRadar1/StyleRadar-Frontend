import type { Role } from '@/modules/core/types/roles'
import type { Maniqui } from './usuario.dto'

/**
 * DTOs de ms-auth según el documento de requerimientos v2 (SR-RF-02 y SR-RF-92) y la hoja Contrato:
 * nombres en inglés y los datos de la sesión en la raíz de la respuesta (F-01 · F-28).
 */
export interface LoginRequestDto {
  email: string
  password: string
}

/** Datos de la sesión que usa el front (se arman con la respuesta de ms-auth). */
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

/** Respuesta de POST /api/v1/auth/login, /oauth2/google y /otp/verify. */
export interface LoginResponseDto {
  /** null cuando el correo no está verificado y hay que ingresar el código (otpRequired). */
  accessToken: string | null
  tokenType?: string
  expiresIn?: number
  userId: string | number
  roles: string[]
  email: string
  emailVerified?: boolean
  otpRequired?: boolean
  otpExpiresInSeconds?: number
  otpAttemptsRemaining?: number
  message?: string
  /** Solo en modo demostración: el contrato de ms-auth no trae el nombre. */
  name?: string
}

/** Resultado del inicio de sesión: entra directo, o primero pide el código porque el correo no está verificado. */
export type LoginResult =
  | { kind: 'session'; user: UserSessionDto }
  | { kind: 'otp'; email: string; expiresInSeconds?: number; attemptsRemaining?: number }

export interface VerifyOtpRequestDto {
  email: string
  otpCode: string
}

export interface ResendOtpRequestDto {
  email: string
}

/** Respuesta de POST /api/v1/auth/otp/resend. */
export interface ResendOtpResponseDto {
  message?: string
  expiresInSeconds?: number
  attemptsRemaining?: number
  resendsRemaining?: number
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
  role?: Role
}

export const PASSWORD_MIN = 6
export const PASSWORD_MIN_BACKEND = 8
