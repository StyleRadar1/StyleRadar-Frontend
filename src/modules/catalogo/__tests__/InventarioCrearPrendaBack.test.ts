import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient } from '@/modules/core/api/apiClient'
import { inventoryService } from '../services/inventoryService'
import { aInstanteUtc } from '../utils/instante'

/** Lo que Catálogo devuelve hoy al crear una prenda: la fecha SIN zona horaria. */
const PRENDA_CREADA = {
  id: '71cfa7f9-22b6-4b32-bb7f-7593eb699799', almacenId: 'fc942335-ab30-350a-b6a5-577cf0ca2fb5', nombre: 'Prueba historial 1', tipo: 'Saco',
  color: 'Negro', marca: 'Almacén Pruebas QA', estilo: 'Urbano', precio: 120000, fotografias: ['https://picsum.photos/seed/prueba1/600'],
  estado: 'PENDIENTE', disponible: true, fechaPublicacion: '2026-11-26T17:10:35.253406887', storeNit: '900555777-1',
}
const DTO = { nombre: 'Prueba historial 1', tipo: 'Saco', color: 'Negro', estilo: 'Urbano', precio: 120000, fotografias: ['https://picsum.photos/seed/prueba1/600'], stockPorTalla: { XS: 0, S: 2, M: 4, L: 2, XL: 0, XXL: 0 }, tipoPrenda: 'ROPA' as const, sedeId: 'sede-1' }

describe('crear una prenda desde el perfil de tienda: el stock inicial no se rechaza por la fecha', () => {
  afterEach(() => vi.restoreAllMocks())

  it('la fecha sin zona de Catálogo llega a Inventario como instante UTC (con «Z»)', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: PRENDA_CREADA } as never).mockResolvedValueOnce({ data: {} } as never)
    await inventoryService.addItem(DTO)
    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/garments', expect.objectContaining({ nombre: 'Prueba historial 1', tipo: 'Saco' }))
    const [ruta, lote] = post.mock.calls[1] as [string, { fechaPublicacion: string; prendaId: string; tallas: unknown[] }]
    expect(ruta).toBe('/api/v1/inventory/batch')
    expect(lote.fechaPublicacion).toBe('2026-11-26T17:10:35.253406887Z')
    expect(Number.isNaN(Date.parse(lote.fechaPublicacion))).toBe(false)
    expect(lote.prendaId).toBe(PRENDA_CREADA.id)
    expect(lote.tallas).toEqual(expect.arrayContaining([{ talla: 'S', cantidad: 2 }, { talla: 'M', cantidad: 4 }, { talla: 'L', cantidad: 2 }]))
  })

  it('si Catálogo no trae fecha, usa la hora actual', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { ...PRENDA_CREADA, fechaPublicacion: undefined } } as never).mockResolvedValueOnce({ data: {} } as never)
    await inventoryService.addItem(DTO)
    const lote = post.mock.calls[1][1] as { fechaPublicacion: string }
    expect(lote.fechaPublicacion).toMatch(/Z$/)
  })

  it('aInstanteUtc: agrega la Z solo cuando falta zona', () => {
    expect(aInstanteUtc('2026-11-26T17:10:35')).toBe('2026-11-26T17:10:35Z')
    expect(aInstanteUtc('2026-11-26T17:10:35.253406887')).toBe('2026-11-26T17:10:35.253406887Z')
    expect(aInstanteUtc('2026-11-26T17:10:35Z')).toBe('2026-11-26T17:10:35Z')
    expect(aInstanteUtc('2026-11-26T12:10:35-05:00')).toBe('2026-11-26T12:10:35-05:00')
    expect(aInstanteUtc('2026-11-26T12:10:35+0000')).toBe('2026-11-26T12:10:35+0000')
    expect(aInstanteUtc(undefined)).toMatch(/Z$/)
    expect(aInstanteUtc('  ')).toMatch(/Z$/)
    expect(aInstanteUtc(123)).toMatch(/Z$/)
  })
})
