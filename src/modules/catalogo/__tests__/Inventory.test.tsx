import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import InventoryPage from '../pages/InventoryPage'
import { resetInventoryMock } from '../services/inventoryService'
import { renderAt } from '../../experiencia/__tests__/helpers'

const routes = [{ path: '/tienda/inventario', element: <InventoryPage /> }]

describe('InventoryPage (RF-50 a RF-60)', () => {
  beforeEach(() => {
    resetInventoryMock()
    sessionStorage.clear()
  })
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

  it('valida datos inválidos (400) en creación, edición de precio y cantidad negativa en talla', async () => {
    const user = userEvent.setup()
    renderAt('/tienda/inventario', routes)

    await waitFor(() => {
      expect(screen.getByText(/Chaqueta Denim Oversize/i)).toBeInTheDocument()
    })

    const qtyInput = screen.getByLabelText(/Cantidad talla S de Chaqueta Denim Oversize/i)
    fireEvent.change(qtyInput, { target: { value: '-1' } })
    expect(await screen.findByText(/La cantidad debe ser un entero mayor o igual a 0\./i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /\+ Nueva prenda en inventario/i }))
    await user.click(screen.getByRole('button', { name: /^Guardar prenda$/i }))
    expect(await screen.findByText(/Indica el nombre de la prenda\./i)).toBeInTheDocument()
  })

  it('impide quitar una talla con unidades (422), explica acción no disponible (422) y bloquea inventario suspendido (403)', async () => {
    const user = userEvent.setup()
    renderAt('/tienda/inventario', routes)

    await waitFor(() => {
      expect(screen.getByText(/Chaqueta Denim Oversize/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Quitar talla S de Chaqueta Denim Oversize/i }))
    expect(await screen.findByText(/La talla S aún tiene \d+ unidades\. Déjala en 0 para quitarla\./i)).toBeInTheDocument()

    sessionStorage.setItem('sr_mock', 'regla')
    await user.click(screen.getAllByRole('button', { name: /Aumentar stock talla S/i })[0])
    expect(await screen.findByText('Esta acción no está disponible por ahora')).toBeInTheDocument()

    sessionStorage.setItem('sr_mock', 'sin-permiso')
    renderAt('/tienda/inventario', routes)
    expect(await screen.findByText('Tu inventario está suspendido')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revisar suscripción' })).toHaveAttribute('href', '/tienda/suscripcion')
  })
})

