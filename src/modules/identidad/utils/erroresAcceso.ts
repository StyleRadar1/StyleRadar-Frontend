import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, fieldErrors, MENSAJES, MENSAJES_POR_CODIGO, type CamposConError } from '@/modules/core/api/errors'

/**
 * Textos de error de Iniciar sesión y Crear cuenta (plan de errores · Cristian).
 * Nunca dicen si la cuenta existe, si está bloqueada ni cuál dato falló.
 */
export const TEXTOS_ACCESO = {
  credenciales: 'El correo o la contraseña son incorrectos.',
  bloqueada: 'No pudimos iniciar sesión. Si sigue pasando, escribe a soporte.',
  servicio: 'El servicio de cuentas no responde. Intenta en unos minutos.',
  limite: 'Hiciste demasiados intentos. Espera un momento para volver a intentarlo.',
  google: 'No pudimos entrar con Google.',
  otp: 'El código no es correcto o ya venció. Revísalo o pide otro.',
  otpLimite: 'Fallaste el código 3 veces. Espera un momento y pide otro.',
  otpVencido: 'El código venció. Pide uno nuevo.',
  otpEsperaReenvio: 'Espera un momento para pedir un código nuevo.',
  registro: 'No pudimos crear la cuenta con esos datos.',
  campos: 'Revisa los datos marcados.',
} as const

/** Segundos de espera cuando el servidor responde 429 sin decir cuánto (SR-RF-02 y SR-RF-92 usan 60). */
export const ESPERA_429 = 60

/** Espera que pide el servidor (retryAfterSeconds o Retry-After, F-05); si no la manda, 60 segundos. */
export const esperaDe = (e: unknown): number =>
  e instanceof ApiError && e.retryAfterSeconds !== undefined ? e.retryAfterSeconds : ESPERA_429

const codigoDe = (e: unknown) => (e instanceof ApiError ? e.code?.toUpperCase() : undefined)

export type ErrorAcceso = {
  /** Mensaje general; vacío cuando todo está en los campos. */
  mensaje: string
  /** Errores por campo del servidor (400 · 422). */
  campos: CamposConError
  /** Segundos que el botón queda bloqueado (429). */
  esperar: number
  /** El servicio no respondió: se ofrece Reintentar. */
  reintentar: boolean
}

/** Traduce el error del inicio de sesión con correo al mensaje que pide el plan. */
export function errorDeLogin(e: unknown): ErrorAcceso {
  const campos = fieldErrors(e)
  const base: ErrorAcceso = { mensaje: '', campos: {}, esperar: 0, reintentar: false }
  switch (errorKind(e)) {
    case 'datos': return Object.keys(campos).length ? { ...base, campos } : { ...base, mensaje: TEXTOS_ACCESO.credenciales }
    // 401 y 404 dicen lo mismo: así no se puede saber si el correo tiene cuenta.
    case 'sesion':
    case 'no-existe': return { ...base, mensaje: TEXTOS_ACCESO.credenciales }
    case 'permiso': return { ...base, mensaje: TEXTOS_ACCESO.bloqueada }
    case 'limite': return {
      ...base,
      // FA-15: correo sin verificar y aún corre la espera tras 3 códigos equivocados.
      mensaje: codigoDe(e) === 'OTP_RESEND_BLOCKED' ? TEXTOS_ACCESO.otpEsperaReenvio : TEXTOS_ACCESO.limite,
      esperar: esperaDe(e),
    }
    case 'sin-conexion': return { ...base, mensaje: MENSAJES['sin-conexion'], reintentar: true }
    default: return { ...base, mensaje: TEXTOS_ACCESO.servicio, reintentar: true }
  }
}

export type ErrorOtp = {
  mensaje: string
  /** Segundos que quedan bloqueados Confirmar y Pedir otro código. */
  esperar: number
  /** La verificación ya no existe (OTP_SESSION_NOT_FOUND) o se acabaron los reenvíos: hay que iniciar sesión otra vez. */
  volverAlLogin: boolean
}

/** F-04: mensaje del código OTP según el `code` de ms-auth (SR-RF-92), en lugar del «Tu sesión venció» genérico. */
export function errorDeOtp(e: unknown): ErrorOtp {
  const base: ErrorOtp = { mensaje: TEXTOS_ACCESO.otp, esperar: 0, volverAlLogin: false }
  switch (codigoDe(e)) {
    case 'OTP_INCORRECT': {
      const n = e instanceof ApiError ? e.attemptsRemaining : undefined
      if (n === undefined) return base
      return { ...base, mensaje: `El código no es correcto. Te ${n === 1 ? 'queda 1 intento' : `quedan ${n} intentos`}.` }
    }
    case 'OTP_EXPIRED': return { ...base, mensaje: TEXTOS_ACCESO.otpVencido }
    case 'OTP_ATTEMPTS_EXHAUSTED': return { ...base, mensaje: TEXTOS_ACCESO.otpLimite, esperar: esperaDe(e) }
    case 'OTP_RESEND_BLOCKED': return { ...base, mensaje: TEXTOS_ACCESO.otpEsperaReenvio, esperar: esperaDe(e) }
    case 'OTP_SESSION_NOT_FOUND': return { ...base, mensaje: MENSAJES_POR_CODIGO.OTP_SESSION_NOT_FOUND, volverAlLogin: true }
    case 'RESENDS_EXHAUSTED': return { ...base, mensaje: MENSAJES_POR_CODIGO.RESENDS_EXHAUSTED, volverAlLogin: true }
  }
  switch (errorKind(e)) {
    case 'limite': return { ...base, mensaje: TEXTOS_ACCESO.limite, esperar: esperaDe(e) }
    case 'sin-conexion': return { ...base, mensaje: MENSAJES['sin-conexion'] }
    case 'servidor': return { ...base, mensaje: TEXTOS_ACCESO.servicio }
    case 'datos': return { ...base, mensaje: fieldErrors(e).otpCode ?? TEXTOS_ACCESO.otp }
    default: return base
  }
}

/** Google: si el servicio está caído se dice eso; cualquier otro fallo o cancelación, el texto del plan. */
export function errorDeGoogle(e: unknown): string {
  const kind = errorKind(e)
  if (kind === 'servidor') return TEXTOS_ACCESO.servicio
  if (kind === 'limite') return TEXTOS_ACCESO.limite
  return TEXTOS_ACCESO.google
}

/** Nombres que puede usar el servidor para los campos del registro → los del formulario. */
const CAMPOS_REGISTRO: Record<string, 'nombre' | 'email' | 'barrio' | 'password'> = {
  nombre: 'nombre', name: 'nombre', fullName: 'nombre',
  email: 'email', correo: 'email',
  password: 'password', contrasena: 'password', contraseña: 'password',
  neighborhood: 'barrio', barrio: 'barrio',
}

export function camposDeRegistro(campos: CamposConError): Partial<Record<'nombre' | 'email' | 'barrio' | 'password', string>> {
  const out: Partial<Record<'nombre' | 'email' | 'barrio' | 'password', string>> = {}
  for (const [k, v] of Object.entries(campos)) { const c = CAMPOS_REGISTRO[k]; if (c && !out[c]) out[c] = v }
  return out
}
