import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatCOP } from '@/modules/core/utils/format'
import AdminPaymentsPage from '../pages/AdminPaymentsPage'
import { paymentService } from '../services/paymentService'
import type { PaymentDto } from '../types/payment.dto'

const cop = (n: number) => formatCOP(n).replace(/\s/g, ' ')

const pago = (over: Partial<PaymentDto>): PaymentDto =>
  ({
    id: 'p',
    userId: 'u',
    planId: 'plus',
    planName: 'Radar+',
    amount: 14900,
    method: 'tarjeta',
    date: '2026-11-20T10:00:00Z',
    status: 'aprobado',
    ...over,
  }) as PaymentDto

describe('AdminPaymentsPage - balance consolidado', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reparte el balance por plan y muestra los últimos pagos aprobados', async () => {
    vi.spyOn(paymentService, 'list').mockResolvedValue([
      pago({ id: '1', userName: 'Valentina Rojas', amount: 14900, date: '2026-11-20T10:00:00Z' }),
      pago({ id: '2', userName: 'Luna Store', planId: 'store', planName: 'Tienda', amount: 45100, date: '2026-11-25T10:00:00Z' }),
      pago({ id: '3', userName: 'Pendiente', status: 'pendiente', amount: 9000 }),
    ])

    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    )

    const reparto = await screen.findByLabelText('Ingresos aprobados por plan')
    expect(reparto).toHaveTextContent(cop(60000))
    expect(reparto).toHaveTextContent(`Radar+ · ${cop(14900)} (25%)`)
    expect(reparto).toHaveTextContent(`Tiendas · ${cop(45100)} (75%)`)

    const lista = screen.getByText('Últimos pagos aprobados').parentElement as HTMLElement
    const filas = within(lista).getAllByRole('listitem')
    expect(filas).toHaveLength(2)
    expect(filas[0]).toHaveTextContent('Luna Store')
    expect(filas[1]).toHaveTextContent('Valentina Rojas')
    expect(within(lista).queryByText(/Pendiente/)).not.toBeInTheDocument()
  })

  it('sin pagos aprobados lo dice en lugar de dejar la caja vacía', async () => {
    vi.spyOn(paymentService, 'list').mockResolvedValue([pago({ id: '9', status: 'pendiente' })])

    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Todavía no hay pagos aprobados.')).toBeInTheDocument()
  })
})
