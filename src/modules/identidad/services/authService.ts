import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mocks/demoAccounts'
import type {
  GoogleLoginRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  ResendOtpRequestDto,
  ResendOtpResponseDto,
  UserSessionDto,
  VerifyOtpRequestDto,
} from '../types/auth.dto'
import { agregarUsuarioMock } from './usuarioService'

/* Cuentas creadas con el registro mientras se usan datos de prueba. */
let registradas: (UserSessionDto & { password: string })[] = []
export function resetRegistrosMock() { registradas = [] }

/** En modo demostración el «token» de Google es el correo elegido en el selector de cuentas. */
export const DEMO_GOOGLE_PREFIX = 'demo-google:'

export const authService = {
  async login(payload: LoginRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      const email = payload.email.trim().toLowerCase()
      const nueva = registradas.find((a) => a.email === email)
      if (nueva) {
        if (payload.password !== nueva.password) throw new ApiError(401, 'La contraseña no coincide.')
        const { password: _omit, ...user } = nueva
        return mockDelay({ token: `demo-${user.id}`, user })
      }
      const user = DEMO_ACCOUNTS.find((a) => a.email === email)
      if (!user) throw new ApiError(404, 'No encontramos una cuenta con ese correo.')
      if (payload.password !== DEMO_PASSWORD) throw new ApiError(401, 'La contraseña no coincide.')
      return mockDelay({ token: `demo-${user.id}`, user })
    }
    return apiClient.post<LoginResponseDto>('/api/v1/auth/login', payload).then((res) => res.data)
  },

  /** RF-01: crea la cuenta y devuelve la sesión iniciada o pide verificación OTP. */
  async register(payload: RegisterRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      failIfScenario()
      const email = payload.email.trim().toLowerCase()
      if (DEMO_ACCOUNTS.some((a) => a.email === email) || registradas.some((a) => a.email === email)) {
        throw new ApiError(409, 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.')
      }
      const user: UserSessionDto = { id: `u-n${registradas.length + 1}`, name: payload.nombre.trim(), email, role: 'COMPRADOR' }
      registradas.push({ ...user, password: payload.password })
      agregarUsuarioMock({
        id: user.id, nombre: user.name, correo: email, rol: 'COMPRADOR', plan: 'RADAR', estado: 'ACTIVA', barrio: '',
        miembroDesde: new Date().toISOString().slice(0, 10),
      })
      return mockDelay({ token: `demo-${user.id}`, user }, 500)
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

  /** P1: Verificación de código OTP tras registro o inicio de sesión */
  async verifyOtp(payload: VerifyOtpRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      if (payload.codigoOtp === '000000') {
        throw new ApiError(400, 'Código de verificación incorrecto.')
      }
      const email = payload.email.trim().toLowerCase()
      const user = registradas.find((a) => a.email === email) || DEMO_ACCOUNTS[0]
      return mockDelay({ token: `demo-${user.id}`, user })
    }
    return apiClient.post<LoginResponseDto>('/api/v1/auth/otp/verificar', payload).then((res) => res.data)
  },

  /** Reenviar código OTP con espera de 60s */
  async resendOtp(payload: ResendOtpRequestDto): Promise<ResendOtpResponseDto> {
    if (env.useMocks) {
      return mockDelay({
        email: payload.email,
        mensaje: 'Código enviado de nuevo a tu correo.',
        expiraEnSegundos: 300,
        intentosRestantes: 3,
      })
    }
    return apiClient.post<ResendOtpResponseDto>('/api/v1/auth/otp/reenviar', payload).then((res) => res.data)
  },

  /** Cierre formal de sesión en ms-auth */
  async logout(): Promise<void> {
    if (env.useMocks) return
    return apiClient.post('/api/v1/auth/logout').then(() => undefined).catch(() => undefined)
  },

  /** P14: ingreso con Google */
  async google(payload: GoogleLoginRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      const email = payload.idToken.startsWith(DEMO_GOOGLE_PREFIX) ? payload.idToken.slice(DEMO_GOOGLE_PREFIX.length).trim().toLowerCase() : ''
      const user = DEMO_ACCOUNTS.find((a) => a.email === email)
      if (!user) throw new ApiError(404, 'Esa cuenta de Google todavía no está registrada en StyleRadar. Crea tu cuenta primero.')
      return mockDelay({ token: `demo-${user.id}`, user })
    }
    return apiClient.post<LoginResponseDto>('/api/v1/auth/oauth2/google', payload).then((res) => res.data)
  },
}
