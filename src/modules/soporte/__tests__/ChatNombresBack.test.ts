import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { chatService, resetChatMock } from '../services/chatService'

const CONV = { id: 2, type: 'SEGUNDA_MANO', publicationId: 1, garmentName: 'Chaqueta Denim', buyerId: 1, sellerId: 2, status: 'ABIERTA', createdAt: '2026-11-21T10:00:00Z' }

describe('nombres del chat desde ms-usuarios (SR-RF-114)', () => {
  beforeEach(() => { localStorage.setItem('sr_user', JSON.stringify({ id: '2', name: 'Sofía', email: 's@correo.com', role: 'BUYER' })) })
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); resetChatMock() })

  it('pide el nombre con GET /api/v1/users/{id}, nunca con la ruta en español', async () => {
    const get = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/users/conversations') return { data: { content: [CONV], totalPages: 1 } }
      if (url === '/api/v1/users/1') return { data: { id: 1, name: 'Mateo P.' } }
      return { data: { content: [], totalPages: 1 } }
    })
    const [c] = await chatService.conversations()
    expect(get).toHaveBeenCalledWith('/api/v1/users/1')
    expect(get.mock.calls.some(([u]) => String(u).includes('/usuarios/'))).toBe(false)
    expect(c.contacto.nombre).toBe('Mateo P.')
  })

  it('con 403 (perfil de otra cuenta) muestra «Usuario #id» y no lo vuelve a pedir', async () => {
    const get = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/users/conversations') return { data: { content: [CONV], totalPages: 1 } }
      if (url === '/api/v1/users/1') throw new ApiError(403, 'No tiene permisos para esta acción', 'ACCESS_DENIED')
      return { data: { content: [], totalPages: 1 } }
    })
    const [c] = await chatService.conversations()
    expect(c.contacto.nombre).toBe('Usuario #1')
    await chatService.conversations()
    expect(get.mock.calls.filter(([u]) => u === '/api/v1/users/1')).toHaveLength(1)
  })
})
