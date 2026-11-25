import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { abrirCampana } from '../services/notificationStream'

describe('campana en tiempo real: no reconecta en bucle sin acceso', () => {
  beforeEach(() => { vi.useFakeTimers(); tokenStorage.set('token-de-prueba'); localStorage.setItem('sr_user', JSON.stringify({ id: '101', name: 'Val', role: 'BUYER' })) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); tokenStorage.clear(); localStorage.clear() })

  const pasar = async (ms: number) => { await vi.advanceTimersByTimeAsync(ms) }

  it.each([401, 403, 404])('si el ticket responde %i (sesión vencida o cuenta eliminada) no vuelve a intentar', async (status) => {
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue(new ApiError(status, 'x'))
    abrirCampana(() => {})
    await pasar(100_000)
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('si el stream mismo responde 403 tampoco reconecta', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { ticket: 't' } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, body: null }))
    abrirCampana(() => {})
    await pasar(100_000)
    expect(post).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('un fallo de red o un 5xx sí se reintenta', async () => {
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue(new ApiError(503, 'x'))
    const cerrar = abrirCampana(() => {})
    await pasar(10_000)
    expect(post.mock.calls.length).toBeGreaterThan(1)
    cerrar()
  })

  it('al cerrar la campana (salir de la sesión) deja de reintentar', async () => {
    const post = vi.spyOn(apiClient, 'post').mockRejectedValue(new ApiError(503, 'x'))
    const cerrar = abrirCampana(() => {})
    await pasar(1_500)
    cerrar()
    const antes = post.mock.calls.length
    await pasar(100_000)
    expect(post.mock.calls.length).toBe(antes)
  })
})
