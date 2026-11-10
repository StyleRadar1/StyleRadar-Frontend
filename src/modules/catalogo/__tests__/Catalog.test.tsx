import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CatalogPage from '../pages/CatalogPage'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [
  { path: '/catalogo', element: <CatalogPage /> },
  { path: '/catalogo/:id', element: <div>Detalle Prenda</div> },
]

describe('CatalogPage - Filtros compactos, Cerca de y Ordenar rediseñado', () => {
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

  it('el selector Ordenar tiene diseño de botón desplegable con la opción Cercanía', async () => {
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

    // Al abrir el menú de ordenamiento muestra "Cercanía"
    await user.click(btnOrdenar)
    expect(screen.getByRole('button', { name: /^Cercanía$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Recomendados$/i })).toBeInTheDocument()
  })

  it('el botón de Filtros abre menú compacto con Cerca de (No especificar primero, Cerca de mí segundo)', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    const botonFiltros = screen.getByRole('button', { name: /Filtros del catálogo/i })
    await user.click(botonFiltros)

    // Título del menú desplegable
    expect(screen.getByRole('heading', { level: 3, name: /Filtrar catálogo/i })).toBeInTheDocument()

    // Sección Cerca de
    expect(screen.getByText(/^Cerca de$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^No especificar$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Cerca de mí$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Chapinero$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Zona G$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Chicó$/i })).toBeInTheDocument()

    // Otras categorías en el menú
    expect(screen.getByText(/Tipo de prenda/i)).toBeInTheDocument()
    expect(screen.getByText(/Talla disponible/i)).toBeInTheDocument()
    expect(screen.getByText(/Rango de precio/i)).toBeInTheDocument()
    expect(screen.getByText(/^Origen$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Marca$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Color$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Estilo$/i)).toBeInTheDocument()
  })

  it('permite filtrar por Cerca de y muestra el chip correspondiente', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    // Abrir filtros
    await user.click(screen.getByRole('button', { name: /Filtros del catálogo/i }))

    // Seleccionar Chapinero
    await user.click(screen.getByRole('button', { name: /^Chapinero$/i }))

    // Aplicar filtros
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }))

    // Chip de filtro aplicado
    expect(screen.getByText(/Cerca de: Chapinero/i)).toBeInTheDocument()
  })

  it('permite guardar la búsqueda y muestra la notificación toast', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo', routes)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Todas las prendas/i })).toBeInTheDocument()
    })

    const btnGuardar = screen.getByRole('button', { name: /Guardar búsqueda/i })
    await user.click(btnGuardar)

    expect(screen.getByRole('status')).toHaveTextContent(/guardada en «Mis búsquedas y alertas»/i)
  })
})
