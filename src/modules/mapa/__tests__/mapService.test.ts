import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient } from '@/modules/core/api/apiClient'
import { mapService } from '../services/mapService'

describe('mapService sin mocks (VITE_USE_MOCKS=false)', () => {
  let prevMocks: boolean

  beforeEach(() => {
    prevMocks = env.useMocks
    env.useMocks = false
  })

  afterEach(() => {
    env.useMocks = prevMocks
    vi.restoreAllMocks()
  })

  it('getAll consulta GET /api/v1/stores/nearby y GET /api/v1/foundations/nearby (array y paginado)', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/nearby') {
        return {
          data: {
            content: [
              {
                id: 'store-1',
                nombre: 'Tienda Centro',
                categoria: 'Casual',
                latitud: 4.65,
                longitud: -74.06,
              },
            ],
          },
        } as never
      }
      if (url === '/api/v1/foundations/nearby') {
        return {
          data: [
            {
              id: 'found-1',
              nombre: 'Fundación Aliada',
              latitud: 4.63,
              longitud: -74.07,
            },
          ],
        } as never
      }
      throw new Error(`Unexpected URL ${url}`)
    })

    const pins = await mapService.getAll({ lat: 4.64, lng: -74.06, radioKm: 5 })

    expect(pins).toHaveLength(2)
    expect(pins[0]).toMatchObject({ id: 'store-1', tipo: 'tienda', name: 'Tienda Centro' })
    expect(pins[1]).toMatchObject({ id: 'found-1', tipo: 'fundacion', name: 'Fundación Aliada' })

    expect(getSpy).toHaveBeenCalledWith('/api/v1/stores/nearby', {
      params: { lat: 4.64, lng: -74.06, radioKm: 5 },
    })
    expect(getSpy).toHaveBeenCalledWith('/api/v1/foundations/nearby', {
      params: { lat: 4.64, lng: -74.06, radioKm: 5 },
    })

    const urls = getSpy.mock.calls.map(([u]) => u)
    expect(urls).not.toContain('/api/v1/almacenes')
    expect(urls).not.toContain('/api/v1/fundaciones/cercanas')
  })

  it('nearby consulta GET /api/v1/stores/nearby y GET /api/v1/foundations/nearby y combina los ids', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/nearby') return { data: [{ id: 's-1' }] } as never
      if (url === '/api/v1/foundations/nearby') return { data: { content: [{ id: 'f-1' }] } } as never
      throw new Error(`Unexpected URL ${url}`)
    })

    const ids = await mapService.nearby({ lat: 4.65, lng: -74.06 }, 3)

    expect(ids).toEqual(['s-1', 'f-1'])
    expect(getSpy).toHaveBeenCalledWith('/api/v1/stores/nearby', {
      params: { lat: 4.65, lng: -74.06, radioKm: 3 },
    })
    expect(getSpy).toHaveBeenCalledWith('/api/v1/foundations/nearby', {
      params: { lat: 4.65, lng: -74.06, radioKm: 3 },
    })
  })

  it('getCatalogSummary consulta GET /api/v1/stores/{id}/catalog/summary y limita a 4 prendas', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        totalPrendas: 6,
        prendas: [
          { id: '1', nombre: 'Prenda 1', precio: 50000, fotografias: ['https://img/1.jpg'] },
          { id: '2', nombre: 'Prenda 2', precio: 60000, imagenUrl: 'https://img/2.jpg' },
          { id: '3', nombre: 'Prenda 3', precio: 70000, imagen: 'https://img/3.jpg' },
          { id: '4', nombre: 'Prenda 4', precio: 80000 },
          { id: '5', nombre: 'Prenda 5', precio: 90000 },
        ],
      },
    } as never)

    const summary = await mapService.getCatalogSummary('store-qa')

    expect(summary.totalPrendas).toBe(6)
    expect(summary.prendas).toHaveLength(4)
    expect(summary.prendas[0]).toEqual({
      id: '1',
      nombre: 'Prenda 1',
      precio: 50000,
      imagen: 'https://img/1.jpg',
    })
    expect(getSpy).toHaveBeenCalledWith('/api/v1/stores/store-qa/catalog/summary')
    expect(getSpy).not.toHaveBeenCalledWith('/api/v1/almacenes/store-qa/catalogo/resumen')
  })

  it('distance consulta GET /api/v1/stores/{id}/distance y devuelve kilometros', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { kilometros: 2.35 },
    } as never)

    const km = await mapService.distance('store-qa', { lat: 4.65, lng: -74.06 })

    expect(km).toBe(2.35)
    expect(getSpy).toHaveBeenCalledWith('/api/v1/stores/store-qa/distance', {
      params: { lat: 4.65, lng: -74.06 },
    })
    expect(getSpy).not.toHaveBeenCalledWith('/api/v1/almacenes/store-qa/distancia', expect.anything())
  })
})
