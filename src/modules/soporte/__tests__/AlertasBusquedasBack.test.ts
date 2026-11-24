import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { alertService } from '../services/alertService'

describe('búsquedas guardadas y su alerta contra el back', () => {
  beforeEach(() => localStorage.setItem('sr_user', JSON.stringify({ id: '12', name: 'Val', role: 'BUYER' })))
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('guarda en ms-usuarios (ya no en /api/notifications/saved-searches) y devuelve la búsqueda sin alerta', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 5, name: 'Botas', createdAt: '2026-11-21T10:00:00' } })
    const b = await alertService.saveSearch('Botas', '2 filtros')
    expect(post).toHaveBeenCalledWith('/api/v1/users/12/saved-searches', { name: 'Botas' })
    expect(b).toMatchObject({ id: 'g-5', nombre: 'Botas', alerta: false })
  })

  it('la primera vez que se activa crea la alerta BUSQUEDA_GUARDADA con el id de la búsqueda', async () => {
    const post = vi.spyOn(apiClient, 'post')
      .mockResolvedValueOnce({ data: { id: 5, name: 'Botas', createdAt: '2026-11-21T10:00:00' } })
      .mockResolvedValueOnce({ data: { id: 77 } })
    const b = await alertService.saveSearch('Botas', '')
    const activa = await alertService.setSearchAlert(b.id, true)
    expect(post).toHaveBeenLastCalledWith('/api/v1/users/me/alerts', { tipoAlerta: 'BUSQUEDA_GUARDADA', busquedaGuardadaId: 5, nombreBusqueda: 'Botas', canal: 'IN_APP' })
    expect(activa).toMatchObject({ id: '77', alerta: true })
  })

  it('al quitar una búsqueda apaga su alerta y borra la guardada en ms-usuarios', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [{ id: 77, busquedaGuardadaId: 5, nombreBusqueda: 'Botas', estado: 'ACTIVA' }] })
    await alertService.summary()
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: undefined })
    await alertService.removeSearch('77')
    expect(del).toHaveBeenCalledWith('/api/v1/users/me/alerts/77')
    expect(del).toHaveBeenCalledWith('/api/v1/users/12/saved-searches/5')
  })
})
