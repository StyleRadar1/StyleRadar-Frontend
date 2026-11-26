import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { AuthContext } from '@/modules/identidad/states/authContext'
import StoreActivateSubscriptionPage from '../pages/StoreActivateSubscriptionPage'
import StoreSubscriptionPage from '../pages/StoreSubscriptionPage'

const STORE_ID = 'store-uuid-9'

function app(initial: string) {
  return (
    <AuthContext.Provider
      value={{
        user: { id: STORE_ID, name: 'Tienda QA', email: 'tienda@correo.co', role: 'STORE_ADMIN' },
        login: vi.fn(), register: vi.fn(), verifyOtp: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), updateUser: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/tienda/suscripcion" element={<StoreSubscriptionPage />} />
          <Route path="/tienda/suscripcion/activar" element={<StoreActivateSubscriptionPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

/** GET /subscriptions/{id} responde 404: el almacén nunca ha iniciado una suscripción. */
function backSinSuscripcion() {
  return vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url === '/api/v1/payments/history') return { data: [] }
    throw new ApiError(404, 'Suscripción no encontrada')
  })
}

describe('tienda sin suscripción con pagos reales (VITE_USE_MOCKS_PAGOS=false)', () => {
  const originalMocksPagos = env.useMocksPagos
  const originalLocation = window.location

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    ;(env as { useMocksPagos: boolean }).useMocksPagos = false
    localStorage.setItem('sr_token', 'jwt-demo-token')
    localStorage.setItem('sr_user', JSON.stringify({ id: STORE_ID, name: 'Tienda QA', email: 'tienda@correo.co', role: 'STORE_ADMIN' }))
  })

  afterEach(() => {
    ;(env as { useMocksPagos: boolean }).useMocksPagos = originalMocksPagos
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    vi.restoreAllMocks()
  })

  it('/tienda/suscripcion muestra «Sin suscripción», sin datos inventados, y «Pagar suscripción» lleva al formulario de activación', async () => {
    backSinSuscripcion()
    render(app('/tienda/suscripcion'))

    expect(await screen.findByText('Tu almacén todavía no tiene una suscripción')).toBeInTheDocument()
    expect(screen.queryByText('SUB-ALM-1')).not.toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Pagar suscripción' }))
    expect(await screen.findByLabelText(/NIT de la tienda/)).toBeInTheDocument()
    expect(screen.queryByText('Ya tienes una suscripción activa o en proceso')).not.toBeInTheDocument()
  })

  it('el formulario de activación envía NIT y correo a POST /subscriptions/start y redirige a Mercado Pago', async () => {
    backSinSuscripcion()
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { subscriptionId: 77, orderId: 501, status: 'PENDING', initPoint: 'https://mp.example/checkout/77' },
    })
    const assign = vi.fn()
    Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, assign } })

    render(app('/tienda/suscripcion/activar'))
    await userEvent.type(await screen.findByLabelText(/NIT del almacén/), '900123456')
    const form = screen.getByLabelText(/NIT del almacén/).closest('section') as HTMLElement
    const submit = [...form.querySelectorAll('button[type="submit"]')][0] as HTMLButtonElement
    await userEvent.click(submit)

    expect(postSpy).toHaveBeenCalledWith('/api/v1/subscriptions/start', {
      subscriberType: 'STORE',
      payerEmail: 'tienda@correo.co',
      taxId: '900123456',
      storeId: STORE_ID,
    })
    expect(assign).toHaveBeenCalledWith('https://mp.example/checkout/77')
  })
})
