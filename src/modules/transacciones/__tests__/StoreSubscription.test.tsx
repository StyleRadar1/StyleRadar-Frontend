import { ApiError } from '@/modules/core/api/apiClient'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StoreSubscriptionPage from '../pages/StoreSubscriptionPage'
import { resetMockStoreSubscription, storeSubscriptionService } from '../services/storeSubscriptionService'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.setItem('sr_token', 'demo-t-1')
  localStorage.setItem('sr_user', JSON.stringify({ id: 't-1', name: 'Tienda Prueba', email: 't-1@styleradar.co', role: 'STORE_ADMIN' }))
  resetMockStoreSubscription()
})

const slow = { timeout: 4000 }

describe('suscripción de la tienda (RF-67, RF-68)', () => {
  const abrirFormulario = async (user: ReturnType<typeof userEvent.setup>, nit = '900555777') => {
    await user.click(await screen.findByRole('button', { name: 'Pagar suscripción' }, slow))
    await user.clear(screen.getByLabelText(/NIT de la tienda/))
    await user.type(screen.getByLabelText(/NIT de la tienda/), nit)
    const correo = screen.getByLabelText(/Correo del pagador/)
    await user.clear(correo)
    await user.type(correo, 'tienda@correo.co')
    await user.click(screen.getByRole('button', { name: 'Pagar suscripción' }))
  }

  it('en estado PENDIENTE muestra el precio y ofrece pagar, sin pagos todavía y sin botón de cancelar', async () => {
    render(<StoreSubscriptionPage />)
    expect(await screen.findByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText(/\/ mes/).closest('p')).toHaveTextContent(/89\.000/)
    expect(screen.getByRole('button', { name: 'Pagar suscripción' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Cancelar suscripción' })).not.toBeInTheDocument()
    expect(screen.getByText('Aún no tienes pagos')).toBeInTheDocument()
  })

  it('el formulario envía correo y NIT a Mercado Pago; en demostración avisa y no la da por activa', async () => {
    const user = userEvent.setup()
    const iniciar = vi.spyOn(storeSubscriptionService, 'startStoreSubscription')
    render(<StoreSubscriptionPage />)
    await abrirFormulario(user)
    expect(await screen.findByText('Pago simulado (modo demostración)', undefined, slow)).toBeInTheDocument()
    expect(iniciar).toHaveBeenCalledWith({ payerEmail: 'tienda@correo.co', taxId: '900555777' })
    expect(screen.queryByText('Activa')).not.toBeInTheDocument()
  })

  it('un NIT que no tiene 9 dígitos no se envía', async () => {
    const user = userEvent.setup()
    const iniciar = vi.spyOn(storeSubscriptionService, 'startStoreSubscription')
    render(<StoreSubscriptionPage />)
    await abrirFormulario(user, '123')
    expect(await screen.findByRole('alert', undefined, slow)).toHaveTextContent('9 dígitos')
    expect(iniciar).not.toHaveBeenCalled()
  })

  it('si no se puede iniciar el pago avisa y no activa la suscripción', async () => {
    const user = userEvent.setup()
    vi.spyOn(storeSubscriptionService, 'startStoreSubscription').mockRejectedValue(new ApiError(503, 'No fue posible iniciar el pago'))
    render(<StoreSubscriptionPage />)
    await abrirFormulario(user)
    expect(await screen.findByText('No pudimos procesar el pago', undefined, slow)).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('cancelar la suscripción pide confirmación y deja la suscripción activa hasta el fin del periodo', async () => {
    const user = userEvent.setup()
    await storeSubscriptionService.pay()
    render(<StoreSubscriptionPage />)
    await user.click(await screen.findByRole('button', { name: 'Cancelar suscripción' }))
    const dialogo = screen.getByRole('dialog', { name: '¿Cancelar suscripción?' })
    expect(dialogo).toHaveTextContent('No hay devolución por el tiempo restante')
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelación' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancelar suscripción' })).not.toBeInTheDocument(), slow)
    expect(screen.getAllByText('Activa sin renovación').length).toBeGreaterThanOrEqual(1)
  })

  it('"Conservar suscripción" cierra el diálogo sin cambiar nada', async () => {
    const user = userEvent.setup()
    await storeSubscriptionService.pay()
    render(<StoreSubscriptionPage />)
    await user.click(await screen.findByRole('button', { name: 'Cancelar suscripción' }))
    await user.click(screen.getByRole('button', { name: 'Conservar suscripción' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar suscripción' })).toBeInTheDocument()
  })
})

describe('reglas del servicio simulado', () => {
  it('RN-02 de RF-67: un pago rechazado o pendiente queda en el historial pero no activa', async () => {
    const fail = await storeSubscriptionService.pay('MOCK_STORE_FAIL')
    expect(fail.result?.status).toBe('rechazado')
    const pend = await storeSubscriptionService.pay('MOCK_STORE_PENDING')
    expect(pend.result?.status).toBe('pendiente')
    const { subscription, payments } = await storeSubscriptionService.get()
    expect(subscription.status).toBe('PENDIENTE')
    expect(payments.map((p) => p.status)).toEqual(['pendiente', 'rechazado'])
  })

  it('FA-02 de RF-67: no se duplica una suscripción activa', async () => {
    await storeSubscriptionService.pay()
    await expect(storeSubscriptionService.pay()).rejects.toMatchObject({ status: 409 })
    expect((await storeSubscriptionService.get()).payments).toHaveLength(1)
  })

  it('FA-02 de RF-68: cancelar dos veces conserva el estado, y sin suscripción activa no se puede cancelar', async () => {
    await expect(storeSubscriptionService.cancelRenewal()).rejects.toMatchObject({ status: 409 })
    await storeSubscriptionService.pay()
    const first = await storeSubscriptionService.cancelRenewal()
    const second = await storeSubscriptionService.cancelRenewal()
    expect(first.renewalEnabled).toBe(false)
    expect(second).toEqual(first)
    expect(second.status).toBe('ACTIVA')
  })
})
