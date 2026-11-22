import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Role } from '@/modules/core/types/roles'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { FEATURE_REQUIRES_RADAR_PLUS_MSG, PlanGate } from '../components/PlanGate'
import PlansPage from '../pages/PlansPage'
import { setMockPlan } from '../services/userPlanService'
import { PLAN_COMPARISON_ROWS, REGLAS } from '../types/plan.dto'

const loginAs = (id: string, role: Role = 'COMPRADOR') => {
  localStorage.setItem('sr_token', `demo-${id}`)
  localStorage.setItem('sr_user', JSON.stringify({ id, name: 'Prueba', email: `${id}@styleradar.co`, role }))
}
const renderAt = (path: string) => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/planes" element={<PlansPage />} />
        <Route path="/bloqueo" element={<PlanGate title="Pruébate la ropa sobre tu foto con Radar+" text="Solo con Radar+"><p>Subir mi foto</p></PlanGate>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('planes (P7)', () => {
  it('sin sesión muestra los cuatro planes y cada uno lleva al registro', () => {
    renderAt('/planes')
    const planes = screen.getByRole('list', { name: 'Planes' })
    expect(within(planes).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Radar', 'Radar+', 'Tienda aliada', 'Fundación aliada'])
    expect(screen.getByRole('link', { name: 'Empezar con Radar+' })).toHaveAttribute('href', '/registro?plan=radar-plus')
    expect(screen.getByRole('link', { name: 'Registrar mi tienda' })).toHaveAttribute('href', '/registro?tipo=tienda')
  })

  it('muestra la tabla comparativa de 3 filas (RF-102) y las reglas de los planes', () => {
    renderAt('/planes')
    expect(PLAN_COMPARISON_ROWS).toHaveLength(3)
    const tabla = screen.getByRole('table', { name: 'Comparación de los planes Radar y Radar+' })
    const maniqui = within(tabla).getByRole('row', { name: /Probador con maniquí/ })
    expect(maniqui).toHaveTextContent('Incluido')
    const foto = within(tabla).getByRole('row', { name: /Probador con foto propia/ })
    expect(foto).toHaveTextContent('Sin foto propia')
    expect(foto).toHaveTextContent('Máximo 30 usos')
    const alertas = within(tabla).getByRole('row', { name: /Alertas de disponibilidad/ })
    expect(alertas).toHaveTextContent('Sin alertas')
    expect(alertas).toHaveTextContent('Incluidas')
    const reglas = screen.getByRole('list', { name: 'Reglas de los planes' })
    expect(within(reglas).getAllByRole('listitem')).toHaveLength(REGLAS.length)
  })

  it('el comprador ve su plan Radar+ y puede cancelar la suscripción', async () => {
    const user = userEvent.setup()
    loginAs('u-1')
    setMockPlan('u-1', 'RADAR_PLUS')
    renderAt('/planes')
    expect(await screen.findByText(/Tu plan actual:\s*Radar\+/, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(within(screen.getByRole('listitem', { name: 'Radar+' })).getByText('Tu plan')).toBeInTheDocument()

    const btn = screen.getAllByRole('button', { name: 'Cancelar suscripción' })[0]
    await user.click(btn)
    const dialogo = screen.getByRole('dialog', { name: '¿Cancelar suscripción?' })
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelación' }))
    expect(await screen.findByText(/No se renovará/, {}, { timeout: 3000 })).toBeInTheDocument()
  })
})

describe('bloqueo por plan (P8)', () => {
  it('en el plan Radar se ve el candado con el mensaje oficial y lleva a los planes', async () => {
    loginAs('u-1'); setMockPlan('u-1', 'RADAR')
    renderAt('/bloqueo')
    const bloqueo = await screen.findByRole('region', { name: /requiere Radar\+/ }, { timeout: 3000 })
    expect(within(bloqueo).getByText(FEATURE_REQUIRES_RADAR_PLUS_MSG)).toBeInTheDocument()
    expect(within(bloqueo).getByRole('link', { name: 'Ver planes' })).toHaveAttribute('href', '/planes')
    expect(screen.queryByText('Subir mi foto')).not.toBeInTheDocument()
  })

  it('con Radar+ se muestra el contenido', async () => {
    loginAs('u-1'); setMockPlan('u-1', 'RADAR_PLUS')
    renderAt('/bloqueo')
    expect(await screen.findByText('Subir mi foto', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('no bloquea a quien no es comprador', () => {
    loginAs('a-1', 'ADMIN_STYLERADAR')
    renderAt('/bloqueo')
    expect(screen.getByText('Subir mi foto')).toBeInTheDocument()
  })
})
