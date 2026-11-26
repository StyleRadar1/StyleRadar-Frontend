import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient } from '@/modules/core/api/apiClient'
import { alertService } from '@/modules/soporte/services/alertService'
import ItemDetailPage from '../pages/ItemDetailPage'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/catalogo/:id', element: <ItemDetailPage /> },
  { path: '/probador', element: <div>Pantalla Probador</div> },
]

describe('ItemDetailPage (RF-16, RF-22, RF-57)', () => {
  it('carga la prenda por ID y muestra información, tienda y precio', async () => {
    renderAt('/catalogo/p1', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Blazer oversize/i })).toBeInTheDocument()
      expect(screen.getAllByText(/Nómada Studio/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Usaquén/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/Disponibilidad en tienda real/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Favorito/i })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Ver tienda/i })).toHaveClass('w-full')
    })
  })

  it('permite seleccionar talla interactiva', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo/p1', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Blazer oversize/i })).toBeInTheDocument()
    })

    const botonTallaM = screen.getByRole('radio', { name: /^M$/i })
    await user.click(botonTallaM)
    expect(botonTallaM).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(/Talla elegida: M/i)).toBeInTheDocument()
  })

  it('incluye enlace directo para probarse la prenda en el probador virtual (RF-57)', async () => {
    renderAt('/catalogo/p1', routes)

    await waitFor(() => {
      const btnProbar = screen.getByRole('link', { name: /Probarme esta prenda en el probador/i })
      expect(btnProbar).toBeInTheDocument()
      expect(btnProbar).toHaveAttribute('href', expect.stringContaining('/probador?prenda=p1'))
    })
  })

  it('activa zoom interactivo en la imagen principal al pulsar Zoom textura y lo desactiva con Cerrar zoom', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo/p1', routes)

    const zoomBtn = await screen.findByRole('button', { name: /Inspeccionar textura \/ Zoom/i })
    const img = screen.getByAltText(/Blazer oversize/i)
    expect(img).toHaveAttribute('data-zoom-active', 'false')

    await user.click(zoomBtn)
    expect(img).toHaveAttribute('data-zoom-active', 'true')
    expect(img.style.transform).toBe('scale(2.3)')
    expect(img.className).not.toContain('sr-hero-image-animate')
    expect(screen.getByText(/Mueve el cursor para inspeccionar/i)).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /Desactivar zoom/i })
    await user.click(closeBtn)
    expect(img).toHaveAttribute('data-zoom-active', 'false')
    expect(img.style.transform).toBe('')
  })
})

describe('ItemDetailPage sin mocks (VITE_USE_MOCKS=false)', () => {
  let prevMocks: boolean

  beforeEach(() => {
    prevMocks = env.useMocks
    env.useMocks = false
  })

  afterEach(() => {
    env.useMocks = prevMocks
    vi.restoreAllMocks()
  })

  it('consulta tallas reales en GET /api/v1/inventory/garments/{id}', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/garments/p-qa-1') {
        return {
          data: {
            id: 'p-qa-1',
            nombre: 'Chaqueta QA',
            tipo: 'Chaqueta',
            color: 'Negro',
            estilo: 'URBANO',
            precio: 150000,
            tallas: [],
            fotografias: [],
          },
        } as never
      }
      if (url === '/api/v1/garments/p-qa-1/similar') {
        return { data: [] } as never
      }
      if (url === '/api/v1/inventory/garments/p-qa-1') {
        return {
          data: {
            sedes: [
              {
                activo: true,
                variantes: [{ talla: 'M', stockDisponible: 4 }],
              },
            ],
          },
        } as never
      }
      throw new Error(`Unexpected URL ${url}`)
    })

    renderAt('/catalogo/p-qa-1', routes)

    expect(await screen.findByRole('heading', { level: 1, name: /Chaqueta QA/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^M$/i })).toBeInTheDocument()

    const calledUrls = getSpy.mock.calls.map(([url]) => url)
    expect(calledUrls).toContain('/api/v1/inventory/garments/p-qa-1')
    expect(calledUrls).not.toContain('/api/v1/inventario/prenda/p-qa-1')
  })

  it('una talla agotada sigue visible y se puede elegir para pedir el aviso; no se puede reservar', async () => {
    const user = userEvent.setup()
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/garments/p-qa-2') {
        // Catálogo solo lista las tallas con stock: la S ya no viene
        return { data: { id: 'p-qa-2', nombre: 'Camisa QA', tipo: 'Camisa', color: 'Blanco', estilo: 'CASUAL', precio: 90000, tallas: ['M', 'L'], fotografias: [] } } as never
      }
      if (url === '/api/v1/garments/p-qa-2/similar') return { data: [] } as never
      if (url === '/api/v1/inventory/garments/p-qa-2') {
        return { data: { sedes: [{ activo: true, variantes: [{ talla: 'S', stockDisponible: 0 }, { talla: 'M', stockDisponible: 3 }, { talla: 'L', stockDisponible: 1 }] }] } } as never
      }
      throw new Error(`Unexpected URL ${url}`)
    })

    renderAt('/catalogo/p-qa-2', routes)

    const s = await screen.findByRole('radio', { name: /^S, agotada/ })
    expect(s).toBeEnabled()
    // Orden natural: S antes que M y L
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['S', 'M', 'L'])

    await user.click(s)
    expect(screen.getByText(/Talla elegida: S · agotada/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reservar en tienda' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Avisarme cuando llegue' })).toBeEnabled()

    // Una talla con stock se reserva con normalidad
    await user.click(screen.getByRole('radio', { name: /^M$/ }))
    expect(screen.getByRole('button', { name: 'Reservar en tienda' })).toBeEnabled()
  })

  it('la alerta de una talla agotada se crea con esa talla (avísame cuando vuelva la S)', async () => {
    const user = userEvent.setup()
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/garments/p-qa-3') return { data: { id: 'p-qa-3', nombre: 'Hoodie QA', tipo: 'Buzo', color: 'Gris', estilo: 'CASUAL', precio: 100000, tallas: ['L', 'XL', 'M'], fotografias: [] } } as never
      if (url === '/api/v1/garments/p-qa-3/similar') return { data: [] } as never
      if (url === '/api/v1/inventory/garments/p-qa-3') {
        return { data: { sedes: [{ activo: true, variantes: [{ talla: 'L', stockDisponible: 10 }, { talla: 'XL', stockDisponible: 6 }, { talla: 'M', stockDisponible: 8 }, { talla: 'S', stockDisponible: 0 }] }] } } as never
      }
      throw new Error(`Unexpected URL ${url}`)
    })
    const crear = vi.spyOn(alertService, 'createAlert').mockResolvedValue({ id: 'al-1', prendaId: 'p-qa-3', prenda: 'Hoodie QA · talla S', tienda: 'T', activa: true, creadaEn: '2026-11-26T10:00:00Z' } as never)
    vi.spyOn(alertService, 'check').mockResolvedValue({ suscrita: false })

    renderAt('/catalogo/p-qa-3', routes)

    // Aunque el back las entregue como L, XL, M, se ven en orden y la S agotada sigue ahí
    await screen.findByRole('radio', { name: /^S, agotada/ })
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['S', 'M', 'L', 'XL'])

    await user.click(screen.getByRole('radio', { name: /^S, agotada/ }))
    await user.click(screen.getByRole('button', { name: 'Avisarme cuando llegue' }))
    expect(crear).toHaveBeenCalledWith('p-qa-3', 'Hoodie QA', expect.any(String), 'S')
  })

  it('las tallas salen en orden S, M, L, XL aunque el back las entregue en otro', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/garments/p-qa-4') return { data: { id: 'p-qa-4', nombre: 'Buzo QA', tipo: 'Buzo', color: 'Gris', estilo: 'CASUAL', precio: 100000, tallas: ['L', 'XL', 'M'], fotografias: [] } } as never
      if (url === '/api/v1/garments/p-qa-4/similar') return { data: [] } as never
      if (url === '/api/v1/inventory/garments/p-qa-4') return { data: { sedes: [{ activo: true, variantes: [{ talla: 'L', stockDisponible: 1 }, { talla: 'XL', stockDisponible: 1 }, { talla: 'M', stockDisponible: 1 }] }] } } as never
      throw new Error(`Unexpected URL ${url}`)
    })
    renderAt('/catalogo/p-qa-4', routes)
    await screen.findByRole('radio', { name: /^M$/ })
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['M', 'L', 'XL'])
  })
})

