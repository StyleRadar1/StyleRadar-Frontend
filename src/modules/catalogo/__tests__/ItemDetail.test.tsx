import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
      expect(screen.getByText(/Nómada Studio/i)).toBeInTheDocument()
      expect(screen.getByText(/Usaquén/i)).toBeInTheDocument()
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

