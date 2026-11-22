import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aApiError } from '../api/apiClient'
import { errorMessage } from '../api/errors'

const respuesta = (status: number, data: unknown, headers: Record<string, string> = {}) => {
  const config = { headers: new AxiosHeaders(), url: '/api/v1/auth/otp/verify', method: 'post' }
  return new AxiosError('fallo', 'ERR', config, null, { status, statusText: '', data, headers: new AxiosHeaders(headers), config })
}

describe('contrato de errores en inglés (F-02 · F-25 · F-29)', () => {
  beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear() })

  it('lee attemptsRemaining del ProblemDetail', () => {
    const e = aApiError(respuesta(400, { code: 'OTP_INCORRECT', attemptsRemaining: 2 }))
    expect(e.code).toBe('OTP_INCORRECT')
    expect(e.attemptsRemaining).toBe(2)
    expect(errorMessage(e)).toBe('El código no es correcto. Revísalo e intenta de nuevo.')
  })

  it('lee retryAfterSeconds del cuerpo y, si no viene, la cabecera Retry-After', () => {
    expect(aApiError(respuesta(429, { code: 'OTP_ATTEMPTS_EXHAUSTED', retryAfterSeconds: 45 })).retryAfterSeconds).toBe(45)
    expect(aApiError(respuesta(429, { code: 'RATE_LIMIT_EXCEEDED' }, { 'Retry-After': '60' })).retryAfterSeconds).toBe(60)
  })

  it('sin datos de espera ni intentos los deja vacíos', () => {
    const e = aApiError(respuesta(429, {}))
    expect(e.retryAfterSeconds).toBeUndefined()
    expect(e.attemptsRemaining).toBeUndefined()
  })

  it('RESENDS_EXHAUSTED con 0 segundos se conserva como 0', () => {
    expect(aApiError(respuesta(429, { code: 'RESENDS_EXHAUSTED', retryAfterSeconds: 0 })).retryAfterSeconds).toBe(0)
  })

  it('textos propios para 413 y BUSINESS_RULE_VIOLATION', () => {
    expect(errorMessage(aApiError(respuesta(413, { code: 'FILE_TOO_LARGE' })))).toBe('El archivo es muy grande. Elige uno más liviano.')
    expect(errorMessage(aApiError(respuesta(400, { code: 'BUSINESS_RULE_VIOLATION', detail: 'nit 900123 ...' })))).not.toMatch(/900123/)
  })
})
