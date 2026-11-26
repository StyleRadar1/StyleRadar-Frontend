import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import type { Role } from '@/modules/core/types/roles'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { Navbar } from '../components/Navbar'

const loginAs = (id: string, name: string, email: string, role: Role) => {
  localStorage.setItem('sr_token', `demo-${id}`)
  localStorage.setItem('sr_user', JSON.stringify({ id, name, email, role }))
}
const renderNav = () => render(<AuthProvider><MemoryRouter><Navbar /></MemoryRouter></AuthProvider>)
const nav = () => screen.getByRole('navigation', { name: 'Principal' })

describe('menú según el rol', () => {
  afterEach(() => { localStorage.clear(); delete document.documentElement.dataset.tema })

  it('la persona usuaria ve su rol en el botón de cuenta y Mensajes como ícono', () => {
    loginAs('u-1', 'Valentina Rojas', 'usuario@styleradar.co', 'BUYER')
    renderNav()
    expect(screen.getByRole('button', { name: 'Mi cuenta: Valentina Rojas, Usuario' })).toBeInTheDocument()
    expect(within(nav()).getByRole('link', { name: /^Mensajes/ })).toHaveAttribute('href', '/mensajes')
    expect(screen.queryByText('Modo administrador')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Tema de color')).not.toBeInTheDocument()
  })

  it('la campana de notificaciones se ve para persona, tienda y fundación, pero no para el administrador', () => {
    const roles: [string, string, Role, boolean][] = [
      ['u-1', 'Valentina Rojas', 'BUYER', true],
      ['t-1', 'Luna Store', 'STORE_ADMIN', true],
      ['f-1', 'Fundación Abrigo', 'FOUNDATION_REPRESENTATIVE', true],
      ['a-1', 'Mariana Bernal', 'STYLERADAR_ADMIN', false],
    ]
    for (const [id, name, role, ve] of roles) {
      localStorage.clear()
      loginAs(id, name, `${id}@styleradar.co`, role)
      const { unmount } = renderNav()
      const campana = screen.queryByRole('button', { name: /^Notificaciones/ })
      if (ve) expect(campana).toBeInTheDocument(); else expect(campana).not.toBeInTheDocument()
      unmount()
    }
  })

  it('el administrador ve la franja de modo administrador y la etiqueta Admin', () => {
    loginAs('a-1', 'Mariana Bernal', 'admin@styleradar.co', 'STYLERADAR_ADMIN')
    renderNav()
    expect(screen.getByText('Modo administrador')).toBeInTheDocument()
    expect(within(nav()).getByRole('link', { name: /StyleRadar\s*Admin/ })).toBeInTheDocument()
    expect(within(nav()).queryByRole('link', { name: /^Mensajes/ })).not.toBeInTheDocument()
  })

  it('Mensajes está solo como ícono arriba, no repetido en el menú de cuenta', async () => {
    const user = userEvent.setup()
    loginAs('t-1', 'Luna Store', 'luna@styleradar.co', 'STORE_ADMIN')
    renderNav()
    expect(within(nav()).getByRole('link', { name: /^Mensajes/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Mi cuenta/ }))
    expect(within(screen.getByRole('menu')).queryByRole('menuitem', { name: /Mensajes/ })).not.toBeInTheDocument()
  })

  it('el tema se cambia desde el menú de cuenta', async () => {
    const user = userEvent.setup()
    loginAs('u-1', 'Valentina Rojas', 'usuario@styleradar.co', 'BUYER')
    renderNav()
    await user.click(screen.getByRole('button', { name: /Mi cuenta/ }))
    const tema = screen.getByRole('group', { name: 'Tema' })
    expect(within(tema).getByRole('menuitemradio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true')
    await user.click(within(tema).getByRole('menuitemradio', { name: 'Claro' }))
    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(within(tema).getByRole('menuitemradio', { name: 'Claro' })).toHaveAttribute('aria-checked', 'true')
  })

  it('sin sesión el selector de tema sigue en la barra', () => {
    renderNav()
    expect(screen.getAllByLabelText('Tema de color').length).toBeGreaterThan(0)
  })

  it('«Iniciar sesión» abre el mismo inicio de sesión del landing', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/?login')
  })

  it('el logo de StyleRadar lleva al inicio de cada rol si hay sesión, o al landing si no', () => {
    const { unmount } = renderNav()
    expect(screen.getByRole('link', { name: /^StyleRadar/ })).toHaveAttribute('href', '/')
    unmount()

    loginAs('u-1', 'Valentina Rojas', 'usuario@styleradar.co', 'BUYER')
    const { unmount: u2 } = renderNav()
    expect(screen.getByRole('link', { name: /^StyleRadar/ })).toHaveAttribute('href', '/inicio')
    u2()

    loginAs('t-1', 'Luna Store', 'luna@styleradar.co', 'STORE_ADMIN')
    const { unmount: u3 } = renderNav()
    expect(screen.getByRole('link', { name: /^StyleRadar/ })).toHaveAttribute('href', '/mi-tienda')
    u3()

    loginAs('f-1', 'Ropero Comunitario', 'fundacion@styleradar.co', 'FOUNDATION_REPRESENTATIVE')
    const { unmount: u4 } = renderNav()
    expect(screen.getByRole('link', { name: /^StyleRadar/ })).toHaveAttribute('href', '/fundacion')
    u4()
  })
})
