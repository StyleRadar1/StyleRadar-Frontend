import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mocks/demoAccounts'
import type { GoogleLoginRequestDto, LoginRequestDto, LoginResponseDto, RegisterRequestDto, UserSessionDto } from '../types/auth.dto'
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
    return apiClient.post<LoginResponseDto>('/api/auth/login', payload).then((res) => res.data)
  },

  /** RF-01: crea la cuenta y devuelve la sesión iniciada. */
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
    return apiClient.post<LoginResponseDto>('/api/auth/registro', payload).then((res) => res.data)
  },

  /** P14: reemplaza la verificación con código OTP. Ruta provisional hasta tener el Swagger de ms-auth. */
  async google(payload: GoogleLoginRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      const email = payload.idToken.startsWith(DEMO_GOOGLE_PREFIX) ? payload.idToken.slice(DEMO_GOOGLE_PREFIX.length).trim().toLowerCase() : ''
      const user = DEMO_ACCOUNTS.find((a) => a.email === email)
      if (!user) throw new ApiError(404, 'Esa cuenta de Google todavía no está registrada en StyleRadar. Crea tu cuenta primero.')
      return mockDelay({ token: `demo-${user.id}`, user })
    }
    return apiClient.post<LoginResponseDto>('/api/auth/google', payload).then((res) => res.data)
  },
}
