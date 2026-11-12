import { errorKind, fieldErrors, MENSAJES, type CamposConError } from '@/modules/core/api/errors'

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
  registro: 'No pudimos crear la cuenta con esos datos.',
  campos: 'Revisa los datos marcados.',
} as const

/** Segundos de espera cuando el servidor responde 429 (el plan no define otro valor). */
export const ESPERA_429 = 60

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
    case 'limite': return { ...base, mensaje: TEXTOS_ACCESO.limite, esperar: ESPERA_429 }
    case 'sin-conexion': return { ...base, mensaje: MENSAJES['sin-conexion'], reintentar: true }
    default: return { ...base, mensaje: TEXTOS_ACCESO.servicio, reintentar: true }
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
const CAMPOS_REGISTRO: Record<string, 'nombre' | 'email' | 'password'> = {
  nombre: 'nombre', name: 'nombre', fullName: 'nombre',
  email: 'email', correo: 'email',
  password: 'password', contrasena: 'password', contraseña: 'password',
}

export function camposDeRegistro(campos: CamposConError): Partial<Record<'nombre' | 'email' | 'password', string>> {
  const out: Partial<Record<'nombre' | 'email' | 'password', string>> = {}
  for (const [k, v] of Object.entries(campos)) { const c = CAMPOS_REGISTRO[k]; if (c && !out[c]) out[c] = v }
  return out
}
