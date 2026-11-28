import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { storePublicService } from '../services/storePublicService'
import StorePage from '../pages/StorePage'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/tiendas/:id', element: <StorePage /> },
  { path: '/catalogo', element: <div>Pantalla Catálogo</div> },
]

describe('StorePage - Vista pública de tienda (Rol Comprador)', () => {
  it('muestra la información real, hero, aviso y prendas de una tienda existente', async () => {
    renderAt('/tiendas/luna', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Luna Store/i })).toBeInTheDocument()
    })

    // Barra de aviso con horario
    expect(screen.getByText(/Abierto hoy/i)).toBeInTheDocument()

    // Botones del hero
    expect(screen.getByRole('link', { name: /Ver prendas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cómo llegar/i })).toBeInTheDocument()

    // Sección de categorías en arco
    expect(screen.getByRole('heading', { level: 2, name: /Elige tu estilo favorito/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Todas las prendas/i })).toBeInTheDocument()

    // Sección de prendas de la tienda
    expect(screen.getByRole('heading', { level: 2, name: /Prendas de Luna Store/i })).toBeInTheDocument()

    // Bloque editorial y cifras
    expect(screen.getByRole('heading', { level: 2, name: /Moda consciente con identidad bogotana/i })).toBeInTheDocument()
    expect(screen.getByText(/Prendas activas/i)).toBeInTheDocument()
    expect(screen.getByText(/Aliada en StyleRadar/i)).toBeInTheDocument()

    // Contacto e información
    expect(screen.getAllByText(/Cra. 13 #57-22, Chapinero/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/\+57 601 555 0123/i)).toBeInTheDocument()
  })

  it('permite filtrar prendas por categoría y volver a ver todas', async () => {
    const user = userEvent.setup()
    renderAt('/tiendas/luna', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Luna Store/i })).toBeInTheDocument()
    })

    // Buscar una categoría disponible en Luna Store
    const catBuzo = screen.queryByRole('button', { name: /Buzos & Hoodies/i })
    if (catBuzo) {
      await user.click(catBuzo)
      // Debe mostrar filtro activo
      expect(screen.getByRole('button', { name: /Ver todas/i })).toBeInTheDocument()

      // Restaurar todas
      await user.click(screen.getByRole('button', { name: /Ver todas/i }))
      expect(screen.queryByRole('button', { name: /Ver todas/i })).not.toBeInTheDocument()
    }
  })

  it('muestra estado vacío claro con botón al catálogo si la tienda no existe', async () => {
    renderAt('/tiendas/tienda-inexistente-xyz', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Tienda no encontrada/i })).toBeInTheDocument()
    })

    const btnVolver = screen.getByRole('link', { name: /Volver al catálogo/i })
    expect(btnVolver).toBeInTheDocument()
    expect(btnVolver).toHaveAttribute('href', '/catalogo')
  })
})

describe('StorePage & storePublicService sin mocks (VITE_USE_MOCKS=false)', () => {
  let prevMocks: boolean

  beforeEach(() => {
    prevMocks = env.useMocks
    env.useMocks = false
  })

  afterEach(() => {
    env.useMocks = prevMocks
    vi.restoreAllMocks()
  })

  it('getAllAsync devuelve [] cuando el backend responde vacío y rechaza si falla, sin caer a mocks', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: { content: [] } } as never)
    const empty = await storePublicService.getAllAsync()
    expect(empty).toEqual([])
    expect(getSpy).toHaveBeenCalledWith('/api/v1/stores', { params: { page: 0, size: 100 } })

    getSpy.mockRejectedValueOnce(new ApiError(500, 'Error interno'))
    await expect(storePublicService.getAllAsync()).rejects.toThrow('Error interno')
  })

  it('getByIdAsync devuelve null en 404 y propaga 500 sin caer a mocks aunque el id coincida con un mock', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.startsWith('/api/v1/stores/')) throw new ApiError(404, 'No encontrada')
      return { data: [] } as never
    })
    expect(await storePublicService.getByIdAsync('luna')).toBeNull()

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.startsWith('/api/v1/stores/')) throw new ApiError(500, 'Servidor caído')
      return { data: [] } as never
    })
    await expect(storePublicService.getByIdAsync('luna')).rejects.toThrow('Servidor caído')
  })

  it('StorePage muestra ErrorState con reintento si el backend falla, sin mostrar Luna Store de prueba', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.startsWith('/api/v1/stores/')) throw new ApiError(500, 'No disponible')
      return { data: [] } as never
    })

    renderAt('/tiendas/luna', routes)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByText(/No pudimos cargar la tienda/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: /Luna Store/i })).not.toBeInTheDocument()
  })

  it('cuando /api/v1/stores/{uuid} responde 404 resuelve datos reales desde GET /api/v1/stores y GET /api/v1/stores/{uuid}/catalog sin llamar GET /api/v1/almacenes/{id}', async () => {
    const uuid = 'fc942335-ab30-350a-b6a5-577cf0ca2fb5'
    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === `/api/v1/stores/${uuid}`) throw new ApiError(404, 'No encontrada')
      if (url === '/api/v1/stores') {
        return {
          data: [
            {
              id: uuid,
              nombre: 'Almacén Pruebas QA',
              categoria: 'Casual',
              latitud: 4.6533,
              longitud: -74.0602,
            },
          ],
        } as never
      }
      if (url === `/api/v1/stores/${uuid}/catalog`) {
        return {
          data: [
            {
              id: 'prenda-qa-1',
              nombre: 'Camiseta QA',
              tipo: 'Camiseta',
              color: 'Blanco',
              estilo: 'CASUAL',
              precio: 50000,
              tallas: ['M'],
              fotografias: [],
            },
          ],
        } as never
      }
      return { data: [] } as never
    })

    const store = await storePublicService.getByIdAsync(uuid)

    expect(store).not.toBeNull()
    expect(store?.nombre).toBe('Almacén Pruebas QA')
    expect(store?.categoria).toBe('Casual')
    expect(store?.lngLat).toEqual([-74.0602, 4.6533])
    expect(store?.prendas.map((p) => p.nombre)).toEqual(['Camiseta QA'])
    const calledUrls = getSpy.mock.calls.map(([url]) => url)
    expect(calledUrls).not.toContain(`/api/v1/almacenes/${uuid}`)
  })

  it('R2: sin marca de agua y deduplica el kicker cuando barrio es Bogotá o distinto', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/900111222') {
        return {
          data: {
            nit: '900111222',
            tradeName: 'Almacén Pruebas',
            barrio: 'Bogotá',
            verificationStatus: 'APPROVED',
          },
        } as never
      }
      return { data: [] } as never
    })
    const { container, unmount } = renderAt('/tiendas/900111222', routes)
    expect(await screen.findByRole('heading', { level: 1, name: /Almacén Pruebas/i })).toBeInTheDocument()
    expect(container.querySelector('.sr-store-hero__watermark')).toBeNull()
    expect(screen.getByText('TIENDA LOCAL · BOGOTÁ')).toBeInTheDocument()
    expect(screen.queryByText(/BOGOTÁ · BOGOTÁ/i)).not.toBeInTheDocument()
    unmount()

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/900111333') {
        return {
          data: {
            nit: '900111333',
            tradeName: 'Tienda Chapinero',
            barrio: 'Chapinero',
            verificationStatus: 'APPROVED',
          },
        } as never
      }
      return { data: [] } as never
    })
    renderAt('/tiendas/900111333', routes)
    expect(await screen.findByText('TIENDA LOCAL · BOGOTÁ · CHAPINERO')).toBeInTheDocument()
  })

  it('R3: 0 fotos oculta Sección 5B y evita <img src="">; 2 fotos oculta Sección 5B; 4 fotos muestra píldora, visor panorámico y lightbox accesible', async () => {
    // Caso N = 0
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/900000000') {
        return { data: { nit: '900000000', tradeName: 'Sin Fotos', verificationStatus: 'APPROVED' } } as never
      }
      return { data: [] } as never
    })
    const r0 = renderAt('/tiendas/900000000', routes)
    expect(await screen.findByRole('heading', { level: 1, name: 'Sin Fotos' })).toBeInTheDocument()
    expect(r0.container.querySelector('.sr-store-gallery-section')).toBeNull()
    expect(r0.container.querySelector('img[src=""]')).toBeNull()
    r0.unmount()

    // Caso N = 2
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/900000002') {
        return { data: { nit: '900000002', tradeName: 'Dos Fotos', verificationStatus: 'APPROVED' } } as never
      }
      if (url === '/api/v1/stores/900000002/photos') {
        return {
          data: [
            { id: 1, storeNit: '900000002', url: 'https://img.test/1.jpg', position: 1, cover: true },
            { id: 2, storeNit: '900000002', url: 'https://img.test/2.jpg', position: 2, cover: false },
          ],
        } as never
      }
      return { data: [] } as never
    })
    const r2 = renderAt('/tiendas/900000002', routes)
    expect(await screen.findByRole('heading', { level: 1, name: 'Dos Fotos' })).toBeInTheDocument()
    expect(r2.container.querySelector('.sr-store-gallery-section')).toBeNull()
    r2.unmount()

    // Caso N = 4
    const user = userEvent.setup()
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/stores/900000004') {
        return { data: { nit: '900000004', tradeName: 'Cuatro Fotos', verificationStatus: 'APPROVED' } } as never
      }
      if (url === '/api/v1/stores/900000004/photos') {
        return {
          data: [
            { id: 1, storeNit: '900000004', url: 'https://img.test/1.jpg', position: 1, cover: true },
            { id: 2, storeNit: '900000004', url: 'https://img.test/2.jpg', position: 2, cover: false },
            { id: 3, storeNit: '900000004', url: 'https://img.test/3.jpg', position: 3, cover: false },
            { id: 4, storeNit: '900000004', url: 'https://img.test/4.jpg', position: 4, cover: false },
          ],
        } as never
      }
      return { data: [] } as never
    })
    const r4 = renderAt('/tiendas/900000004', routes)
    const pill = await screen.findByRole('button', { name: /Ver 4 fotos/i })
    expect(pill).toBeInTheDocument()
    expect(r4.container.querySelectorAll('.sr-gallery-showcase__thumb')).toHaveLength(4)

    await user.click(pill)
    expect(screen.getByRole('dialog', { name: /Galería de Cuatro Fotos/i })).toBeInTheDocument()
    expect(screen.getByText(/Foto 1 de 4/i)).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByText(/Foto 2 de 4/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /Galería de Cuatro Fotos/i })).not.toBeInTheDocument()
  })
})
