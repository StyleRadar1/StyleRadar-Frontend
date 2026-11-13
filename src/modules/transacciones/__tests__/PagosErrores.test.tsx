import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/modules/core/api/apiClient'
import AdminPaymentsPage from '../pages/AdminPaymentsPage'
import { paymentService } from '../services/paymentService'
import { TEXTOS_PAGOS } from '../utils/erroresPagos'

const slow = { timeout: 4000 }
const abrir = () => render(<MemoryRouter><AdminPaymentsPage /></MemoryRouter>)

/** Abre el primer pago aprobado y el diálogo de reembolso. */
const abrirReembolso = async (user: ReturnType<typeof userEvent.setup>) => {
  const tabla = await screen.findByRole('table', {}, slow)
  const fila = within(tabla).getAllByRole('row').find((r) => within(r).queryByText('Aprobado')) as HTMLElement
  await user.click(fila)
  await user.click(screen.getByRole('button', { name: 'Reembolsar' }))
  return screen.getByRole('dialog')
}

describe('Admin · Pagos · errores del plan (Cristian)', () => {
  afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

  it('400: reembolso sin motivo → mensaje debajo del campo motivo, sin enviar', async () => {
    const spy = vi.spyOn(paymentService, 'refund')
    const user = userEvent.setup()
    abrir()
    const dialogo = await abrirReembolso(user)
    expect(within(dialogo).queryByText(TEXTOS_PAGOS.motivo)).not.toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar reembolso' }))
    expect(within(dialogo).getByText(TEXTOS_PAGOS.motivo).closest('[role="alert"]')).toHaveAttribute('id', 'refund-motivo-err')
    expect(within(dialogo).getByLabelText(/Motivo/)).toHaveAttribute('aria-invalid', 'true')
    expect(within(dialogo).getByLabelText(/Motivo/)).toHaveFocus()
    expect(spy).not.toHaveBeenCalled()
    await user.type(within(dialogo).getByLabelText(/Motivo/), 'Cobro doble')
    expect(within(dialogo).queryByText(TEXTOS_PAGOS.motivo)).not.toBeInTheDocument()
  })

  it('400 del servidor: el diálogo sigue abierto y el motivo queda escrito', async () => {
    vi.spyOn(paymentService, 'refund').mockRejectedValue(new ApiError(400, 'x', { reason: 'El motivo es muy corto.' }))
    const user = userEvent.setup()
    abrir()
    const dialogo = await abrirReembolso(user)
    await user.type(within(dialogo).getByLabelText(/Motivo/), 'ok')
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar reembolso' }))
    expect(await within(dialogo).findByText('El motivo es muy corto.')).toBeInTheDocument()
    expect(within(dialogo).getByLabelText(/Motivo/)).toHaveValue('ok')
  })

  it('403 al reembolsar: «No tienes permiso para hacer esto»', async () => {
    vi.spyOn(paymentService, 'refund').mockRejectedValue(new ApiError(403, 'Forbidden'))
    const user = userEvent.setup()
    abrir()
    const dialogo = await abrirReembolso(user)
    await user.type(within(dialogo).getByLabelText(/Motivo/), 'Cobro doble')
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar reembolso' }))
    expect(await screen.findByText(TEXTOS_PAGOS.sinPermiso.titulo)).toBeInTheDocument()
    expect(screen.getByText(TEXTOS_PAGOS.sinPermiso.texto)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Forbidden')).not.toBeInTheDocument()
  })

  it('403 al cargar (no es administrador): el mismo mensaje y sin Reintentar', async () => {
    sessionStorage.setItem('sr_mock', 'sin-permiso')
    abrir()
    expect(await screen.findByText(TEXTOS_PAGOS.sinPermiso.titulo, {}, slow)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
