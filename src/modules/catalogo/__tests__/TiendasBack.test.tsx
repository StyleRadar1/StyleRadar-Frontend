import { screen } from '@testing-library/react'
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

  it('Mi tienda avisa si la cuenta no tiene almacén asociado (404)', async () => {
    porRuta({ '/api/v1/users/t-1/store': new ApiError(404, 'No existe') })
    sesionComo('luna@styleradar.co')
    renderConSesion('/mi-tienda', [{ path: '/mi-tienda', element: <MiTiendaPage /> }])
    expect(await screen.findByText(/Tu cuenta todavía no tiene un almacén asociado/)).toBeInTheDocument()
  })
})
