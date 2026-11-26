import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { inventoryService } from '../services/inventoryService'

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
})
