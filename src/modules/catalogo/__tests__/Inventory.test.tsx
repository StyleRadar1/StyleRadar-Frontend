import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import InventoryPage from '../pages/InventoryPage'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [{ path: '/tienda/inventario', element: <InventoryPage /> }]

describe('InventoryPage (RF-50 a RF-60)', () => {
  it('renderiza el encabezado del inventario y el resumen de métricas', async () => {
    renderAt('/tienda/inventario', routes)

    expect(screen.getByRole('heading', { name: /Inventario de la tienda/i })).toBeInTheDocument()
    expect(screen.getByText(/RF-50 a RF-60/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Chaqueta Denim Oversize/i)).toBeInTheDocument()
      expect(screen.getByText(/Total referencias/i)).toBeInTheDocument()
      expect(screen.getByText(/Unidades en stock/i)).toBeInTheDocument()
    })
  })

  it('permite filtrar por estado (Bajo stock)', async () => {
    const user = userEvent.setup()
    renderAt('/tienda/inventario', routes)

    await waitFor(() => {
      expect(screen.getByText(/Chaqueta Denim Oversize/i)).toBeInTheDocument()
    })

    const tabBajoStock = screen.getByRole('tab', { name: /Bajo stock/i })
    await user.click(tabBajoStock)

    await waitFor(() => {
      expect(screen.getByText(/Cargo Pants Verde Militar/i)).toBeInTheDocument()
      expect(screen.queryByText(/Chaqueta Denim Oversize/i)).toBeNull()
    })
  })

  it('permite abrir el modal y registrar una nueva prenda en el inventario', async () => {
    const user = userEvent.setup()
    renderAt('/tienda/inventario', routes)

    const btnNuevo = screen.getByRole('button', { name: /\+ Nueva prenda en inventario/i })
    await user.click(btnNuevo)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Agregar prenda al inventario/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Nombre de la prenda/i), 'Sobrecamisa Pana Marfil')
    await user.click(screen.getByRole('button', { name: /^Guardar prenda$/i }))

    await waitFor(() => {
      expect(screen.getByText(/¡Prenda incorporada al inventario del almacén!/i)).toBeInTheDocument()
      expect(screen.getByText(/Sobrecamisa Pana Marfil/i)).toBeInTheDocument()
    })
  })
})

