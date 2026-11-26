import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aApiError, ApiError } from '@/modules/core/api/apiClient'
import { aResultado, aSesion } from '../services/authService'
import { errorDeLogin, errorDeOtp, errorDeRegistro, TEXTOS_ACCESO } from '../utils/erroresAcceso'

const conCodigo = (status: number, code: string, extra: Partial<Pick<ApiError, 'attemptsRemaining' | 'retryAfterSeconds'>> = {}) =>
  Object.assign(new ApiError(status, '', code), extra)

describe('respuesta del login de ms-auth (F-01 · F-28)', () => {
  it('arma la sesión con accessToken, userId, roles[0] y email de la raíz', () => {
    const user = aSesion({ accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 3600, userId: 42, roles: ['STORE_ADMIN'], email: 'luna@correo.com', emailVerified: true, otpRequired: false })
    expect(user).toEqual({ id: '42', name: 'luna', email: 'luna@correo.com', role: 'STORE_ADMIN' })
  })

  it('con otpRequired y sin token pide el código en vez de iniciar sesión', () => {
    const r = aResultado({ accessToken: null, userId: 7, roles: ['BUYER'], email: 'nuevo@correo.com', emailVerified: false, otpRequired: true, otpExpiresInSeconds: 300, otpAttemptsRemaining: 3 }, 'nuevo@correo.com')
    expect(r).toEqual({ kind: 'otp', email: 'nuevo@correo.com', expiresInSeconds: 300, attemptsRemaining: 3 })
  })

  it('sin token ni rol válido no deja una sesión a medias', () => {
    expect(() => aSesion({ accessToken: null, userId: 1, roles: ['BUYER'], email: 'a@b.co' })).toThrow()
    expect(() => aSesion({ accessToken: 'jwt', userId: 1, roles: ['ROOT'], email: 'a@b.co' })).toThrow()
  })
})

describe('mensajes del código OTP por code (F-04 · F-05 · F-29)', () => {
  it('OTP_INCORRECT dice cuántos intentos quedan', () => {
    expect(errorDeOtp(conCodigo(401, 'OTP_INCORRECT', { attemptsRemaining: 2 })).mensaje).toBe('El código no es correcto. Te quedan 2 intentos.')
    expect(errorDeOtp(conCodigo(401, 'OTP_INCORRECT', { attemptsRemaining: 1 })).mensaje).toBe('El código no es correcto. Te queda 1 intento.')
  })

  it('OTP_EXPIRED pide un código nuevo', () => {
    expect(errorDeOtp(conCodigo(401, 'OTP_EXPIRED')).mensaje).toBe(TEXTOS_ACCESO.otpVencido)
  })

  it('OTP_ATTEMPTS_EXHAUSTED y OTP_RESEND_BLOCKED esperan lo que dice el servidor', () => {
    expect(errorDeOtp(conCodigo(429, 'OTP_ATTEMPTS_EXHAUSTED', { retryAfterSeconds: 60 }))).toMatchObject({ mensaje: TEXTOS_ACCESO.otpLimite, esperar: 60 })
    expect(errorDeOtp(conCodigo(429, 'OTP_RESEND_BLOCKED', { retryAfterSeconds: 42 })).esperar).toBe(42)
  })

  it('OTP_SESSION_NOT_FOUND y RESENDS_EXHAUSTED vuelven al inicio de sesión', () => {
    expect(errorDeOtp(conCodigo(401, 'OTP_SESSION_NOT_FOUND')).volverAlLogin).toBe(true)
    expect(errorDeOtp(conCodigo(429, 'RESENDS_EXHAUSTED', { retryAfterSeconds: 0 }))).toMatchObject({ volverAlLogin: true, esperar: 0 })
  })

  it('el 429 del login usa la espera del servidor y, si no viene, 60 segundos', () => {
    expect(errorDeLogin(conCodigo(429, 'RATE_LIMIT_EXCEEDED', { retryAfterSeconds: 30 })).esperar).toBe(30)
    expect(errorDeLogin(new ApiError(429, '')).esperar).toBe(60)
  })
})

describe('401 sin sesión (contraseña mala, código equivocado)', () => {
  beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  const r401 = () => {
    const config = { headers: new AxiosHeaders(), url: '/api/v1/auth/login', method: 'post' }
    return new AxiosError('fallo', 'ERR', config, null, { status: 401, statusText: '', data: { code: 'INVALID_CREDENTIALS' }, headers: {}, config })
  }

  it('sin token no avisa «sesión vencida» (evita el logout sin fin)', () => {
    const aviso = vi.fn()
    window.addEventListener('sr:sesion-expirada', aviso)
    aApiError(r401())
    window.removeEventListener('sr:sesion-expirada', aviso)
    expect(aviso).not.toHaveBeenCalled()
  })

  it('con token sí avisa y limpia la sesión', () => {
    localStorage.setItem('sr_token', 'jwt')
    const aviso = vi.fn()
    window.addEventListener('sr:sesion-expirada', aviso)
    aApiError(r401())
    window.removeEventListener('sr:sesion-expirada', aviso)
    expect(aviso).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('sr_token')).toBeNull()
  })
})

describe('errores de Crear cuenta (SR-RF-01)', () => {
  const invalido = (errors: Record<string, string>) => new ApiError(400, 'La solicitud contiene datos inválidos', errors, 'INVALID_DATA')

  it('muestra el mensaje de ms-usuarios del campo inválido, no uno genérico ni el del login', () => {
    expect(errorDeRegistro(invalido({ email: 'El formato del email es inválido' })).mensaje).toBe('El formato del email es inválido')
    expect(errorDeRegistro(invalido({ email: 'El dominio del correo no es válido' })).mensaje).toBe('El dominio del correo no es válido')
    expect(errorDeRegistro(invalido({ password: 'La contraseña debe tener entre 8 y 30 caracteres', name: 'El nombre es obligatorio' })).mensaje).toBe('El nombre es obligatorio')
    expect(errorDeRegistro(new ApiError(400, '', 'INVALID_DATA')).mensaje).not.toBe(TEXTOS_ACCESO.credenciales)
  })

  it('el correo ya registrado (409) no dice que el servicio está caído ni confirma que el correo existe', () => {
    const r = errorDeRegistro(new ApiError(409, 'El correo electrónico laura@ejemplo.com ya se encuentra registrado', 'EMAIL_ALREADY_REGISTERED'))
    expect(r.mensaje).toBe(TEXTOS_ACCESO.registro)
    expect(r.mensaje).not.toContain('@')
  })

  it('lee el ProblemDetail de ms-usuarios tal como llega (code y errors.email)', () => {
    const config = { headers: new AxiosHeaders(), url: '/api/v1/users', method: 'post' }
    const ax = new AxiosError('fallo', 'ERR', config, null, { status: 400, statusText: '', headers: {}, config,
      data: { type: 'https://api.styleradar.com/errors/invalid-data', title: 'Bad Request', status: 400, detail: 'La solicitud contiene datos inválidos', code: 'INVALID_DATA', errors: { email: 'El formato del email es inválido' } } })
    expect(errorDeRegistro(aApiError(ax)).mensaje).toBe('El formato del email es inválido')
  })

  it('si falla el login que sigue al registro, usa los mensajes del login', () => {
    expect(errorDeRegistro(conCodigo(401, 'INVALID_CREDENTIALS')).mensaje).toBe(TEXTOS_ACCESO.credenciales)
    expect(errorDeRegistro(conCodigo(503, 'SERVICE_UNAVAILABLE')).reintentar).toBe(true)
  })
})
