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

/** Orden en que se muestran los errores por campo del registro (SR-RF-01 · EX-01 a EX-12). */
const ORDEN_CAMPOS_REGISTRO = ['name', 'nombre', 'email', 'correo', 'password', 'phone', 'neighborhood', 'barrio', 'dataPolicyAccepted'] as const

/** Códigos que solo puede mandar el inicio de sesión que sigue al registro (la cuenta ya se creó). */
const CODIGOS_DEL_LOGIN = new Set(['INVALID_CREDENTIALS', 'ACCOUNT_NOT_ACTIVE', 'OTP_RESEND_BLOCKED'])

/**
 * SR-RF-01: error de «Crear cuenta» (POST /api/v1/users y el login que sigue).
 * - 400 INVALID_DATA: se muestra el mensaje de ms-usuarios del primer campo con error
 *   («El formato del email es inválido», «El dominio del correo no es válido»…), no uno genérico.
 * - 409 EMAIL_ALREADY_REGISTERED: el texto seguro del plan, sin confirmar que el correo tiene cuenta.
 * - Si el error viene del login que sigue al registro, se trata como error del login.
 */
export function errorDeRegistro(e: unknown): ErrorAcceso {
  if (CODIGOS_DEL_LOGIN.has(codigoDe(e) ?? '')) return errorDeLogin(e)
  const base: ErrorAcceso = { mensaje: '', campos: {}, esperar: 0, reintentar: false }
  const campos = fieldErrors(e)
  switch (errorKind(e)) {
    case 'datos': {
      const clave = ORDEN_CAMPOS_REGISTRO.find((k) => campos[k]) ?? Object.keys(campos)[0]
      return { ...base, campos, mensaje: clave ? campos[clave] : MENSAJES.datos }
    }
    case 'conflicto': return { ...base, mensaje: TEXTOS_ACCESO.registro }
    case 'limite': return { ...base, mensaje: TEXTOS_ACCESO.limite, esperar: esperaDe(e) }
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

/**
 * Restablecer contraseña (ms-auth · POST /api/v1/auth/password/forgot y /reset).
 * Regla de ms-usuarios: de 8 a 72 caracteres, con minúscula, mayúscula, número y símbolo; el espacio no cuenta como símbolo.
 */
export const CLAVE_NUEVA_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,72}$/

export const TEXTOS_RESTABLECER = {
  correo: 'Ingresa un correo electrónico válido.',
  codigo: 'Ingresa el código de 6 dígitos que llegó a tu correo.',
  clave: 'Usa de 8 a 72 caracteres, con al menos una minúscula, una mayúscula, un número y un símbolo (el espacio no cuenta).',
  noCoinciden: 'Las contraseñas no coinciden.',
  vencido: 'El código expiró o no existe. Solicita uno nuevo.',
  inactiva: 'Tu cuenta no está activa.',
  agotado: 'Se agotaron los 3 intentos. Espera un momento y pide un código nuevo.',
  limite: 'Intenta de nuevo en un momento.',
  servicio: 'No pudimos completar la solicitud. Intenta de nuevo.',
} as const

type CampoRestablecer = 'email' | 'otpCode' | 'newPassword'
const CAMPOS_RESTABLECER: readonly CampoRestablecer[] = ['email', 'otpCode', 'newPassword']

export type ErrorRestablecer = {
  /** Mensaje general; vacío cuando todo está en los campos. */
  mensaje: string
  /** Mensajes del servidor por campo (400 INVALID_DATA), para mostrarlos bajo cada campo. */
  campos: Partial<Record<CampoRestablecer, string>>
  /** Segundos que el botón queda bloqueado (429). */
  esperar: number
  /** El código ya no sirve (OTP_EXPIRED u OTP_ATTEMPTS_EXHAUSTED): hay que pedir otro con «Reenviar código». */
  pedirCodigo: boolean
  /** Cuenta inactiva o bloqueada: se muestra el enlace a soporte. */
  soporte: boolean
  /** El servicio no respondió: se puede reintentar. */
  reintentar: boolean
}

/** Error de «¿Olvidaste tu contraseña?» y de «Cambiar contraseña», decidido por `code` y nunca por el texto. */
export function errorDeRestablecer(e: unknown): ErrorRestablecer {
  const base: ErrorRestablecer = { mensaje: '', campos: {}, esperar: 0, pedirCodigo: false, soporte: false, reintentar: false }
  switch (codigoDe(e)) {
    case 'OTP_INCORRECT': {
      const n = e instanceof ApiError ? e.attemptsRemaining : undefined
      return {
        ...base,
        mensaje: n === undefined ? 'Código incorrecto.' : `Código incorrecto, te ${n === 1 ? 'queda 1 intento' : `quedan ${n} intentos`}.`,
      }
    }
    case 'OTP_EXPIRED': return { ...base, mensaje: TEXTOS_RESTABLECER.vencido, pedirCodigo: true }
    case 'ACCOUNT_NOT_ACTIVE': return { ...base, mensaje: TEXTOS_RESTABLECER.inactiva, soporte: true }
    case 'OTP_ATTEMPTS_EXHAUSTED': return { ...base, mensaje: TEXTOS_RESTABLECER.agotado, esperar: esperaDe(e), pedirCodigo: true }
    case 'RATE_LIMIT_EXCEEDED': return { ...base, mensaje: TEXTOS_RESTABLECER.limite, esperar: esperaDe(e) }
  }
  switch (errorKind(e)) {
    case 'datos': {
      const todos = fieldErrors(e)
      const campos: ErrorRestablecer['campos'] = {}
      for (const k of CAMPOS_RESTABLECER) if (todos[k]) campos[k] = todos[k]
      return { ...base, campos, mensaje: Object.keys(campos).length ? '' : MENSAJES.datos }
    }
    case 'limite': return { ...base, mensaje: TEXTOS_RESTABLECER.limite, esperar: esperaDe(e) }
    case 'sin-conexion': return { ...base, mensaje: MENSAJES['sin-conexion'], reintentar: true }
    default: return { ...base, mensaje: TEXTOS_RESTABLECER.servicio, reintentar: true }
  }
}
