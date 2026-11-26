import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { feedService } from '@/modules/identidad/services/feedService'
import { TEXTOS_FEED } from '@/modules/identidad/types/feed.dto'
import CatalogPage from '../pages/CatalogPage'
import { itemService } from '../services/itemService'
import { loginAs, renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/catalogo', element: <CatalogPage /> },
  { path: '/catalogo/:id', element: <div>Detalle Prenda</div> },
]

describe('CatalogPage - Filtros unificados y Ordenar alineado con el back', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('renderiza encabezado limpio sin chips superiores y sin sección Para ti', async () => {
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    // NO debe estar la barra superior de chips de categorías/estilos
    expect(screen.queryByRole('button', { name: /^Formal$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Casual$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Sport$/i })).not.toBeInTheDocument()

    // NO debe estar la sección de Para ti / recomendados
    expect(screen.queryByRole('heading', { name: /Recomendado según tu perfil/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Porque te gusta Formal, Casual, Urbana/i)).not.toBeInTheDocument()

    // Botón de guardar búsqueda
    expect(screen.getByRole('button', { name: /Guardar búsqueda/i })).toBeInTheDocument()
  })

  it('el selector Ordenar ofrece solo las 3 opciones del back: Más recientes, Mejor calificadas y Cercanía', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    // NO debe haber select nativo ni botón independiente de Más cerca
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /✓ MÁS CERCA/i })).not.toBeInTheDocument()

    // Botón custom de Ordenar
    const btnOrdenar = screen.getByRole('button', { name: /Ordenar resultados/i })
    expect(btnOrdenar).toBeInTheDocument()

    // Al abrir el menú de ordenamiento muestra las 3 opciones unificadas y no "Recomendados"
    await user.click(btnOrdenar)
    expect(screen.getByRole('button', { name: /^Más recientes$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Mejor calificadas$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Cercanía$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Recomendados$/i })).not.toBeInTheDocument()
  })

  it('la barra horizontal despliega filtros al pasar el cursor, muestra listas unificadas sin Cerca de y maneja puntos activos y Limpiar (N)', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    // La barra horizontal muestra las 7 categorías sin "Cerca de" y con "Filtros" inicial
    expect(screen.getByText(/^Filtros$/i)).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /^Cerca de$/i })).not.toBeInTheDocument()

    // Desplegar pasando el cursor sobre Tipo de prenda (sin clickear)
    await user.hover(screen.getByRole('tab', { name: /^Tipo de prenda$/i }))
    expect(screen.getByRole('heading', { level: 3, name: /^Tipo de prenda$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Camiseta$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Falda$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Conjunto$/i })).toBeInTheDocument()

    // Tallas agrupadas por tipo de talla (XXL, 26, 45, Única)
    await user.hover(screen.getByRole('tab', { name: /^Talla$/i }))
    expect(screen.getByRole('heading', { level: 3, name: /^Talla disponible$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^XXL$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^26$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^45$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Única$/i })).toBeInTheDocument()

    // Colores unificados (incluye Beige y Plata)
    await user.hover(screen.getByRole('tab', { name: /^Color$/i }))
    expect(screen.getByRole('button', { name: /^Beige$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Plata$/i })).toBeInTheDocument()

    // 11 Marcas / tiendas unificadas
    await user.hover(screen.getByRole('tab', { name: /^Marca$/i }))
    expect(screen.getByRole('button', { name: /^Ropero 57$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Sastrería Antonia$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Nora Vintage$/i })).toBeInTheDocument()

    // 5 Estilos unificados y puntos iluminados + Limpiar (N)
    await user.hover(screen.getByRole('tab', { name: /^Estilo$/i }))
    expect(screen.getByRole('button', { name: /^Casual$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Formal$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Deportivo$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Urbano$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Vintage$/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Urbano$/i }))
    expect(screen.getByLabelText('Filtro activo en Estilo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Limpiar todos los filtros/i })).toHaveTextContent('Limpiar (1)')
    expect(screen.getByText('1 filtro aplicado')).toBeInTheDocument()

    // "Quitar este filtro" limpia la categoría activa
    await user.click(screen.getByRole('button', { name: /^Quitar este filtro$/i }))
    expect(screen.queryByLabelText('Filtro activo en Estilo')).not.toBeInTheDocument()
    expect(screen.getByText(/^Filtros$/i)).toBeInTheDocument()

    // Seleccionar filtro y verificar plegado al salir el cursor
    await user.hover(screen.getByRole('tab', { name: /^Tipo de prenda$/i }))
    await user.click(screen.getByRole('button', { name: /^Buzo$/i }))
    expect(screen.getByRole('button', { name: /Limpiar todos los filtros/i })).toHaveTextContent('Limpiar (1)')
    await user.unhover(screen.getByRole('tabpanel'))
    await waitFor(() => {
      expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
    })

    // Pulsar Limpiar (1) limpia todos los filtros
    await user.click(screen.getByRole('button', { name: /Limpiar todos los filtros/i }))
    expect(screen.getByText(/^Filtros$/i)).toBeInTheDocument()
  })

  it('permite filtrar por Estilo unificado y muestra el chip correspondiente', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    await user.hover(screen.getByRole('tab', { name: /^Estilo$/i }))
    await user.click(screen.getByRole('button', { name: /^Urbano$/i }))
    await user.click(screen.getByRole('button', { name: /^Aplicar filtros$/i }))

    expect(screen.getByText(/Estilo: Urbano/i)).toBeInTheDocument()
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
  })

  it('permite guardar la búsqueda y activa su alerta', async () => {
    const user = userEvent.setup()
    loginAs('u-1', 'Valentina Rojas')
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    const btnGuardar = screen.getByRole('button', { name: /Guardar búsqueda/i })
    await user.click(btnGuardar)

    expect(await screen.findByText('Guardamos «Catálogo completo»')).toBeInTheDocument()
  })

  it('muestra estado vacío propio cuando no hay ninguna prenda en el catálogo (sin filtros)', async () => {
    vi.spyOn(itemService, 'search').mockResolvedValue([])
    renderAt('/catalogo', routes)

    expect(await screen.findByRole('heading', { level: 3, name: /Aún no hay prendas en el catálogo/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Quitar filtros/i })).not.toBeInTheDocument()
  })

  it('muestra estado vacío de filtros con botón Quitar filtros cuando la búsqueda no arroja resultados', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox', { name: /Buscar prendas/i })
    await user.type(input, 'prenda-que-no-existe-xyz')
    await user.click(screen.getByRole('button', { name: /^Buscar$/i }))

    expect(await screen.findByRole('heading', { level: 3, name: /No encontramos prendas con esos filtros/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quitar filtros/i })).toBeInTheDocument()
  })

  it('para comprador autenticado muestra las pestañas Todas las prendas / Para ti sin el perchero de recomendados', async () => {
    const user = userEvent.setup()
    vi.spyOn(feedService, 'getRecommendations').mockResolvedValue({
      content: [
        {
          itemId: 'rec-1',
          garmentId: 101,
          storeId: 'store-1',
          name: 'Blazer lino arena',
          garmentType: 'TOP',
          brand: 'Luna Store',
          style: 'FORMAL',
          price: 185000,
          stock: 3,
          status: 'AVAILABLE',
          publishedAt: '2026-11-20T12:00:00Z',
          photos: ['https://example.com/blazer.jpg'],
          availableSizes: ['M'],
          reason: 'Tu estilo Formal y tu talla M',
        },
      ],
      page: 0,
      size: 8,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      generalWithoutPreferences: false,
      message: TEXTOS_FEED.conPerfil,
    })
    const feedSpy = vi.spyOn(feedService, 'getFeed').mockResolvedValue({
      content: [
        {
          itemId: 'feed-1',
          garmentId: 202,
          storeId: 'store-1',
          name: 'Jean recto talla M',
          garmentType: 'BOTTOM',
          brand: 'Norte Denim',
          style: 'CASUAL',
          price: 140000,
          stock: 2,
          status: 'AVAILABLE',
          publishedAt: '2026-11-21T12:00:00Z',
          photos: ['https://example.com/jean.jpg'],
          availableSizes: ['30'],
        },
      ],
      page: 0,
      size: 8,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    })

    render(
      <AuthContext.Provider
        value={{
          user: { id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co', role: 'BUYER' },
          login: async () => ({ kind: 'session', user: { id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co', role: 'BUYER' } }),
          register: async () => ({ kind: 'session', user: { id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co', role: 'BUYER' } }),
          verifyOtp: async () => ({ id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co', role: 'BUYER' }),
          updateUser: () => {},
          loginWithGoogle: async () => ({ id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co', role: 'BUYER' }),
          logout: () => {},
        }}
      >
        <MemoryRouter initialEntries={['/catalogo']}>
          <Routes>{routes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}</Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Todas las prendas/i })).toBeInTheDocument()
    })
    expect(screen.queryByRole('region', { name: /prendas recomendadas/i })).not.toBeInTheDocument()

    // Bloque 2: Pestañas "Todas las prendas" (activa) y "Para ti"
    const tabTodas = screen.getByRole('tab', { name: /Todas las prendas/i })
    const tabParaTi = screen.getByRole('tab', { name: /^Para ti$/i })
    expect(tabTodas).toHaveAttribute('aria-selected', 'true')

    await user.click(tabParaTi)
    expect(tabParaTi).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('Jean recto talla M')).toBeInTheDocument()
    expect(feedSpy).toHaveBeenCalledWith('u-1', { page: 0, size: 8 })

    await user.type(screen.getByRole('textbox', { name: /Buscar prendas/i }), 'prenda-sin-resultados')
    await user.click(screen.getByRole('button', { name: /^Buscar$/i }))
    expect(await screen.findByRole('heading', { level: 3, name: /No encontramos prendas con esos filtros/i })).toBeInTheDocument()
  })
})
