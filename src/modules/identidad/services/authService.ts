import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mocks/demoAccounts'
import type { GoogleLoginRequestDto, LoginRequestDto, LoginResponseDto, RegisterRequestDto, UserSessionDto } from '../types/auth.dto'
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
export function resetRegistrosMock() { registradas = [] }

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
        return mockDelay({ token: `demo-${user.id}`, user })
      }
      const user = DEMO_ACCOUNTS.find((a) => a.email === email)
      // Nunca se dice si el correo tiene cuenta: el mismo 401 para los dos casos.
      if (!user || payload.password !== DEMO_PASSWORD) throw new ApiError(401, TEXTOS_ACCESO.credenciales)
      return mockDelay({ token: `demo-${user.id}`, user })
    }
    return apiClient.post<LoginResponseDto>('/api/auth/login', payload).then((res) => res.data)
  },

  /** RF-01: crea la cuenta y devuelve la sesión iniciada. */
  async register(payload: RegisterRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      failIfScenario()
      const email = payload.email.trim().toLowerCase()
      if (DEMO_ACCOUNTS.some((a) => a.email === email) || registradas.some((a) => a.email === email)) {
        throw new ApiError(409, TEXTOS_ACCESO.registro)
      }
      const user: UserSessionDto = { id: `u-n${registradas.length + 1}`, name: payload.nombre.trim(), email, role: 'COMPRADOR' }
      registradas.push({ ...user, password: payload.password })
      agregarUsuarioMock({
        id: user.id, nombre: user.name, correo: email, rol: 'COMPRADOR', plan: 'RADAR', estado: 'ACTIVA', barrio: '',
        miembroDesde: new Date().toISOString().slice(0, 10),
      })
      return mockDelay({ token: `demo-${user.id}`, user }, 500)
    }
    return apiClient.post<LoginResponseDto>('/api/auth/registro', payload).then((res) => res.data)
  },

  /** P14: reemplaza la verificación con código OTP. Ruta provisional hasta tener el Swagger de ms-auth. */
  async google(payload: GoogleLoginRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      const email = payload.idToken.startsWith(DEMO_GOOGLE_PREFIX) ? payload.idToken.slice(DEMO_GOOGLE_PREFIX.length).trim().toLowerCase() : ''
      const user = DEMO_ACCOUNTS.find((a) => a.email === email)
      if (!user) throw new ApiError(401, TEXTOS_ACCESO.google)
      return mockDelay({ token: `demo-${user.id}`, user })
    }
    return apiClient.post<LoginResponseDto>('/api/auth/google', payload).then((res) => res.data)
  },
}
