import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { renderAt } from '@/modules/experiencia/__tests__/helpers'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import { MENSAJE_CLAVE_RESTABLECIDA, MENSAJE_CODIGO_RESTABLECER, resetRegistrosMock } from '../services/authService'
import { CLAVE_NUEVA_RE, errorDeRestablecer, TEXTOS_RESTABLECER } from '../utils/erroresAcceso'

const routes = [{ path: '/restablecer-contrasena', element: <ResetPasswordPage /> }]

async function pedirCodigo(user: ReturnType<typeof userEvent.setup>, correo = 'usuario@styleradar.co') {
  await user.type(screen.getByLabelText(/Correo registrado/i), correo)
  await user.click(screen.getByRole('button', { name: /^Enviar código$/i }))
  return screen.findByLabelText(/^Código/i)
}

async function llenarYEnviar(user: ReturnType<typeof userEvent.setup>, codigo = '123456', clave = 'NuevaClave2026*', confirmacion = clave) {
  await user.clear(screen.getByLabelText(/^Código/i))
  await user.type(screen.getByLabelText(/^Código/i), codigo)
  await user.clear(screen.getByLabelText(/^Nueva contraseña$/i))
  await user.type(screen.getByLabelText(/^Nueva contraseña$/i), clave)
  await user.clear(screen.getByLabelText(/Confirmar nueva contraseña/i))
  await user.type(screen.getByLabelText(/Confirmar nueva contraseña/i), confirmacion)
  await user.click(screen.getByRole('button', { name: /^Cambiar contraseña$/i }))
}

const problema = (status: number, code: string, extra: Partial<ApiError> = {}, fields: Record<string, string> = {}) =>
  Object.assign(new ApiError(status, '', fields, code), extra)

describe('regla de contraseña y errores de restablecer (contrato ms-auth)', () => {
  it('CLAVE_NUEVA_RE: 8 a 72, minúscula, mayúscula, número y símbolo; el espacio no cuenta', () => {
    expect(CLAVE_NUEVA_RE.test('NuevaClave2026*')).toBe(true)
    expect(CLAVE_NUEVA_RE.test('Nueva Clave 2026')).toBe(false)
    expect(CLAVE_NUEVA_RE.test('nuevaclave2026*')).toBe(false)
    expect(CLAVE_NUEVA_RE.test('Aa1*')).toBe(false)
    expect(CLAVE_NUEVA_RE.test(`Aa1*${'x'.repeat(69)}`)).toBe(false)
    expect(CLAVE_NUEVA_RE.test(`Aa1*${'x'.repeat(68)}`)).toBe(true)
  })

  it('decide por code: intentos restantes, código vencido, cuenta inactiva, intentos agotados, límite, campos y servicio caído', () => {
    expect(errorDeRestablecer(problema(401, 'OTP_INCORRECT', { attemptsRemaining: 2 })).mensaje).toBe('Código incorrecto, te quedan 2 intentos.')
    expect(errorDeRestablecer(problema(401, 'OTP_INCORRECT', { attemptsRemaining: 1 })).mensaje).toBe('Código incorrecto, te queda 1 intento.')
    expect(errorDeRestablecer(problema(401, 'OTP_EXPIRED'))).toMatchObject({ mensaje: TEXTOS_RESTABLECER.vencido, pedirCodigo: true })
    expect(errorDeRestablecer(problema(403, 'ACCOUNT_NOT_ACTIVE'))).toMatchObject({ mensaje: TEXTOS_RESTABLECER.inactiva, soporte: true })
    expect(errorDeRestablecer(problema(429, 'OTP_ATTEMPTS_EXHAUSTED', { retryAfterSeconds: 60 }))).toMatchObject({ esperar: 60, pedirCodigo: true })
    expect(errorDeRestablecer(problema(429, 'RATE_LIMIT_EXCEEDED'))).toMatchObject({ mensaje: TEXTOS_RESTABLECER.limite, esperar: 60 })
    expect(errorDeRestablecer(problema(400, 'INVALID_DATA', {}, { otpCode: 'El código debe tener 6 dígitos', otro: 'x' }))).toMatchObject({
      mensaje: '',
      campos: { otpCode: 'El código debe tener 6 dígitos' },
    })
    // 400 sin campos conocidos o con un detail distinto: se muestra el texto real del servidor, no «Revisa los datos marcados.»
    expect(errorDeRestablecer(problema(400, 'INVALID_DATA', { detail: 'Debe incluir mayúscula, minúscula, número y símbolo' })).mensaje)
      .toBe('Debe incluir mayúscula, minúscula, número y símbolo')
    expect(errorDeRestablecer(problema(400, 'INVALID_DATA', { detail: 'Datos inválidos' }, { newPassword: 'Debe incluir un símbolo' }))).toMatchObject({
      mensaje: 'Datos inválidos',
      campos: { newPassword: 'Debe incluir un símbolo' },
    })
    expect(errorDeRestablecer(problema(503, 'SERVICE_UNAVAILABLE'))).toMatchObject({ mensaje: TEXTOS_RESTABLECER.servicio, reintentar: true })
  })
})

describe('ResetPasswordPage con mocks', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    resetRegistrosMock()
  })

  it('pide el código, cambia la contraseña y muestra el mensaje del contrato', async () => {
    const user = userEvent.setup()
    renderAt('/restablecer-contrasena', routes)
    await pedirCodigo(user)
    expect(screen.getByText(new RegExp(MENSAJE_CODIGO_RESTABLECER.slice(0, 30)))).toBeInTheDocument()
    expect(screen.getByText(/El código vence en 5:00/)).toBeInTheDocument()

    await llenarYEnviar(user)
    expect(await screen.findByText(MENSAJE_CLAVE_RESTABLECIDA)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a iniciar sesión' })).toHaveAttribute('href', '/login')
  })

  it('valida en el front la regla de contraseña y que la confirmación coincida, sin llamar al servidor', async () => {
    const user = userEvent.setup()
    renderAt('/restablecer-contrasena', routes)
    await pedirCodigo(user)

    await llenarYEnviar(user, '123456', 'debil123')
    expect(await screen.findByText(TEXTOS_RESTABLECER.clave, { selector: '[role="alert"]' })).toBeInTheDocument()

    await llenarYEnviar(user, '123456', 'NuevaClave2026*', 'OtraClave2026*')
    expect(await screen.findByText(TEXTOS_RESTABLECER.noCoinciden)).toBeInTheDocument()
  })

  it('no revela si el correo existe: un correo sin cuenta recibe el mismo mensaje', async () => {
    const user = userEvent.setup()
    renderAt('/restablecer-contrasena', routes)
    await pedirCodigo(user, 'nadie@correo.co')
    expect(screen.getByText(new RegExp(MENSAJE_CODIGO_RESTABLECER.slice(0, 30)))).toBeInTheDocument()
  })
})

describe('ResetPasswordPage contra ms-auth (VITE_USE_MOCKS=false)', () => {
  const original = env.useMocks

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
    ;(env as { useMocks: boolean }).useMocks = false
  })

  afterEach(() => {
    ;(env as { useMocks: boolean }).useMocks = original
    vi.restoreAllMocks()
  })

  it('usa /password/forgot y /password/reset y, tras el 200, borra la sesión guardada', async () => {
    tokenStorage.set('token-viejo')
    const post = vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
      if (url === '/api/v1/auth/password/forgot') return { data: { message: MENSAJE_CODIGO_RESTABLECER, expiresInSeconds: 300 } }
      return { data: { message: MENSAJE_CLAVE_RESTABLECIDA } }
    })
    const user = userEvent.setup()
    renderAt('/restablecer-contrasena', routes)
    await pedirCodigo(user, 'Buyer@StyleRadar.com')
    await llenarYEnviar(user, '482915')

    expect(await screen.findByText(MENSAJE_CLAVE_RESTABLECIDA)).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/api/v1/auth/password/forgot', { email: 'buyer@styleradar.com' })
    expect(post).toHaveBeenCalledWith('/api/v1/auth/password/reset', {
      email: 'buyer@styleradar.com',
      otpCode: '482915',
      newPassword: 'NuevaClave2026*',
    })
    expect(tokenStorage.get()).toBeNull()
    expect(screen.queryByDisplayValue('NuevaClave2026*')).not.toBeInTheDocument()
  })

  it('OTP_INCORRECT muestra los intentos; OTP_EXPIRED bloquea Cambiar y ofrece reenviar; el error de campo va bajo su campo', async () => {
    const respuestas = [
      problema(400, 'INVALID_DATA', {}, { otpCode: 'El código debe tener 6 dígitos numéricos' }),
      problema(401, 'OTP_INCORRECT', { attemptsRemaining: 2 }),
      problema(401, 'OTP_EXPIRED'),
    ]
    vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
      if (url === '/api/v1/auth/password/forgot') return { data: { message: MENSAJE_CODIGO_RESTABLECER, expiresInSeconds: 300 } }
      throw respuestas.shift()
    })
    const user = userEvent.setup()
    renderAt('/restablecer-contrasena', routes)
    await pedirCodigo(user)

    await llenarYEnviar(user)
    expect(await screen.findByText('El código debe tener 6 dígitos numéricos')).toHaveAttribute('id', 'reset-otp-error')

    await llenarYEnviar(user)
    expect(await screen.findByText('Código incorrecto, te quedan 2 intentos.')).toBeInTheDocument()

    await llenarYEnviar(user)
    expect(await screen.findByText(TEXTOS_RESTABLECER.vencido)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pide un código nuevo para continuar' })).toBeDisabled()
  })

  it('ACCOUNT_NOT_ACTIVE enlaza a soporte y OTP_ATTEMPTS_EXHAUSTED bloquea el botón el tiempo que pide el servidor', async () => {
    const respuestas = [problema(403, 'ACCOUNT_NOT_ACTIVE'), problema(429, 'OTP_ATTEMPTS_EXHAUSTED', { retryAfterSeconds: 60 })]
    vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
      if (url === '/api/v1/auth/password/forgot') return { data: { message: MENSAJE_CODIGO_RESTABLECER, expiresInSeconds: 300 } }
      throw respuestas.shift()
    })
    const user = userEvent.setup()
    renderAt('/restablecer-contrasena', routes)
    await pedirCodigo(user)

    await llenarYEnviar(user)
    expect(await screen.findByText(/Tu cuenta no está activa/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Escribe a soporte' })).toHaveAttribute('href', '/legal/centro-ayuda')

    await llenarYEnviar(user)
    await waitFor(() => expect(screen.getByRole('button', { name: /Espera 60s y pide un código nuevo/ })).toBeDisabled())
  })
})
