import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mocks/demoAccounts'
import type { GoogleLoginRequestDto, LoginRequestDto, LoginResponseDto } from '../types/auth.dto'

/** En modo demostración el «token» de Google es el correo elegido en el selector de cuentas. */
export const DEMO_GOOGLE_PREFIX = 'demo-google:'

export const authService = {
  async login(payload: LoginRequestDto): Promise<LoginResponseDto> {
    if (env.useMocks) {
      const user = DEMO_ACCOUNTS.find((a) => a.email === payload.email.trim().toLowerCase())
      if (!user) throw new ApiError(404, 'No encontramos una cuenta con ese correo.')
      if (payload.password !== DEMO_PASSWORD) throw new ApiError(401, 'La contraseña no coincide.')
      return mockDelay({ token: `demo-${user.id}`, user })
    }
    return apiClient.post<LoginResponseDto>('/api/auth/login', payload).then((res) => res.data)
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
