import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { useMocks: false, apiUrl: 'https://gw.test', appEnvironment: 'qa' } }))

import { MARGEN_RENOVACION_SEGUNDOS, renovarSiHaceFalta, segundosRestantes } from '../api/renovarSesion'
import { tokenStorage } from '../api/tokenStorage'

const jwt = (expEnSegundos: number) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${b64({ alg: 'HS256' })}.${b64({ sub: '2', roles: ['BUYER'], exp: Math.floor(Date.now() / 1000) + expEnSegundos })}.firma`
}

describe('F-08: renovar la sesión con /api/v1/auth/refresh', () => {
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('lee los segundos que le quedan al token', () => {
    expect(segundosRestantes(jwt(600))).toBeGreaterThan(590)
    expect(segundosRestantes('no-es-jwt')).toBeNull()
  })

  it('renueva una sola vez cuando faltan menos de 5 minutos y guarda el token nuevo', async () => {
    const viejo = jwt(60)
    tokenStorage.set(viejo)
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'nuevo' } })
    await Promise.all([renovarSiHaceFalta('/api/v1/users/me'), renovarSiHaceFalta('/api/v1/stores')])
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('https://gw.test/api/v1/auth/refresh', { refreshToken: viejo }, expect.anything())
    expect(tokenStorage.get()).toBe('nuevo')
  })

  it('no renueva si falta mucho, si ya venció, sin sesión o en rutas de ms-auth', async () => {
    const post = vi.spyOn(axios, 'post')
    await renovarSiHaceFalta('/x')
    tokenStorage.set(jwt(MARGEN_RENOVACION_SEGUNDOS + 120)); await renovarSiHaceFalta('/x')
    tokenStorage.set(jwt(-10)); await renovarSiHaceFalta('/x')
    tokenStorage.set(jwt(60)); await renovarSiHaceFalta('/api/v1/auth/logout')
    expect(post).not.toHaveBeenCalled()
  })

  it('si ms-auth responde 401 lleva a iniciar sesión (SR-RF-113 · FA-03)', async () => {
    tokenStorage.set(jwt(60))
    vi.spyOn(axios, 'post').mockRejectedValue({ isAxiosError: true, response: { status: 401 } })
    const expirada = vi.fn()
    window.addEventListener('sr:sesion-expirada', expirada)
    await renovarSiHaceFalta('/x')
    window.removeEventListener('sr:sesion-expirada', expirada)
    expect(expirada).toHaveBeenCalledTimes(1)
  })

  it('un 401 cuando otra pestaña ya renovó no cierra la sesión', async () => {
    tokenStorage.set(jwt(60))
    vi.spyOn(axios, 'post').mockImplementation(async () => {
      tokenStorage.set('renovado-en-otra-pestana')
      throw { isAxiosError: true, response: { status: 401 } }
    })
    const expirada = vi.fn()
    window.addEventListener('sr:sesion-expirada', expirada)
    await renovarSiHaceFalta('/x')
    window.removeEventListener('sr:sesion-expirada', expirada)
    expect(expirada).not.toHaveBeenCalled()
  })

  it('si la renovación falla por red conserva el token actual y no cierra la sesión', async () => {
    const viejo = jwt(60)
    tokenStorage.set(viejo)
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('401'))
    await renovarSiHaceFalta('/x')
    expect(tokenStorage.get()).toBe(viejo)
  })
})
