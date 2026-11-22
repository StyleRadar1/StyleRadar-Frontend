import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { aTarjeta, feedService, motivoDe, paginaFeed, puntaje } from '../services/feedService'
import type { FeedItemDto } from '../types/feed.dto'

const ITEM: FeedItemDto = {
  itemId: '7b1c', garmentId: 41, storeId: 'a9f0', storeNit: '9014823371', name: 'Blazer oversize', garmentType: 'TOP',
  brand: 'Nómada', color: 'Negro', style: 'FORMAL', price: 189000, stock: 2, status: 'AVAILABLE', publishedAt: '2026-11-10T12:00:00Z',
  photos: ['https://blob.test/1.jpg', 'https://blob.test/2.jpg'], availableSizes: ['S', 'M'],
}
const PERFIL = { stylePreferences: ['FORMAL' as const], sizesByGarmentType: { TOP: ['M'] } }
const pagina = { content: [ITEM], page: 0, size: 8, totalElements: 1, totalPages: 1, first: true, last: true }

describe('feed y recomendaciones contra ms-usuarios (SR-RF-05 y 06)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('pide GET /users/{id}/feed con page y size dentro de los límites', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: pagina })
    const r = await feedService.getFeed('12', { page: 1, size: 8 })
    expect(get).toHaveBeenCalledWith('/api/v1/users/12/feed', { params: { page: 1, size: 8 } })
    expect(r.content[0].itemId).toBe('7b1c')
    expect(paginaFeed({ page: -2, size: 50 })).toEqual({ page: 0, size: 20 })
    expect(paginaFeed({ size: 0 })).toEqual({ page: 0, size: 1 })
  })

  it('pide GET /users/{id}/recommendations y conserva generalWithoutPreferences y message', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { ...pagina, generalWithoutPreferences: false, message: 'Recomendaciones generadas según tu perfil.' } })
    const r = await feedService.getRecommendations('12')
    expect(get).toHaveBeenCalledWith('/api/v1/users/12/recommendations', { params: { page: 0, size: 20 } })
    expect(r).toMatchObject({ generalWithoutPreferences: false, message: 'Recomendaciones generadas según tu perfil.' })
  })

  it('el motivo usa reason del back y, si no llega, la talla (+3) y el estilo (+2) del perfil', () => {
    expect(puntaje(ITEM, PERFIL)).toBe(5)
    expect(motivoDe({ ...ITEM, reason: 'Coincide con tu estilo' }, PERFIL)).toBe('Coincide con tu estilo')
    expect(motivoDe(ITEM, PERFIL)).toBe('Tu estilo Formal y tu talla M')
    expect(motivoDe({ ...ITEM, style: 'VINTAGE' }, PERFIL)).toBe('Hay tu talla M')
    expect(motivoDe(ITEM, null)).toBe('')
  })

  it('convierte la prenda en la tarjeta del catálogo, con la tienda por NIT y la primera foto', () => {
    expect(aTarjeta(ITEM)).toMatchObject({ id: '7b1c', almacenId: '9014823371', nombre: 'Blazer oversize', precio: 189000, estilo: 'Formal', tallas: ['S', 'M'], imagen: 'https://blob.test/1.jpg' })
  })
})
