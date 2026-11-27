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

describe('AdminPaymentsPage - monedero del balance consolidado', () => {
  afterEach(() => vi.restoreAllMocks())

  it('llena el espacio del balance con el monedero y los aprobados de cada plan', async () => {
    vi.spyOn(paymentService, 'list').mockResolvedValue([
      pago({ id: '1', amount: 14900 }),
      pago({ id: '2', planId: 'store', planName: 'Store Basic', amount: 89000 }),
      pago({ id: '3', status: 'pendiente', amount: 9000 }),
    ])

    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    )

    const monedero = await screen.findByRole('figure', { name: 'Monedero de pagos aprobados' })
    expect(within(monedero).getByText('Radar+').parentElement).toHaveTextContent(cop(14900))
    expect(within(monedero).getByText('Tiendas').parentElement).toHaveTextContent(cop(89000))
    expect(within(monedero).getByText('Total aprobado').parentElement).toHaveTextContent(cop(103900))
  })

  it('sin pagos aprobados el monedero muestra todo en cero', async () => {
    vi.spyOn(paymentService, 'list').mockResolvedValue([pago({ id: '9', status: 'pendiente' })])

    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    )

    const monedero = await screen.findByRole('figure', { name: 'Monedero de pagos aprobados' })
    expect(within(monedero).getByText('Total aprobado').parentElement).toHaveTextContent(cop(0))
  })
})
