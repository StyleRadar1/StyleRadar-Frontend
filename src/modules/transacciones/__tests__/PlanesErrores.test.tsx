import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import CheckoutPage from '../pages/CheckoutPage'
import PlansPage from '../pages/PlansPage'
import { setMockPlan, userPlanService } from '../services/userPlanService'
import { TEXTOS_PLAN } from '../utils/erroresPlan'

const slow = { timeout: 4000 }

beforeEach(() => {
  localStorage.setItem('sr_token', 'demo-u-1')
  localStorage.setItem('sr_user', JSON.stringify({ id: 'u-1', name: 'Prueba', email: 'u-1@styleradar.co', role: 'COMPRADOR' }))
  setMockPlan('u-1', 'RADAR_PLUS')
})
afterEach(() => { sessionStorage.clear(); localStorage.clear(); window.history.replaceState(null, '', '/') })

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

const bajarARadar = async () => {
  const user = userEvent.setup()
  renderAt('/planes')
  await user.click(await screen.findByRole('button', { name: 'Cambiar a Radar' }, slow))
  await user.click(screen.getByRole('button', { name: 'Cambiar plan' }))
}

describe('Planes y pago · errores del plan (Cristian)', () => {
  it('400 al cambiar el plan: «No pudimos procesar tu plan» y el plan no cambia', async () => {
    sessionStorage.setItem('sr_demo_plan', '400')
    await bajarARadar()
    expect(await screen.findByText(TEXTOS_PLAN.datos.titulo, {}, slow)).toBeInTheDocument()
    expect(screen.getByText(TEXTOS_PLAN.datos.texto)).toBeInTheDocument()
    expect((await userPlanService.mine()).plan).toBe('RADAR_PLUS')
  })

  it('400 al iniciar el pago: el mismo aviso, sin datos del pago', async () => {
    sessionStorage.setItem('sr_demo_plan', '400')
    setMockPlan('u-1', 'RADAR')
    const user = userEvent.setup()
    renderAt('/suscripcion')
    await user.click(await screen.findByRole('button', { name: 'Suscribirme' }, slow))
    expect(await screen.findByText(TEXTOS_PLAN.datos.titulo, {}, slow)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '¡Listo!' })).not.toBeInTheDocument()
  })

  it('409: «Tu plan cambió mientras lo veías», refresca el plan y ofrece Ver mi plan', async () => {
    sessionStorage.setItem('sr_demo_plan', '409')
    await bajarARadar()
    expect(await screen.findByText(TEXTOS_PLAN.conflicto.titulo, {}, slow)).toBeInTheDocument()
    expect(screen.getByText(TEXTOS_PLAN.conflicto.texto)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver mi plan' })).toBeInTheDocument()
    expect(await screen.findByText('Tu plan', {}, slow)).toBeInTheDocument()
  })

  it('Pago rechazado: pantalla con Reintentar pago y sin cobro', async () => {
    renderAt('/pago/resultado?orden=MOCK_ORDER_FAIL')
    expect(await screen.findByRole('heading', { name: TEXTOS_PLAN.rechazado.titulo }, slow)).toBeInTheDocument()
    expect(screen.getByText(TEXTOS_PLAN.rechazado.texto)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reintentar pago' })).toHaveAttribute('href', '/suscripcion')
    expect(screen.getByRole('link', { name: 'Ver planes' })).toHaveAttribute('href', '/planes')
    expect(screen.getByRole('img', { name: /datáfono/ })).toBeInTheDocument()
    expect(screen.queryByText('PSE')).not.toBeInTheDocument()
  })

  it('Pago rechazado de la tienda: Reintentar vuelve a su suscripción', async () => {
    renderAt('/pago/resultado?orden=MOCK_STORE_FAIL')
    expect(await screen.findByRole('link', { name: 'Reintentar pago' }, slow)).toHaveAttribute('href', '/tienda/suscripcion')
  })

  it('404: «No tienes una suscripción activa» con Ver planes', async () => {
    renderAt('/pago/resultado?orden=NO_EXISTE')
    expect(await screen.findByText(TEXTOS_PLAN.sinSuscripcion.titulo, {}, slow)).toBeInTheDocument()
    expect(screen.getByText(TEXTOS_PLAN.sinSuscripcion.texto)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver planes' })).toHaveAttribute('href', '/planes')
  })
})
