import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/configs/env', () => ({ env: { appEnvironment: 'qa', apiUrl: 'http://gateway.test', useMocks: false } }))

import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { renderConSesion, sesionComo } from '@/modules/identidad/__tests__/helpers'
import MiTiendaPage from '../pages/MiTiendaPage'
import { storePublicService } from '../services/storePublicService'
import { storeSettingsService } from '../services/storeSettingsService'
import type { StoreResponseDto } from '../types/store.dto'

const LUNA: StoreResponseDto = {
  nit: '9014823371', tradeName: 'Luna Store Chapinero', description: 'Moda urbana en Chapinero.', phone: '+57 601 555 0199',
  contactEmail: 'hola@lunastore.co', latitude: 4.64, longitude: -74.06, rating: 4.7, categories: ['Urbano', 'Deportivo'],
  verificationStatus: 'APPROVED',
}

/** Responde según la ruta; lo que no es de ms-tiendas (catálogo y novedades) llega vacío. */
const porRuta = (rutas: Record<string, unknown>) => vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
  if (url in rutas) {
    const r = rutas[url]
    if (r instanceof Error) throw r
    return { data: r }
  }
  return { data: [] }
})

describe('ms-tiendas: perfil público y almacén de la Tienda (F-19 · F-22)', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
  afterEach(() => { vi.restoreAllMocks() })

  it('el perfil público se pide por NIT a /api/v1/stores/{nit} y usa los campos en inglés', async () => {
    const get = porRuta({ '/api/v1/stores/9014823371': LUNA })
    const t = await storePublicService.getByIdAsync('9014823371')
    expect(get).toHaveBeenCalledWith('/api/v1/stores/9014823371')
    expect(get.mock.calls.some(([u]) => String(u).includes('/almacenes/9014823371') && !String(u).includes('/catalogo') && !String(u).includes('/novedades'))).toBe(false)
    expect(t).toMatchObject({
      id: '9014823371', nit: '9014823371', nombre: 'Luna Store Chapinero', categoria: 'Urbano', descripcion: 'Moda urbana en Chapinero.',
      telefono: '+57 601 555 0199', correo: 'hola@lunastore.co', rating: '4,7', verificacion: 'Verificada', lngLat: [-74.06, 4.64],
    })
  })

  it('la lista de almacenes lee content[] de GET /api/v1/stores', async () => {
    const get = porRuta({ '/api/v1/stores': { content: [LUNA], page: 0, size: 100, totalElements: 1, totalPages: 1, first: true, last: true } })
    const lista = await storePublicService.getAllAsync()
    expect(get).toHaveBeenCalledWith('/api/v1/stores', { params: { page: 0, size: 100 } })
    expect(lista).toHaveLength(1)
    expect(lista[0]).toMatchObject({ id: '9014823371', nombre: 'Luna Store Chapinero', verificacion: 'Verificada' })
  })

  it('el almacén de la Tienda sale de GET /api/v1/users/{userId}/store', async () => {
    const get = porRuta({ '/api/v1/users/t-1/store': LUNA })
    expect(await storeSettingsService.getMyStore('t-1')).toMatchObject({ nit: '9014823371' })
    expect(get).toHaveBeenCalledWith('/api/v1/users/t-1/store')
  })

  it('Mi tienda muestra el NIT y el nombre que manda ms-tiendas', async () => {
    porRuta({ '/api/v1/users/t-1/store': LUNA })
    sesionComo('luna@styleradar.co')
    renderConSesion('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])
    expect((await screen.findAllByText('9014823371')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Luna Store Chapinero').length).toBeGreaterThan(0)
  })

  it('las reglas de distintivos usan /api/v1/stores/{nit}/catalog-settings con los nombres del documento', async () => {
    const get = porRuta({ '/api/v1/stores/9014823371/catalog-settings': { nit: '9014823371', lowStockThreshold: 5, newArrivalDays: 14 } })
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { nit: '9014823371', lowStockThreshold: 8, newArrivalDays: 30 } })
    expect(await storeSettingsService.getCatalogSettings('9014823371')).toMatchObject({ lowStockThreshold: 5, newArrivalDays: 14 })
    expect(get).toHaveBeenCalledWith('/api/v1/stores/9014823371/catalog-settings')
    await storeSettingsService.saveCatalogSettings('9014823371', { lowStockThreshold: 8, newArrivalDays: 30 })
    expect(put).toHaveBeenCalledWith('/api/v1/stores/9014823371/catalog-settings', { lowStockThreshold: 8, newArrivalDays: 30 })
  })

  it('el distintivo de una prenda se pide con PATCH /items/{itemId}/low-stock y /new-arrival', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { activeBadge: 'NONE' } })
    await storeSettingsService.markLowStock('9014823371', 42, { currentStock: 2, available: true })
    expect(patch).toHaveBeenCalledWith('/api/v1/stores/9014823371/items/42/low-stock', { currentStock: 2, available: true })
    await storeSettingsService.markNewArrival('9014823371', 42, { publishedAt: '2026-11-20T10:00:00Z', withdrawn: false })
    expect(patch).toHaveBeenLastCalledWith('/api/v1/stores/9014823371/items/42/new-arrival', { publishedAt: '2026-11-20T10:00:00Z', withdrawn: false })
  })

  it('Mi tienda carga las reglas con el NIT del back y muestra los errores por campo del servidor (400)', async () => {
    porRuta({
      '/api/v1/users/t-1/store': LUNA,
      '/api/v1/stores/9014823371/catalog-settings': { nit: '9014823371', lowStockThreshold: 5, newArrivalDays: 14 },
    })
    vi.spyOn(apiClient, 'put').mockRejectedValue(new ApiError(400, 'Revisa los datos', { newArrivalDays: 'El periodo de nueva llegada no puede superar 60 días' }))
    const user = userEvent.setup()
    sesionComo('luna@styleradar.co')
    renderConSesion('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])
    expect(await screen.findByText('≤ 5 uds')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Configurar' }))
    const dialog = screen.getByRole('dialog', { name: 'Distintivos automáticos' })
    expect(within(dialog).getByLabelText('Duración de nueva llegada')).toHaveValue('14')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    expect(await within(dialog).findByText('El periodo de nueva llegada no puede superar 60 días')).toBeInTheDocument()
  })

  it('Mi tienda avisa si la cuenta no tiene almacén asociado (404)', async () => {
    porRuta({ '/api/v1/users/t-1/store': new ApiError(404, 'No existe') })
    sesionComo('luna@styleradar.co')
    renderConSesion('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])
    expect(await screen.findByText(/Tu cuenta todavía no tiene un almacén asociado/)).toBeInTheDocument()
  })
})
