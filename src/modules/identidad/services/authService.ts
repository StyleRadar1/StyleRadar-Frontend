import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mocks/demoAccounts'
import type { LoginRequestDto, LoginResponseDto } from '../types/auth.dto'

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
}
