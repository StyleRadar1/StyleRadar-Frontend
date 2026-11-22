import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationBell } from '../components/NotificationBell'
import AlertsPage from '../pages/AlertsPage'
import { alertService, resetAlertsMock } from '../services/alertService'
import { resetNotificationsMock } from '../services/notificationService'
import { setMockPlan } from '@/modules/transacciones/services/userPlanService'
import { loginAs, renderAt } from './helpers'

const routes = [
  { path: '/alertas', element: <AlertsPage /> },
  { path: '/campana', element: <NotificationBell /> },
  { path: '/planes', element: <p>Página de planes</p> },
  { path: '/catalogo', element: <p>Catálogo</p> },
]

beforeEach(() => { resetAlertsMock(); resetNotificationsMock(); loginAs('u-1', 'Valentina Rojas'); setMockPlan('u-1', 'RADAR') })

describe('búsquedas y alertas (RF-28 a RF-32)', () => {
  it('en el plan Radar muestra el bloqueo de Radar+ sin contador de cupo y enlaza a los planes', async () => {
    const user = userEvent.setup()
    renderAt('/alertas', routes)
    const gate = await screen.findByRole('region', { name: /Alertas de disponibilidad con Radar\+ · requiere Radar\+/ }, { timeout: 3000 })
    expect(gate).toHaveTextContent('Esta función está disponible en el plan Radar+')
    expect(screen.queryByRole('status', { name: 'Uso del plan' })).not.toBeInTheDocument()

    await user.click(within(gate).getByRole('link', { name: 'Ver planes' }))
    expect(screen.getByText('Página de planes')).toBeInTheDocument()
  })

  it('en el plan Radar los interruptores tienen candado, muestran el aviso de Radar+ y llevan a los planes sin llamar al servicio (RF-102)', async () => {
    const user = userEvent.setup()
    const spyAlert = vi.spyOn(alertService, 'setAlert')
    const spySearch = vi.spyOn(alertService, 'setSearchAlert')
    renderAt('/alertas', routes)

    const bloqueada = await screen.findByRole('switch', { name: 'Alerta para Chaqueta de cuero M (requiere Radar+)' }, { timeout: 3000 })
    expect(bloqueada).toHaveAttribute('aria-checked', 'false')
    await user.click(bloqueada)
    expect(spyAlert).not.toHaveBeenCalled()
    expect(spySearch).not.toHaveBeenCalled()
    const aviso = screen.getByRole('alert')
    expect(aviso).toHaveTextContent('Esta función está disponible en el plan Radar+')
    await user.click(within(aviso).getByRole('link', { name: 'Ver planes' }))
    expect(screen.getByText('Página de planes')).toBeInTheDocument()
    spyAlert.mockRestore()
    spySearch.mockRestore()
  })

  it('con Radar+ permite apagar una alerta activa', async () => {
    const user = userEvent.setup()
    setMockPlan('u-1', 'RADAR_PLUS')
    renderAt('/alertas', routes)
    await user.click(await screen.findByRole('switch', { name: 'Alerta para Tenis retro gris' }, { timeout: 3000 }))
    expect(await screen.findByText('Apagaste la alerta de «Tenis retro gris».')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Alerta para Tenis retro gris' })).toHaveAttribute('aria-checked', 'false')
  })

  it('eliminar pide confirmación', async () => {
    const user = userEvent.setup()
    renderAt('/alertas', routes)
    await user.click(await screen.findByRole('button', { name: 'Eliminar Chaqueta de cuero M' }, { timeout: 3000 }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Eliminaste «Chaqueta de cuero M».')).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /Chaqueta de cuero M/ })).not.toBeInTheDocument()
  })

  it('con Radar+ cancelar el seguimiento de una prenda la deja apagada sin borrarla', async () => {
    const user = userEvent.setup()
    setMockPlan('u-1', 'RADAR_PLUS')
    renderAt('/alertas', routes)
    await user.click(await screen.findByRole('button', { name: 'Cancelar seguimiento de Tenis retro gris' }, { timeout: 3000 }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar seguimiento' }))
    expect(await screen.findByText('Cancelaste el seguimiento de «Tenis retro gris».')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Alerta para Tenis retro gris' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByRole('button', { name: 'Cancelar seguimiento de Tenis retro gris' })).not.toBeInTheDocument()
  })

  it('con Radar+ no hay límite ni candado', async () => {
    const user = userEvent.setup()
    setMockPlan('u-1', 'RADAR_PLUS')
    renderAt('/alertas', routes)
    await user.click(await screen.findByRole('switch', { name: 'Alerta para Botella térmica 1 L' }, { timeout: 3000 }))
    await screen.findByText('Te avisaremos sobre «Botella térmica 1 L».')
    await user.click(screen.getByRole('switch', { name: 'Alerta para Chaqueta de cuero M' }))
    expect(await screen.findByText('Te avisaremos sobre «Chaqueta de cuero M».')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Uso del plan' })).not.toBeInTheDocument()
  })

  it('una cuenta nueva ve los estados vacíos', async () => {
    loginAs('u-99', 'Cuenta nueva')
    renderAt('/alertas', routes)
    expect(await screen.findByText('Aún no tienes búsquedas guardadas', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('No esperas ninguna prenda')).toBeInTheDocument()
  })

  it('si el servicio está caído muestra el error con opción de reintentar', async () => {
    sessionStorage.setItem('sr_mock', 'sin-red')
    renderAt('/alertas', routes)
    expect(await screen.findByText('No pudimos cargar tus alertas', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('campana de notificaciones (RF-31)', () => {
  it('muestra cuántas hay sin leer y las marca como leídas', async () => {
    const user = userEvent.setup()
    renderAt('/campana', routes)
    const bell = await screen.findByRole('button', { name: 'Notificaciones, 2 sin leer' }, { timeout: 3000 })
    await user.click(bell)
    const panel = screen.getByRole('region', { name: 'Notificaciones' })
    expect(await within(panel).findByText('Nueva prenda para tu búsqueda')).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Marcar todo como leído' }))
    expect(await screen.findByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
  })

  it('se cierra con Escape', async () => {
    const user = userEvent.setup()
    renderAt('/campana', routes)
    await user.click(await screen.findByRole('button', { name: /Notificaciones/ }, { timeout: 3000 }))
    expect(screen.getByRole('region', { name: 'Notificaciones' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Notificaciones' })).not.toBeInTheDocument()
  })
})
