import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { inventoryService, resetInventoryMock, resolveStoreContext } from '../services/inventoryService'
import { storeSettingsService } from '../services/storeSettingsService'

const PRENDA = { id: 'p-1', almacenId: 'a-1', nombre: 'Camiseta QA', tipo: 'Camiseta', color: 'Gris', estilo: 'CASUAL', precio: 50000, fotografias: [] }
const INVENTARIO = { sedes: [{ activo: true, variantes: [{ talla: 'S', stockDisponible: 5 }, { talla: 'M', stockDisponible: 3 }, { talla: 'L', stockDisponible: 2 }] }] }

describe('tienda: bajar el stock de una talla no hace desaparecer las otras', () => {
  afterEach(() => vi.restoreAllMocks())

  const fingir = () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { id: 'x' } } as never)
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/garments/p-1') return { data: PRENDA } as never
      if (url === '/api/v1/inventory/garments/p-1') return { data: INVENTARIO } as never
      throw new Error(`URL inesperada ${url}`)
    })
  }

  it('al dejar la S en 0 siguen M y L con su stock', async () => {
    fingir()
    const r = await inventoryService.updateStock({ prendaId: 'p-1', talla: 'S', nuevoStock: 0, sedeId: 'sede-1' })
    expect(r.stockPorTalla).toEqual({ S: 0, M: 3, L: 2 })
    expect(r.tallasDisponibles.sort()).toEqual(['L', 'M', 'S'])
    expect(r.stockTotal).toBe(5)
  })

  it('envía solo la talla ajustada, con la ruta de inventario en inglés', async () => {
    fingir()
    await inventoryService.updateStock({ prendaId: 'p-1', talla: 'M', nuevoStock: 1, sedeId: 'sede-1' })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/inventory/garments/p-1/branches/sede-1/sizes/M', { unidades: 1 })
  })

  it('el valor nuevo manda sobre el que aún devuelva el inventario', async () => {
    fingir()
    const r = await inventoryService.updateStock({ prendaId: 'p-1', talla: 'L', nuevoStock: 9, sedeId: 'sede-1' })
    expect(r.stockPorTalla).toEqual({ S: 5, M: 3, L: 9 })
  })

  it('Frente 4: resolveStoreContext prioriza almacenId UUID real sobre nit', async () => {
    resetInventoryMock()
    localStorage.setItem('sr_user', JSON.stringify({ id: 'u-tienda', name: 'Tienda QA', email: 't@qa.co', role: 'STORE_ADMIN' }))
    const uuid = 'fc942335-ab30-350a-b6a5-577cf0ca2fb5'
    vi.spyOn(storeSettingsService, 'getMyStore').mockResolvedValue({
      nit: '900555777-1',
      almacenId: uuid,
      tradeName: 'Tienda QA',
    })
    const ctx = await resolveStoreContext()
    expect(ctx.storeId).toBe(uuid)
    expect(ctx.sedeId).toBe(uuid)
    expect(ctx.nit).toBe('900555777-1')
    localStorage.clear()
    resetInventoryMock()
  })

  it('Frente 4: updatePrice y updateItem preservan el mapa real de stock (no pasan {})', async () => {
    vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { ...PRENDA, precio: 75000 } } as never)
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/garments/p-1') return { data: PRENDA } as never
      if (url === '/api/v1/inventory/garments/p-1') return { data: INVENTARIO } as never
      return { data: null } as never
    })
    const byPrice = await inventoryService.updatePrice({ prendaId: 'p-1', nuevoPrecio: 75000 })
    expect(byPrice.stockPorTalla).toEqual({ S: 5, M: 3, L: 2 })
    expect(byPrice.stockTotal).toBe(10)
    expect(byPrice.estado).toBe('DISPONIBLE')

    const byItem = await inventoryService.updateItem({
      prendaId: 'p-1',
      nombre: 'Camiseta QA Editada',
      tipo: 'Camiseta',
      color: 'Gris',
      estilo: 'CASUAL',
      precio: 75000,
      fotografias: ['https://picsum.photos/seed/p1/600'],
    })
    expect(byItem.stockPorTalla).toEqual({ S: 5, M: 3, L: 2 })
    expect(byItem.stockTotal).toBe(10)
    expect(byItem.estado).toBe('DISPONIBLE')
  })
})
