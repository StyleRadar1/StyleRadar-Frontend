import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient } from '@/modules/core/api/apiClient'
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
})

