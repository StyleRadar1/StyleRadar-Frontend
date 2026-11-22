import { describe, expect, it } from 'vitest'
import { aLoginResponse, leerJwt, normalizarRol } from '../utils/sesionReal'

/** JWT de mentira solo para las pruebas: no se valida, solo se lee. */
const jwtDe = (cuerpo: object) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256' })}.${b64(cuerpo)}.firma`
}

describe('traducción de roles de ms-auth al front', () => {
  it.each([
    ['BUYER', 'COMPRADOR'],
    ['STORE_ADMIN', 'ADMIN_ALMACEN'],
    ['FOUNDATION_REPRESENTATIVE', 'REPRESENTANTE_FUNDACION'],
    ['STYLERADAR_ADMIN', 'ADMIN_STYLERADAR'],
    ['ROLE_STORE_admin', 'ADMIN_ALMACEN'],
    ['ADMIN_ALMACEN', 'ADMIN_ALMACEN'], // ya en español (ms-usuarios)
    [['FOUNDATION_REPRESENTATIVE'], 'REPRESENTANTE_FUNDACION'], // el JWT trae una lista
  ])('%s → %s', (de, a) => expect(normalizarRol(de)).toBe(a))

  it('un rol desconocido no se traduce', () => {
    expect(normalizarRol('SUPERADMIN')).toBeNull()
    expect(normalizarRol(undefined)).toBeNull()
  })
})

describe('sesión a partir de la respuesta real de ms-auth', () => {
  it('toma el id y el rol del JWT cuando la respuesta no trae usuario', () => {
    const token = jwtDe({ sub: '3', roles: ['STORE_ADMIN'] })
    const r = aLoginResponse({ token })
    expect(r.user).toMatchObject({ id: '3', role: 'ADMIN_ALMACEN' })
    expect(r.token).toBe(token)
  })

  it('respeta el usuario de la respuesta y traduce su rol', () => {
    const r = aLoginResponse({ token: jwtDe({ sub: '2', roles: ['BUYER'] }), user: { id: 2, name: 'Ana', email: 'ana@correo.co', role: 'BUYER' } })
    expect(r.user).toEqual({ id: '2', name: 'Ana', email: 'ana@correo.co', role: 'COMPRADOR' })
  })

  it('si no reconoce el rol deja el de menos permisos', () => {
    expect(aLoginResponse({ token: jwtDe({ sub: '9', roles: ['OTRO'] }) }).user.role).toBe('COMPRADOR')
  })

  it('conserva los datos del OTP cuando el servidor pide verificación', () => {
    const r = aLoginResponse({ requiereOtp: true, otpExpiraEnSegundos: 300, user: { email: 'a@b.co', role: 'BUYER' } })
    expect(r.requiereOtp).toBe(true)
    expect(r.otpExpiraEnSegundos).toBe(300)
    expect(r.token).toBe('')
  })

  it('un JWT ilegible no rompe el inicio de sesión', () => {
    expect(leerJwt('no-es-un-jwt')).toEqual({})
    expect(aLoginResponse(null).user.role).toBe('COMPRADOR')
  })
})
