import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { notificationService } from '../services/notificationService'

describe('eliminar avisos contra ms-notificaciones (id numérico, sin el alias «me»)', () => {
  beforeEach(() => localStorage.setItem('sr_user', JSON.stringify({ id: '101', name: 'Val', role: 'BUYER' })))
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('uno: DELETE /users/{id}/notifications/{notificationId}', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: undefined })
    await notificationService.remove('5001')
    expect(del).toHaveBeenCalledWith('/api/v1/users/101/notifications/5001')
  })

  it('uno: un 404 es éxito (ya no estaba); un 403 sí falla', async () => {
    vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(new ApiError(404, 'x')).mockRejectedValueOnce(new ApiError(403, 'x'))
    await expect(notificationService.remove('1')).resolves.toBeUndefined()
    await expect(notificationService.remove('2')).rejects.toMatchObject({ status: 403 })
  })

  it('varias: una sola petición con ids separados por coma y suma lo eliminado de verdad', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: { usuarioId: 101, cantidadEliminadas: 2 } })
    expect(await notificationService.removeMany(['5001', '5002', '5003'])).toBe(2)
    expect(del).toHaveBeenCalledTimes(1)
    expect(del).toHaveBeenCalledWith('/api/v1/users/101/notifications', { params: { ids: '5001,5002,5003' } })
  })

  it('varias: 120 ids salen en dos tandas (100 y 20) y se suman', async () => {
    const del = vi.spyOn(apiClient, 'delete')
      .mockResolvedValueOnce({ data: { cantidadEliminadas: 100 } })
      .mockResolvedValueOnce({ data: { cantidadEliminadas: 20 } })
    const ids = Array.from({ length: 120 }, (_, i) => String(i + 1))
    expect(await notificationService.removeMany(ids)).toBe(120)
    expect(del).toHaveBeenCalledTimes(2)
    expect((del.mock.calls[0][1] as { params: { ids: string } }).params.ids.split(',')).toHaveLength(100)
    expect((del.mock.calls[1][1] as { params: { ids: string } }).params.ids.split(',')).toHaveLength(20)
  })

  it('varias: sin ids no se envía nada, y los repetidos se envían una vez', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: { cantidadEliminadas: 1 } })
    expect(await notificationService.removeMany([])).toBe(0)
    expect(del).not.toHaveBeenCalled()
    await notificationService.removeMany(['7', '7'])
    expect(del).toHaveBeenCalledWith('/api/v1/users/101/notifications', { params: { ids: '7' } })
  })

  it('las leídas: DELETE ?read=true y devuelve la cantidad', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: { usuarioId: 101, cantidadEliminadas: 12 } })
    expect(await notificationService.removeRead()).toBe(12)
    expect(del).toHaveBeenCalledWith('/api/v1/users/101/notifications', { params: { read: true } })
  })

  it('un 422 o un 429 no se tragan: llegan a quien llama', async () => {
    vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(new ApiError(422, 'x')).mockRejectedValueOnce(new ApiError(429, 'x'))
    await expect(notificationService.removeMany(['1'])).rejects.toMatchObject({ status: 422 })
    await expect(notificationService.removeRead()).rejects.toMatchObject({ status: 429 })
  })

  it('sin un id numérico de sesión no sale ninguna petición', async () => {
    localStorage.setItem('sr_user', JSON.stringify({ id: 'me', name: 'Val', role: 'BUYER' }))
    const del = vi.spyOn(apiClient, 'delete')
    await expect(notificationService.remove('1')).rejects.toMatchObject({ status: 401 })
    await expect(notificationService.removeRead()).rejects.toMatchObject({ status: 401 })
    expect(del).not.toHaveBeenCalled()
  })
})
