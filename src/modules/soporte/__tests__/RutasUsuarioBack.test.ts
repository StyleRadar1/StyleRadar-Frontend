import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { notificationService } from '../services/notificationService'
import { preferenceService } from '../services/preferenceService'
import { rutaUsuario } from '../utils/rutaUsuario'

const sesion = (id: string) => localStorage.setItem('sr_user', JSON.stringify({ id, name: 'Val', role: 'BUYER' }))

describe('ms-notificaciones: rutas /api/v1/users/{id}/… con el id numérico de la sesión', () => {
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('usa el id numérico de la sesión; si no lo hay, el alias «me»', () => {
    sesion('101')
    expect(rutaUsuario()).toBe('/api/v1/users/101')
    sesion('u-1')
    expect(rutaUsuario()).toBe('/api/v1/users/me')
  })

  it('lista, contador, leer y leer todo', async () => {
    sesion('101')
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { content: [], cantidadNoLeidas: 0 } })
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: undefined })
    await notificationService.page(0)
    await notificationService.unreadCount()
    await notificationService.markRead('5001')
    await notificationService.markAllRead()
    expect(get).toHaveBeenNthCalledWith(1, '/api/v1/users/101/notifications', { params: { page: 0, size: 20 } })
    expect(get).toHaveBeenNthCalledWith(2, '/api/v1/users/101/notifications/unread/count')
    expect(patch).toHaveBeenNthCalledWith(1, '/api/v1/users/101/notifications/5001/read')
    expect(patch).toHaveBeenNthCalledWith(2, '/api/v1/users/101/notifications/read-all')
  })

  it('preferencias: GET y PUT /notification-preferences/{type}', async () => {
    sesion('101')
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] })
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { canal: 'CORREO_Y_PLATAFORMA' } })
    await preferenceService.list()
    await preferenceService.set('MENSAJE_NUEVO', 'CORREO_Y_PLATAFORMA')
    expect(get).toHaveBeenCalledWith('/api/v1/users/101/notification-preferences')
    expect(put).toHaveBeenCalledWith('/api/v1/users/101/notification-preferences/MENSAJE_NUEVO', { canal: 'CORREO_Y_PLATAFORMA' })
  })
})
