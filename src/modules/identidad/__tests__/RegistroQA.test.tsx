import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosError, AxiosHeaders } from 'axios'
import { env } from '@/configs/env'
import { aApiError, apiClient, ApiError } from '@/modules/core/api/apiClient'
import { authService } from '../services/authService'
import { CLAVE_NUEVA_RE, errorDeRegistro, TEXTOS_ACCESO } from '../utils/erroresAcceso'

/** Respuesta de error como la arma axios con el ProblemDetail del servidor. */
function respuesta(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders(), url: '/api/v1/users', method: 'post' }
  return new AxiosError('fallo', 'ERR_BAD_REQUEST', config, {}, { status, statusText: '', headers: {}, config, data })
}

describe('registro en QA (ms-usuarios)', () => {
  const original = env.useMocks
  beforeEach(() => { vi.restoreAllMocks(); (env as { useMocks: boolean }).useMocks = false })
  afterEach(() => { (env as { useMocks: boolean }).useMocks = original; vi.restoreAllMocks() })

  it('la tienda manda accountType "STORE"; comprador y fundación mandan "BUYER"', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { accessToken: null, userId: 1, roles: [], email: 'a@b.co', otpRequired: true } })
    const base = { name: 'Luna Store', email: 'luna@tienda.co', password: 'Clave2026*', dataPolicyAccepted: true }
    await authService.register({ ...base, role: 'STORE_ADMIN' })
    expect(post.mock.calls[0]).toEqual(['/api/v1/users', expect.objectContaining({ accountType: 'STORE' })])
    await authService.register({ ...base, role: 'BUYER' })
    await authService.register({ ...base, role: 'FOUNDATION_REPRESENTATIVE' })
    await authService.register(base)
    const tipos = post.mock.calls.filter(([url]) => url === '/api/v1/users').map(([, body]) => (body as { accountType: string }).accountType)
    expect(tipos).toEqual(['STORE', 'BUYER', 'BUYER', 'BUYER'])
  })

  it('409 EMAIL_ALREADY_REGISTERED muestra el detail del servidor', () => {
    const e = aApiError(respuesta(409, {
      status: 409, code: 'EMAIL_ALREADY_REGISTERED',
      detail: 'El correo electrónico luna@tienda.co ya se encuentra registrado',
      message: 'El correo electrónico luna@tienda.co ya se encuentra registrado',
    }))
    expect(e).toBeInstanceOf(ApiError)
    expect(errorDeRegistro(e).mensaje).toBe('El correo electrónico luna@tienda.co ya se encuentra registrado')
    // Sin detail, el texto del plan.
    expect(errorDeRegistro(aApiError(respuesta(409, { code: 'EMAIL_ALREADY_REGISTERED' }))).mensaje).toBe(TEXTOS_ACCESO.registro)
  })

  it('400 INVALID_DATA: errores por campo y, sin campos, el detail en vez de «Revisa los datos marcados.»', () => {
    const conCampos = errorDeRegistro(aApiError(respuesta(400, {
      code: 'INVALID_DATA', detail: 'Debe incluir mayúscula, minúscula, número y símbolo',
      errors: { password: 'Debe incluir mayúscula, minúscula, número y símbolo' },
    })))
    expect(conCampos.campos).toEqual({ password: 'Debe incluir mayúscula, minúscula, número y símbolo' })
    expect(conCampos.mensaje).toBe('Debe incluir mayúscula, minúscula, número y símbolo')
    const sinCampos = errorDeRegistro(aApiError(respuesta(400, { code: 'INVALID_DATA', message: 'Debe ser BUYER o STORE' })))
    expect(sinCampos.mensaje).toBe('Debe ser BUYER o STORE')
  })

  it('la regla de contraseña del registro es la de ms-usuarios', () => {
    expect(CLAVE_NUEVA_RE.test('Secreta1*')).toBe(true)
    expect(CLAVE_NUEVA_RE.test('secreta123')).toBe(false)
    expect(axios).toBeDefined()
  })
})
