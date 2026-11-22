import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import PreferencesPage from '../pages/PreferencesPage'
import { resetPreferencesMock } from '../services/preferenceService'
import { loginAs, renderAt } from './helpers'

const routes = [{ path: '/avisos/preferencias', element: <PreferencesPage /> }]

beforeEach(() => { localStorage.clear(); resetPreferencesMock(); loginAs('u-1', 'Valentina Rojas') })

describe('preferencias de avisos (SR-RF-105)', () => {
  it('muestra una fila por cada uno de los 9 tipos, todos solo en la plataforma al inicio', async () => {
    renderAt('/avisos/preferencias', routes)
    const lista = await screen.findByRole('list', { name: 'Tipos de aviso' }, { timeout: 3000 })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(9)
    const interruptores = within(lista).getAllByRole('switch')
    expect(interruptores).toHaveLength(9)
    interruptores.forEach((s) => expect(s).toHaveAttribute('aria-checked', 'false'))
  })

  it('activar el correo de un tipo lo guarda y avisa', async () => {
    const user = userEvent.setup()
    renderAt('/avisos/preferencias', routes)
    const sw = await screen.findByRole('switch', { name: 'Recibir por correo: Mensaje nuevo' }, { timeout: 3000 })
    await user.click(sw)
    expect(await screen.findByText(/Te avisaremos también por correo: mensaje nuevo/)).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Recibir por correo: Mensaje nuevo' })).toHaveAttribute('aria-checked', 'true')
    // Los demás siguen igual
    expect(screen.getByRole('switch', { name: 'Recibir por correo: Pago confirmado' })).toHaveAttribute('aria-checked', 'false')
  })

  it('apagarlo otra vez vuelve a «solo plataforma»', async () => {
    const user = userEvent.setup()
    renderAt('/avisos/preferencias', routes)
    const nombre = 'Recibir por correo: Pago confirmado'
    await user.click(await screen.findByRole('switch', { name: nombre }, { timeout: 3000 }))
    await user.click(await screen.findByRole('switch', { name: nombre, checked: true }))
    expect(await screen.findByText(/llegará solo a la plataforma/)).toBeInTheDocument()
  })
})
