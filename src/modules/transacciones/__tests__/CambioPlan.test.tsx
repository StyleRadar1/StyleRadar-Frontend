import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import CheckoutPage from '../pages/CheckoutPage'
import PlansPage from '../pages/PlansPage'
import { setMockPlan, userPlanService } from '../services/userPlanService'

const slow = { timeout: 4000 }

beforeEach(() => {
  localStorage.setItem('sr_token', 'demo-u-1')
  localStorage.setItem('sr_user', JSON.stringify({ id: 'u-1', name: 'Prueba', email: 'u-1@styleradar.co', role: 'COMPRADOR' }))
  setMockPlan('u-1', 'RADAR')
})

const renderAt = (path: string) => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/planes" element={<PlansPage />} />
        <Route path="/suscripcion" element={<CheckoutPage />} />
        <Route path="/pago/resultado" element={<CheckoutPage />} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('cambio de plan con pago (RF-100)', () => {
  it('"Cambiar a Radar+" en /planes lleva al pago en lugar de cambiar el plan directo', async () => {
    const user = userEvent.setup()
    renderAt('/planes')
    await user.click(await screen.findByRole('button', { name: 'Cambiar a Radar+' }, slow))
    expect(await screen.findByRole('heading', { name: 'Elige tu plan' })).toBeInTheDocument()
    expect((await userPlanService.mine()).plan).toBe('RADAR')
  })

  it('en el checkout se marca el plan actual y, con el pago aprobado, el plan pasa a Radar+', async () => {
    const user = userEvent.setup()
    renderAt('/suscripcion')
    expect(await screen.findByRole('button', { name: 'Plan actual' }, slow)).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Suscribirme' }))
    expect(await screen.findByRole('heading', { name: '¡Listo!' }, slow)).toBeInTheDocument()
    expect((await userPlanService.mine()).plan).toBe('RADAR_PLUS')
  })
})
