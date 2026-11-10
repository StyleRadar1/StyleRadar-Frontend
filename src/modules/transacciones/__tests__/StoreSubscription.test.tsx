import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StoreSubscriptionPage from '../pages/StoreSubscriptionPage'
import { resetMockStoreSubscription, storeSubscriptionService } from '../services/storeSubscriptionService'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.setItem('sr_token', 'demo-t-1')
  localStorage.setItem('sr_user', JSON.stringify({ id: 't-1', name: 'Tienda Prueba', email: 't-1@styleradar.co', role: 'ADMIN_ALMACEN' }))
  resetMockStoreSubscription()
})

const slow = { timeout: 4000 }

describe('suscripción de la tienda (RF-67, RF-68)', () => {
  it('en el periodo gratuito muestra el precio y ofrece pagar, sin pagos todavía', async () => {
    render(<StoreSubscriptionPage />)
    expect(await screen.findByText('Periodo gratuito')).toBeInTheDocument()
    expect(screen.getByText(/Tienes 30 días gratis/)).toHaveTextContent(/89\.000/)
    expect(screen.getByRole('button', { name: 'Pagar y activar suscripción' })).toBeEnabled()
    expect(screen.getByText('Aún no tienes pagos')).toBeInTheDocument()
  })

  it('con el pago aprobado la suscripción queda activa y el pago aparece en el historial', async () => {
    const user = userEvent.setup()
    render(<StoreSubscriptionPage />)
    await user.click(await screen.findByRole('button', { name: 'Pagar y activar suscripción' }))
    expect(await screen.findByText('¡Pago aprobado!', undefined, slow)).toBeInTheDocument()
    expect(await screen.findByText('Activa', undefined, slow)).toBeInTheDocument()
    const tabla = screen.getByRole('table', { name: 'Historial de pagos' })
    expect(within(tabla).getByText('Aprobado')).toBeInTheDocument()
    expect(within(tabla).getByText(/89\.000/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar y activar suscripción' })).not.toBeInTheDocument()
  })

  it('un pago rechazado avisa y no activa la suscripción', async () => {
    const user = userEvent.setup()
    vi.spyOn(storeSubscriptionService, 'pay').mockResolvedValue({
      result: { orderId: 'MOCK_STORE_FAIL', status: 'rechazado', planName: 'Tienda aliada', amount: 89_000, method: 'PSE' },
    })
    render(<StoreSubscriptionPage />)
    await user.click(await screen.findByRole('button', { name: 'Pagar y activar suscripción' }))
    expect(await screen.findByRole('alert', undefined, slow)).toHaveTextContent('La suscripción no se activó')
    expect(screen.getByText('Periodo gratuito')).toBeInTheDocument()
  })

  it('cancelar la renovación pide confirmación y deja la suscripción activa hasta el fin del periodo', async () => {
    const user = userEvent.setup()
    await storeSubscriptionService.pay()
    render(<StoreSubscriptionPage />)
    await user.click(await screen.findByRole('button', { name: 'Cancelar renovación' }))
    const dialogo = screen.getByRole('dialog', { name: '¿Cancelar la renovación?' })
    expect(dialogo).toHaveTextContent('no se devuelve el tiempo restante')
    await user.click(within(dialogo).getByRole('button', { name: 'Sí, cancelar renovación' }))
    expect(await screen.findByText(/No se renovará automáticamente/, undefined, slow)).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar renovación' })).not.toBeInTheDocument()
  })

  it('"Mantener suscripción" cierra el diálogo sin cambiar nada', async () => {
    const user = userEvent.setup()
    await storeSubscriptionService.pay()
    render(<StoreSubscriptionPage />)
    await user.click(await screen.findByRole('button', { name: 'Cancelar renovación' }))
    await user.click(screen.getByRole('button', { name: 'Mantener suscripción' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar renovación' })).toBeInTheDocument()
  })
})

describe('reglas del servicio simulado', () => {
  it('RN-02 de RF-67: un pago rechazado o pendiente queda en el historial pero no activa', async () => {
    const fail = await storeSubscriptionService.pay('MOCK_STORE_FAIL')
    expect(fail.result?.status).toBe('rechazado')
    const pend = await storeSubscriptionService.pay('MOCK_STORE_PENDING')
    expect(pend.result?.status).toBe('pendiente')
    const { subscription, payments } = await storeSubscriptionService.get()
    expect(subscription.status).toBe('PRUEBA')
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
