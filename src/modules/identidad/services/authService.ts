import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mocks/demoAccounts'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { aRol } from '@/modules/core/types/roles'
import type {
  GoogleLoginRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  LoginResult,
  RegisterRequestDto,
  ResendOtpRequestDto,
  ResendOtpResponseDto,
  UserSessionDto,
  VerifyOtpRequestDto,
} from '../types/auth.dto'
import { agregarUsuarioMock } from './usuarioService'
import { TEXTOS_ACCESO } from '../utils/erroresAcceso'

/**
 * Correos de demostración para ver los errores del inicio de sesión sin backend
 * (solo con datos de prueba): cuenta bloqueada (403), demasiados intentos (429) y servicio caído (503).
 */
export const DEMO_ERRORES: Record<string, [number, string]> = {
  'bloqueada@styleradar.co': [403, TEXTOS_ACCESO.bloqueada],
  'muchos-intentos@styleradar.co': [429, TEXTOS_ACCESO.limite],
  'caido@styleradar.co': [503, TEXTOS_ACCESO.servicio],
}

/* Cuentas creadas con el registro mientras se usan datos de prueba. */
let registradas: (UserSessionDto & { password: string })[] = []

/**
 * Cuenta de demostración con el correo sin verificar (SR-RF-02 FA-13): al entrar pide el código OTP.
 * Contraseña 1234, código 123456 (000000 hace de código equivocado).
 */
export const DEMO_SIN_VERIFICAR: UserSessionDto = { id: 'u-nv', name: 'Camilo Prueba', email: 'sin-verificar@styleradar.co', role: 'BUYER' }

/* Estado del código OTP de cada correo en modo demostración: 3 intentos por código y 3 reenvíos (SR-RF-92). */
const OTP_INTENTOS = 3
const OTP_REENVIOS = 3
const OTP_SEGUNDOS = 300
const OTP_ESPERA = 60
let otpMock: Record<string, { intentos: number; reenvios: number }> = {}
const otpDe = (email: string) => (otpMock[email] ??= { intentos: OTP_INTENTOS, reenvios: OTP_REENVIOS })

export function resetRegistrosMock() { registradas = []; otpMock = {} }

/** Respuesta con el formato de ms-auth para una sesión iniciada (modo demostración). */
const sesionMock = (user: UserSessionDto): LoginResponseDto => ({
  accessToken: `demo-${user.id}`,
  tokenType: 'Bearer',
  expiresIn: 3600,
  userId: user.id,
  roles: [user.role],
  email: user.email,
  emailVerified: true,
  otpRequired: false,
  name: user.name,
})

/** Error con `code` y datos extra, igual al que arma apiClient con un ProblemDetail del servidor. */
const errorMock = (status: number, code: string, extra: { attemptsRemaining?: number; retryAfterSeconds?: number } = {}) => {
  const e = new ApiError(status, '', code)
  Object.assign(e, extra)
  return e
}

/**
 * Arma la sesión del front con la respuesta de ms-auth (F-01): accessToken, userId, roles[0] y email en la raíz.
 * El contrato no trae el nombre: mientras no se lea el perfil se muestra la parte del correo antes de la @.
 */
export function aSesion(res: LoginResponseDto): UserSessionDto {
  const role = aRol(Array.isArray(res.roles) ? res.roles[0] : undefined)
  if (!res.accessToken || !role || res.userId === undefined || res.userId === null) {
    throw new ApiError(0, TEXTOS_ACCESO.servicio)
  }
  const email = res.email ?? ''
  return { id: String(res.userId), name: res.name?.trim() || email.split('@')[0] || email, email, role }
}

/** Decide si la respuesta del login ya trae la sesión o si primero hay que ingresar el código OTP. */
export function aResultado(res: LoginResponseDto, email: string): LoginResult {
  if (res.otpRequired && !res.accessToken) {
    return { kind: 'otp', email: res.email || email, expiresInSeconds: res.otpExpiresInSeconds, attemptsRemaining: res.otpAttemptsRemaining }
  }
  return { kind: 'session', user: aSesion(res) }
}

/** En modo demostración el «token» de Google es el correo elegido en el selector de cuentas. */
export const DEMO_GOOGLE_PREFIX = 'demo-google:'

export const authService = {
  async login(payload: LoginRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      failIfScenario()
      const email = payload.email.trim().toLowerCase()
      const demoError = DEMO_ERRORES[email]
      if (demoError) throw new ApiError(...demoError)
      const nueva = registradas.find((a) => a.email === email)
      if (nueva) {
        if (payload.password !== nueva.password) throw new ApiError(401, TEXTOS_ACCESO.credenciales)
        const { password: _omit, ...user } = nueva
        return mockDelay(sesionMock(user))
      }
      if (email === DEMO_SIN_VERIFICAR.email && payload.password === DEMO_PASSWORD) {
        otpMock[email] = { intentos: OTP_INTENTOS, reenvios: OTP_REENVIOS }
        return mockDelay({
          accessToken: null, userId: DEMO_SIN_VERIFICAR.id, roles: [DEMO_SIN_VERIFICAR.role], email,
          emailVerified: false, otpRequired: true, otpExpiresInSeconds: OTP_SEGUNDOS, otpAttemptsRemaining: OTP_INTENTOS,
          message: 'Código de verificación OTP enviado a su correo electrónico',
        })
      }
      const user = DEMO_ACCOUNTS.find((a) => a.email === email)
      // Nunca se dice si el correo tiene cuenta: el mismo 401 para los dos casos.
      if (!user || payload.password !== DEMO_PASSWORD) throw new ApiError(401, TEXTOS_ACCESO.credenciales)
      return mockDelay(sesionMock(user))
    }
    return apiClient.post<LoginResponseDto>('/api/v1/auth/login', payload).then((res) => res.data)
  },

  /** RF-01: crea la cuenta y devuelve la sesión iniciada o pide verificación OTP. */
  async register(payload: RegisterRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      failIfScenario()
      const email = payload.email.trim().toLowerCase()
      if (DEMO_ACCOUNTS.some((a) => a.email === email) || registradas.some((a) => a.email === email)) {
        throw new ApiError(409, TEXTOS_ACCESO.registro)
      }
      const role = payload.role ?? 'BUYER'
      const user: UserSessionDto = { id: `u-n${registradas.length + 1}`, name: payload.nombre.trim(), email, role }
      registradas.push({ ...user, password: payload.password })
      agregarUsuarioMock({
        id: user.id, nombre: user.name, correo: email, rol: role, plan: 'RADAR', estado: 'ACTIVA', barrio: '',
        miembroDesde: new Date().toISOString().slice(0, 10),
      })
      return mockDelay(sesionMock(user), 500)
    }

    // Backend real: registro en ms-usuarios (aceptaHabeasData) y luego autenticación
    const userPayload = {
      nombre: payload.nombre.trim(),
      email: payload.email.trim(),
      password: payload.password,
      telefono: payload.telefono?.trim() || '3000000000',
      aceptaHabeasData: payload.aceptaHabeasData ?? payload.aceptaTerminos ?? true,
    }
    await apiClient.post('/api/v1/usuarios', userPayload)
    return this.login({ email: payload.email, password: payload.password })
  },

  /** SR-RF-92: verifica el código OTP (6 dígitos, 5 minutos, 3 intentos). */
  async verifyOtp(payload: VerifyOtpRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      const email = payload.email.trim().toLowerCase()
      const otp = otpDe(email)
      // Demostración: el código 000000 hace de código equivocado.
      if (payload.otpCode === '000000') {
        otp.intentos -= 1
        if (otp.intentos <= 0) {
          otp.intentos = OTP_INTENTOS
          throw errorMock(429, 'OTP_ATTEMPTS_EXHAUSTED', { retryAfterSeconds: OTP_ESPERA })
        }
        throw errorMock(401, 'OTP_INCORRECT', { attemptsRemaining: otp.intentos })
      }
      delete otpMock[email]
      const user = registradas.find((a) => a.email === email) || DEMO_ACCOUNTS.find((a) => a.email === email)
        || (email === DEMO_SIN_VERIFICAR.email ? DEMO_SIN_VERIFICAR : DEMO_ACCOUNTS[0])
      return mockDelay(sesionMock(user))
    }
    return apiClient.post<LoginResponseDto>('/api/v1/auth/otp/verify', payload).then((res) => res.data)
  },

  /** SR-RF-92: pide un código nuevo (máximo 3 reenvíos por verificación). */
  async resendOtp(payload: ResendOtpRequestDto): Promise<ResendOtpResponseDto> {
    if (env.useMocks) {
      const otp = otpDe(payload.email.trim().toLowerCase())
      if (otp.reenvios <= 0) throw errorMock(429, 'RESENDS_EXHAUSTED', { retryAfterSeconds: 0 })
      otp.reenvios -= 1
      otp.intentos = OTP_INTENTOS
      return mockDelay({
        message: 'Se envió un código de verificación de 6 dígitos a su correo registrado',
        expiresInSeconds: OTP_SEGUNDOS,
        attemptsRemaining: OTP_INTENTOS,
        resendsRemaining: otp.reenvios,
      })
    }
    return apiClient.post<ResendOtpResponseDto>('/api/v1/auth/otp/resend', payload).then((res) => res.data)
  },

  /**
   * Cierre formal de sesión en ms-auth. Necesita el token (Bearer): se pasa el que había antes de limpiar
   * la sesión, porque para cuando sale la petición el almacenamiento ya está vacío.
   */
  async logout(token: string | null = tokenStorage.get()): Promise<void> {
    if (env.useMocks || !token) return
    return apiClient
      .post('/api/v1/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => undefined)
      .catch(() => undefined)
  },

  /** P14: ingreso con Google */
  async google(payload: GoogleLoginRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      const email = payload.idToken.startsWith(DEMO_GOOGLE_PREFIX) ? payload.idToken.slice(DEMO_GOOGLE_PREFIX.length).trim().toLowerCase() : ''
      const user = DEMO_ACCOUNTS.find((a) => a.email === email)
      if (!user) throw new ApiError(401, TEXTOS_ACCESO.google)
      return mockDelay(sesionMock(user))
    }
    return apiClient.post<LoginResponseDto>('/api/v1/auth/oauth2/google', payload).then((res) => res.data)
  },

  /** Recuperación de contraseña (envío de enlace o token a correo) */
  async recoverPassword(email: string): Promise<{ mensaje: string }> {
    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new ApiError(400, 'Ingresa un correo electrónico válido.')
    }
    if (env.useMocks) {
      return mockDelay({
        mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      }, 350)
    }
    return apiClient
      .post<{ mensaje: string }>('/api/v1/auth/password/recuperar', { email: cleanEmail })
      .then((res) => res.data)
  },
}
