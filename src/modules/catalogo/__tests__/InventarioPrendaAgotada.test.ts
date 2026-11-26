import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { inventoryService } from '../services/inventoryService'

const prenda = (id: string, extra: Record<string, unknown> = {}) => ({
  id, almacenId: 'a-1', nombre: `Prenda ${id}`, tipo: 'Camiseta', color: 'Gris', estilo: 'CASUAL', precio: 50000, fotografias: [], estado: 'APROBADA', ...extra,
})
const fila = (prendaId: string, talla: string, stockDisponible: number) => ({ id: `si-${prendaId}`, prendaId, sedeId: 'sede-1', talla, stockDisponible })

/** Catálogo lista solo p-1 (con stock); p-2 quedó con todo en 0 y Catálogo ya no la lista. */
const fingir = (opciones: { inventario?: unknown; detalleP2?: unknown } = {}) =>
  vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url === '/api/v1/stores/a-1/catalog') return { data: [prenda('p-1')] } as never
    if (url === '/api/v1/inventory/branches/sede-1/available') return { data: ['p-1'] } as never
    if (url === '/api/v1/inventory') {
      if (opciones.inventario instanceof Error) throw opciones.inventario
      return { data: opciones.inventario ?? [fila('p-1', 'M', 4), fila('p-2', 'S', 0), fila('p-2', 'M', 0)] } as never
    }
    if (url === '/api/v1/inventory/garments/p-1') return { data: { sedes: [{ activo: true, variantes: [{ talla: 'M', stockDisponible: 4 }] }] } } as never
    if (url === '/api/v1/garments/p-2') {
      if (opciones.detalleP2 instanceof Error) throw opciones.detalleP2
      return { data: opciones.detalleP2 ?? prenda('p-2') } as never
    }
    throw new Error(`URL inesperada ${url}`)
  })

describe('inventario de la tienda: la prenda con todo en 0 no desaparece', () => {
  afterEach(() => vi.restoreAllMocks())

  it('muestra la prenda agotada con sus tallas en 0, junto a las que tienen stock', async () => {
    fingir()
    const lista = await inventoryService.getStoreInventory('a-1', 'sede-1')
    expect(lista.map((x) => x.id)).toEqual(['p-1', 'p-2'])
    const p2 = lista.find((x) => x.id === 'p-2')!
    expect(p2.stockPorTalla).toEqual({ S: 0, M: 0 })
    expect(p2.stockTotal).toBe(0)
    expect(p2.estado).toBe('AGOTADA')
  })

  it('pide el stock de la sede a /api/v1/inventory con la sede y el tamaño de página máximo', async () => {
    const get = fingir()
    await inventoryService.getStoreInventory('a-1', 'sede-1')
    expect(get).toHaveBeenCalledWith('/api/v1/inventory', { params: { storeId: 'sede-1', page: 0, size: 100 } })
  })

  it('una prenda aún sin aprobar (pendiente o rechazada) no se agrega por esta vía', async () => {
    fingir({ detalleP2: prenda('p-2', { estado: 'PENDIENTE' }) })
    const lista = await inventoryService.getStoreInventory('a-1', 'sede-1')
    expect(lista.map((x) => x.id)).toEqual(['p-1'])
  })

  it('si inventario no deja listar (403) o falla, queda el catálogo de siempre', async () => {
    fingir({ inventario: new ApiError(403, 'x') })
    const lista = await inventoryService.getStoreInventory('a-1', 'sede-1')
    expect(lista.map((x) => x.id)).toEqual(['p-1'])
  })

  it('si el detalle de la prenda agotada falla, no rompe toda la lista', async () => {
    fingir({ detalleP2: new ApiError(404, 'x') })
    const lista = await inventoryService.getStoreInventory('a-1', 'sede-1')
    expect(lista.map((x) => x.id)).toEqual(['p-1'])
  })

  it('las prendas que Catálogo sí lista no se duplican', async () => {
    fingir({ inventario: [fila('p-1', 'M', 4)] })
    const lista = await inventoryService.getStoreInventory('a-1', 'sede-1')
    expect(lista.map((x) => x.id)).toEqual(['p-1'])
  })
})
