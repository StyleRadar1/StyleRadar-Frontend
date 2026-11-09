import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { NotificationBell } from '../components/NotificationBell'
import AlertsPage from '../pages/AlertsPage'
import { resetAlertsMock } from '../services/alertService'
import { resetNotificationsMock } from '../services/notificationService'
import { loginAs, renderAt } from './helpers'

const routes = [
  { path: '/alertas', element: <AlertsPage /> },
  { path: '/campana', element: <NotificationBell /> },
  { path: '/planes', element: <p>Página de planes</p> },
  { path: '/catalogo', element: <p>Catálogo</p> },
]

beforeEach(() => { resetAlertsMock(); resetNotificationsMock(); loginAs('u-1', 'Valentina Rojas') })

describe('búsquedas y alertas (RF-28 a RF-32)', () => {
  it('muestra el uso del plan Radar y deja activar hasta 3 alertas', async () => {
    const user = userEvent.setup()
    renderAt('/alertas', routes)
    expect(await screen.findByRole('status', { name: 'Uso del plan' }, { timeout: 3000 })).toHaveTextContent('2 de 3 alertas activas en el plan Radar')

    await user.click(screen.getByRole('switch', { name: 'Alerta para Botella térmica 1 L' }))
    expect(await screen.findByText('Te avisaremos sobre «Botella térmica 1 L».')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Uso del plan' })).toHaveTextContent('3 de 3')
    expect(screen.getByRole('status', { name: 'Uso del plan' })).toHaveTextContent('Llegaste al límite')
  })

  it('al llegar al límite, lo que falta se ve con candado y lleva a los planes sin llamar al servicio (P8)', async () => {
    const user = userEvent.setup()
    renderAt('/alertas', routes)
    await user.click(await screen.findByRole('switch', { name: 'Alerta para Botella térmica 1 L' }, { timeout: 3000 }))
    await screen.findByText('Te avisaremos sobre «Botella térmica 1 L».')

    const bloqueada = screen.getByRole('switch', { name: 'Alerta para Chaqueta de cuero M (requiere Radar+)' })
    expect(bloqueada).toHaveAttribute('aria-checked', 'false')
    await user.click(bloqueada)
    const aviso = screen.getByRole('alert')
    expect(aviso).toHaveTextContent('Con el plan Radar puedes tener hasta 3 alertas activas')
    await user.click(within(aviso).getByRole('link', { name: 'Ver planes' }))
    expect(screen.getByText('Página de planes')).toBeInTheDocument()
  })

  it('apagar una alerta libera el cupo', async () => {
    const user = userEvent.setup()
    renderAt('/alertas', routes)
    await user.click(await screen.findByRole('switch', { name: 'Alerta para Tenis retro gris' }, { timeout: 3000 }))
    expect(await screen.findByText('Apagaste la alerta de «Tenis retro gris».')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Uso del plan' })).toHaveTextContent('1 de 3')
  })

  it('eliminar pide confirmación', async () => {
    const user = userEvent.setup()
    renderAt('/alertas', routes)
    await user.click(await screen.findByRole('button', { name: 'Eliminar Chaqueta de cuero M' }, { timeout: 3000 }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Eliminaste «Chaqueta de cuero M».')).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /Chaqueta de cuero M/ })).not.toBeInTheDocument()
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
