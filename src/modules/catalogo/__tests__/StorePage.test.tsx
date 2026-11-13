import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
