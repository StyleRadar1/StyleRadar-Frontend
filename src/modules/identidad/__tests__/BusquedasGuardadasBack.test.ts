import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { erroresBusqueda, savedSearchService } from '../services/savedSearchService'

describe('búsquedas guardadas contra ms-usuarios (SR-RF-28 · F-33)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('guarda con POST /users/{id}/saved-searches y solo los filtros con valor', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 5, name: 'Botas negras', createdAt: '2026-11-21T10:00:00Z' } })
    await savedSearchService.save('12', { name: '  Botas negras ', query: 'botas', garmentType: 'FOOTWEAR', color: 'Negro', brand: undefined, minPrice: 0, maxPrice: 250000, style: 'VINTAGE' })
    expect(post).toHaveBeenCalledWith('/api/v1/users/12/saved-searches', { name: 'Botas negras', query: 'botas', garmentType: 'FOOTWEAR', color: 'Negro', minPrice: 0, maxPrice: 250000, style: 'VINTAGE' })
  })

  it('no envía nada si el nombre o los filtros no cumplen el documento', async () => {
    const post = vi.spyOn(apiClient, 'post')
    await expect(savedSearchService.save('12', { name: ' ' })).rejects.toMatchObject({ status: 400, fields: { name: 'El nombre de la búsqueda guardada es obligatorio' } })
    expect(post).not.toHaveBeenCalled()
  })

  it('lista con GET de la más reciente a la más antigua y elimina con DELETE', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [{ id: 1, name: 'A', createdAt: '2026-11-01T00:00:00Z' }, { id: 2, name: 'B', createdAt: '2026-11-20T00:00:00Z' }] })
    expect((await savedSearchService.list('12')).map((b) => b.id)).toEqual([2, 1])
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: undefined })
    await savedSearchService.remove('12', 2)
    expect(del).toHaveBeenCalledWith('/api/v1/users/12/saved-searches/2')
  })

  it('un 404 al eliminar se toma como ya eliminada (D21); los demás errores siguen', async () => {
    vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(new ApiError(404, 'x')).mockRejectedValueOnce(new ApiError(403, 'x'))
    await expect(savedSearchService.remove('12', 9)).resolves.toBeUndefined()
    await expect(savedSearchService.remove('12', 9)).rejects.toMatchObject({ status: 403 })
  })

  it('valida con los mensajes de EX-01 a EX-06', () => {
    expect(erroresBusqueda({ name: 'x'.repeat(101), query: '  ', color: ' ', brand: ' ', minPrice: -1, latitude: 91, longitude: -181 })).toEqual({
      name: 'El nombre debe tener entre 1 y 100 caracteres', query: 'query no puede estar vacío', color: 'color no puede estar vacío',
      brand: 'marca no puede estar vacía', minPrice: 'precioMin debe ser mayor o igual a 0', latitude: 'latitud debe estar entre -90 y 90',
      longitude: 'longitud debe estar entre -180 y 180',
    })
    expect(erroresBusqueda({ name: 'Rango', minPrice: 200, maxPrice: 100 })).toEqual({ priceRange: 'precioMin no puede ser mayor que precioMax' })
    expect(erroresBusqueda({ name: 'Ok', minPrice: 0, maxPrice: 0 })).toEqual({})
  })
})
