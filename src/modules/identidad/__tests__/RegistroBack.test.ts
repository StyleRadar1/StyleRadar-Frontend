import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { authService } from '../services/authService'

describe('registro contra ms-usuarios (F-06 · SR-RF-01)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('POST /api/v1/users con el cuerpo del contrato, sin teléfono inventado, y luego login', async () => {
    const post = vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
      if (url === '/api/v1/users') return { data: { id: 9 } }
      return { data: { accessToken: null, userId: 9, roles: ['BUYER'], email: 'ana@correo.com', otpRequired: true, otpExpiresInSeconds: 300 } }
    })
    const res = await authService.register({
      name: ' Ana Gómez ', email: 'Ana@Correo.com', password: 'secreta123', neighborhood: ' ', dataPolicyAccepted: true, aceptaTerminos: true, role: 'BUYER',
    })
    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/users', {
      name: 'Ana Gómez', email: 'ana@correo.com', password: 'secreta123', dataPolicyAccepted: true,
    })
    expect(post).toHaveBeenNthCalledWith(2, '/api/v1/auth/login', { email: 'ana@correo.com', password: 'secreta123' })
    expect(res.otpRequired).toBe(true)
  })

  it('envía el barrio y el teléfono solo cuando la persona los escribe', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { accessToken: null, userId: 1, roles: ['BUYER'], email: 'a@b.co', otpRequired: true } })
    await authService.register({ name: 'Ana', email: 'a@b.co', password: 'secreta123', phone: '3001234567', neighborhood: 'Chapinero', dataPolicyAccepted: true })
    expect(post.mock.calls[0][1]).toMatchObject({ phone: '3001234567', neighborhood: 'Chapinero' })
  })

  it('el código OTP va a /otp/verify con otpCode y el reenvío a /otp/resend', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })
    await authService.verifyOtp({ email: 'a@b.co', otpCode: '123456' })
    await authService.resendOtp({ email: 'a@b.co' })
    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/auth/otp/verify', { email: 'a@b.co', otpCode: '123456' })
    expect(post).toHaveBeenNthCalledWith(2, '/api/v1/auth/otp/resend', { email: 'a@b.co' })
  })

  it('el logout manda el token como Bearer', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: undefined })
    await authService.logout('jwt-123')
    expect(post).toHaveBeenCalledWith('/api/v1/auth/logout', undefined, { headers: { Authorization: 'Bearer jwt-123' } })
  })
})
