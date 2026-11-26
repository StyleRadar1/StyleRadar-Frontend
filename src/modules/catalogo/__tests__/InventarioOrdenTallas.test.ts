import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { inventoryService } from '../services/inventoryService'
import { ordenarStockPorTalla, ordenarTallas } from '../utils/tallas'

const PRENDA = { id: 'p-1', almacenId: 'a-1', nombre: 'Hoodie QA', tipo: 'Buzo', color: 'Gris', estilo: 'CASUAL', precio: 100000, fotografias: [], estado: 'APROBADA' }
/** El back entrega las tallas en desorden (así está hoy una prenda de QA): S, L, XL, M. */
const INVENTARIO_DESORDENADO = { sedes: [{ activo: true, variantes: [{ talla: 'S', stockDisponible: 8 }, { talla: 'L', stockDisponible: 10 }, { talla: 'XL', stockDisponible: 6 }, { talla: 'M', stockDisponible: 8 }] }] }

describe('inventario de la tienda: las tallas no saltan de lugar', () => {
  afterEach(() => vi.restoreAllMocks())

  it('ordena XXS, XS, S, M, L, XL, XXL y las numéricas de menor a mayor', () => {
    expect(ordenarTallas(['XL', 'S', 'L', 'M'])).toEqual(['S', 'M', 'L', 'XL'])
    expect(ordenarTallas(['42', '38', '40'])).toEqual(['38', '40', '42'])
    expect(ordenarTallas(['Única'])).toEqual(['Única'])
    expect(Object.keys(ordenarStockPorTalla({ XL: 1, S: 2, M: 3 }))).toEqual(['S', 'M', 'XL'])
  })

  it('al subir el stock de una talla, la lista sigue en S, M, L, XL', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { id: 'x' } } as never)
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/garments/p-1') return { data: PRENDA } as never
      if (url === '/api/v1/inventory/garments/p-1') return { data: INVENTARIO_DESORDENADO } as never
      throw new Error(`URL inesperada ${url}`)
    })
    // Se sube la talla M (que el back entrega al final) y la S (que entrega primero)
    for (const talla of ['M', 'S']) {
      const r = await inventoryService.updateStock({ prendaId: 'p-1', talla, nuevoStock: 20, sedeId: 'sede-1' })
      expect(Object.keys(r.stockPorTalla)).toEqual(['S', 'M', 'L', 'XL'])
      expect(r.tallasDisponibles).toEqual(['S', 'M', 'L', 'XL'])
    }
  })

  it('al cargar el inventario de la tienda las tallas también salen en orden', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/a-1/catalog') return { data: [PRENDA] } as never
      if (url === '/api/v1/inventory/branches/sede-1/available') return { data: ['p-1'] } as never
      if (url === '/api/v1/inventory') return { data: [] } as never
      if (url === '/api/v1/inventory/garments/p-1') return { data: INVENTARIO_DESORDENADO } as never
      throw new Error(`URL inesperada ${url}`)
    })
    const [item] = await inventoryService.getStoreInventory('a-1', 'sede-1')
    expect(Object.keys(item.stockPorTalla)).toEqual(['S', 'M', 'L', 'XL'])
    expect(item.stockPorTalla).toEqual({ S: 8, M: 8, L: 10, XL: 6 })
  })
})
