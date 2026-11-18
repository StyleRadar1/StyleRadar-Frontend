import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CatalogPage from '../pages/CatalogPage'
import { loginAs, renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/catalogo', element: <CatalogPage /> },
  { path: '/catalogo/:id', element: <div>Detalle Prenda</div> },
]

describe('CatalogPage - Filtros unificados y Ordenar alineado con el back', () => {
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

  it('el panel de Filtros muestra listas unificadas (12 tipos, 8 colores, 11 marcas, 5 estilos, tallas agrupadas) sin Cerca de por barrio', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    const botonFiltros = screen.getByRole('button', { name: /Filtros del catálogo/i })
    await user.click(botonFiltros)

    // Título del menú desplegable
    expect(screen.getByRole('heading', { level: 3, name: /Filtrar catálogo/i })).toBeInTheDocument()

    // Categorías sin Cerca de por barrio
    expect(screen.queryByRole('tab', { name: /^Cerca de$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tipo de prenda/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Camiseta$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Falda$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Conjunto$/i })).toBeInTheDocument()

    // Tallas agrupadas por tipo de talla (XXL, 26, 45, Única)
    await user.click(screen.getByRole('tab', { name: /Talla disponible/i }))
    expect(screen.getByRole('button', { name: /^XXL$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^26$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^45$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Única$/i })).toBeInTheDocument()

    // Colores unificados (incluye Beige y Plata)
    await user.click(screen.getByRole('tab', { name: /^Color$/i }))
    expect(screen.getByRole('button', { name: /^Beige$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Plata$/i })).toBeInTheDocument()

    // 11 Marcas / tiendas unificadas
    await user.click(screen.getByRole('tab', { name: /^Marca$/i }))
    expect(screen.getByRole('button', { name: /^Ropero 57$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Sastrería Antonia$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Nora Vintage$/i })).toBeInTheDocument()

    // 5 Estilos unificados
    await user.click(screen.getByRole('tab', { name: /^Estilo$/i }))
    expect(screen.getByRole('button', { name: /^Casual$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Formal$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Deportivo$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Urbano$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Vintage$/i })).toBeInTheDocument()
  })

  it('permite filtrar por Estilo unificado y muestra el chip correspondiente', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Filtros del catálogo/i }))
    await user.click(screen.getByRole('tab', { name: /^Estilo$/i }))
    await user.click(screen.getByRole('button', { name: /^Urbano$/i }))
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }))

    expect(screen.getByText(/Estilo: Urbano/i)).toBeInTheDocument()
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
})
