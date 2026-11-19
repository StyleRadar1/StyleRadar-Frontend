import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminPaymentsPage from '../pages/AdminPaymentsPage'
import { TEXTOS_PAGOS } from '../utils/erroresPagos'

const slow = { timeout: 4000 }
const abrir = () => render(<MemoryRouter><AdminPaymentsPage /></MemoryRouter>)

describe('Admin · Pagos (C.1: sin reembolso, permisos)', { timeout: 15000 }, () => {
  afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

  it('C.1: no existe botón de Reembolsar en la vista de pagos de administración', async () => {
    abrir()
    await screen.findByRole('table', {}, slow)
    expect(screen.queryByRole('button', { name: 'Reembolsar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reembolsar saldo restante' })).not.toBeInTheDocument()
  })

  it('403 al cargar (no es administrador): muestra mensaje de sin permiso y sin Reintentar', async () => {
    sessionStorage.setItem('sr_mock', 'sin-permiso')
    abrir()
    expect(await screen.findByText(TEXTOS_PAGOS.sinPermiso.titulo, {}, slow)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
