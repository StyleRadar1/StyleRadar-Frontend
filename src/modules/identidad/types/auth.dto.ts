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
  name: string
  email: string
  password: string
  /** Opcional: de 7 a 20 caracteres. Si la persona no lo escribe no se envía. */
  phone?: string
  /** Opcional: máximo 100 caracteres. */
  neighborhood?: string
  /** Habeas Data (Ley 1581): debe ser verdadero. */
  dataPolicyAccepted: boolean
  /** Solo del front (no va en el cuerpo de POST /api/v1/users). */
  maniqui?: Maniqui
  aceptaTerminos?: boolean
  role?: Role
}

/** Cuerpo de POST /api/v1/users (SR-RF-01). */
export interface CreateUserRequestDto {
  name: string
  email: string
  phone?: string
  neighborhood?: string
  password: string
  dataPolicyAccepted: boolean
}

/** Contraseña de 8 a 30 caracteres en registro e inicio de sesión (D7). */
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 30
export const NAME_MIN = 2
export const NAME_MAX = 100
export const NEIGHBORHOOD_MAX = 100
