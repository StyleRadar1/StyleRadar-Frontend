import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aApiError, ApiError } from '../api/apiClient'
import { camposDelError, errorKind, errorMessage, errorMessageAjeno, fieldErrors, MENSAJES, NO_EXISTE_O_SIN_ACCESO } from '../api/errors'
import { guardarRetorno, tomarRetorno } from '../api/retorno'

const respuesta = (status: number, data: unknown) => {
  const config = { headers: new AxiosHeaders(), url: '/usuarios/7', method: 'get' }
  return new AxiosError('fallo', 'ERR', config, null, { status, statusText: '', data, headers: {}, config })
}

describe('mensajes seguros (plan de errores · antes de empezar)', () => {
  beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear() })

  it('nunca muestra el texto del servidor: IDs, NIT o nombres de servicios', () => {
    const e = aApiError(respuesta(403, { message: 'identity-service: user 9f2c sin rol ADMIN, NIT 900123456' }))
    expect(errorMessage(e)).toBe(MENSAJES.permiso)
    expect(errorMessage(e)).not.toMatch(/identity|9f2c|900123456/)
  })

  it('elige el texto según el tipo de error', () => {
    expect(errorKind(aApiError(respuesta(429, {})))).toBe('limite')
    expect(errorMessage(aApiError(respuesta(429, {})))).toBe(MENSAJES.limite)
    expect(errorMessage(aApiError(respuesta(503, { message: 'gateway timeout catalogo-svc' })))).toBe(MENSAJES.servidor)
    expect(errorMessage(aApiError(new AxiosError('Network Error')))).toBe(MENSAJES['sin-conexion'])
  })

  it('403 y 404 sobre datos de otra persona muestran el mismo texto', () => {
    expect(errorMessageAjeno(aApiError(respuesta(403, {})))).toBe(NO_EXISTE_O_SIN_ACCESO)
    expect(errorMessageAjeno(aApiError(respuesta(404, {})))).toBe(NO_EXISTE_O_SIN_ACCESO)
  })

  it('los textos escritos por el React (mocks) se siguen mostrando', () => {
    expect(errorMessage(new ApiError(409, 'Ya hay 3 destacadas. Quita una primero.'))).toBe('Ya hay 3 destacadas. Quita una primero.')
  })

  it('el detalle técnico va a la consola solo en desarrollo', () => {
    aApiError(respuesta(500, { trace: 'NullPointerException' }))
    expect(console.warn).toHaveBeenCalledTimes(import.meta.env.DEV ? 1 : 0)
  })
})

describe('errores por campo unificados', () => {
  it.each([
    ['validationErrors (objeto)', { validationErrors: { email: 'Correo inválido' } }],
    ['errors (objeto con lista)', { errors: { email: ['Correo inválido', 'otro'] } }],
    ['errores (lista con campo)', { errores: [{ campo: 'email', mensaje: 'Correo inválido' }] }],
    ['invalidFields (lista con field)', { invalidFields: [{ field: 'email', message: 'Correo inválido' }] }],
    ['invalidParams (ProblemDetail)', { invalidParams: [{ name: 'email', reason: 'Correo inválido' }] }],
    ['ruta con prefijo', { errors: [{ path: ['body', 'email'], msg: 'Correo inválido' }] }],
  ])('%s → { email }', (_, data) => {
    expect(camposDelError(data)).toEqual({ email: 'Correo inválido' })
  })

  it('llegan a la pantalla con fieldErrors', () => {
    const e = aApiError(respuesta(400, { message: 'Bad Request', validationErrors: { precio: 'El precio debe ser mayor a 0' } }))
    expect(fieldErrors(e)).toEqual({ precio: 'El precio debe ser mayor a 0' })
    expect(errorMessage(e)).toBe(MENSAJES.datos)
  })

  it('ignora cuerpos que no son objetos', () => {
    expect(camposDelError('error')).toEqual({})
    expect(camposDelError(null)).toEqual({})
  })
})

describe('sesión vencida (401) en cualquier pantalla', () => {
  afterEach(() => { localStorage.clear(); sessionStorage.clear(); window.history.replaceState(null, '', '/') })

  it('cierra la sesión y guarda la página para volver a ella', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const avisos = vi.fn()
    window.addEventListener('sr:sesion-expirada', avisos)
    localStorage.setItem('sr_token', 'demo')
    window.history.replaceState(null, '', '/playlists/12?tab=prendas')
    const e = aApiError(respuesta(401, {}))
    expect(errorMessage(e)).toBe(MENSAJES.sesion)
    expect(localStorage.getItem('sr_token')).toBeNull()
    expect(avisos).toHaveBeenCalledTimes(1)
    expect(tomarRetorno()).toBe('/playlists/12?tab=prendas')
    expect(tomarRetorno()).toBeNull()
    window.removeEventListener('sr:sesion-expirada', avisos)
    vi.restoreAllMocks()
  })

  it('un 401 sin sesión (contraseña equivocada) no guarda página', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.history.replaceState(null, '', '/planes')
    aApiError(respuesta(401, {}))
    expect(tomarRetorno()).toBeNull()
    vi.restoreAllMocks()
  })

  it('solo acepta rutas internas', () => {
    guardarRetorno('https://otro-sitio.com')
    expect(tomarRetorno()).toBeNull()
    guardarRetorno('//otro-sitio.com')
    expect(tomarRetorno()).toBeNull()
    sessionStorage.setItem('sr_volver', '//otro-sitio.com')
    expect(tomarRetorno()).toBeNull()
  })
})
