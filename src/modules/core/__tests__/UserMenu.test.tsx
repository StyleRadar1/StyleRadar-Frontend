import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { UserMenu } from '../components/UserMenu'
import { WelcomeOverlay } from '../components/WelcomeOverlay'

const loginAs = (id: string, name: string, email: string, role: Role) => {
  localStorage.setItem('sr_token', `demo-${id}`)
  localStorage.setItem('sr_user', JSON.stringify({ id, name, email, role }))
}
const slow = { timeout: 4000 }

function EntrarComo({ email }: { email: string }) {
  const { login } = useAuth()
  return <button type="button" onClick={() => { void login({ email, password: '1234' }) }}>Entrar de prueba</button>
}

const renderApp = (children: React.ReactNode) => render(
  <AuthProvider><MemoryRouter>{children}</MemoryRouter></AuthProvider>,
)

describe('menú de cuenta', () => {
  it('muestra nombre, rol y correo, y lleva al perfil', async () => {
    const user = userEvent.setup()
    loginAs('u-1', 'Valentina Rojas', 'usuario@styleradar.co', 'COMPRADOR')
    renderApp(<UserMenu />)
    await user.click(screen.getByRole('button', { name: 'Mi cuenta: Valentina Rojas' }))
    const menu = screen.getByRole('menu', { name: 'Mi cuenta' })
    expect(within(menu).getByText('Valentina Rojas')).toBeInTheDocument()
    expect(within(menu).getByText('Usuario · usuario@styleradar.co')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Mi cuenta' })).toHaveAttribute('href', '/perfil')
  })

  it('el administrador ve sus accesos y su rol', async () => {
    const user = userEvent.setup()
    loginAs('a-1', 'Mariana Bernal', 'admin@styleradar.co', 'ADMIN_STYLERADAR')
    renderApp(<UserMenu />)
    await user.click(screen.getByRole('button', { name: 'Mi cuenta: Mariana Bernal' }))
    const menu = screen.getByRole('menu', { name: 'Mi cuenta' })
    expect(within(menu).getByText('Admin · admin@styleradar.co')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Usuarios' })).toHaveAttribute('href', '/admin/usuarios')
  })

  it('Escape cierra el menú', async () => {
    const user = userEvent.setup()
    loginAs('t-1', 'Luna Store', 'luna@styleradar.co', 'ADMIN_ALMACEN')
    renderApp(<UserMenu />)
    await user.click(screen.getByRole('button', { name: 'Mi cuenta: Luna Store' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('cerrar sesión pide confirmación y sale', async () => {
    const user = userEvent.setup()
    loginAs('u-1', 'Valentina Rojas', 'usuario@styleradar.co', 'COMPRADOR')
    renderApp(<UserMenu />)
    await user.click(screen.getByRole('button', { name: 'Mi cuenta: Valentina Rojas' }))
    await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))
    const dialogo = screen.getByRole('dialog', { name: '¿Cerrar sesión?' })
    await user.click(within(dialogo).getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.queryByRole('button', { name: /Mi cuenta/ })).not.toBeInTheDocument()
    expect(localStorage.getItem('sr_user')).toBeNull()
  })
})

describe('bienvenida al iniciar sesión', () => {
  it('saluda a la persona usuaria por su nombre y se cierra con Escape', async () => {
    const user = userEvent.setup()
    renderApp(<><WelcomeOverlay /><EntrarComo email="usuario@styleradar.co" /></>)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Entrar de prueba' }))
    const hola = await screen.findByRole('status', {}, slow)
    expect(hola).toHaveTextContent(/Hola de nuevo,\s*Valentina/)
    expect(hola).toHaveTextContent('Usuario')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('al administrador lo saluda por su primer nombre', async () => {
    const user = userEvent.setup()
    renderApp(<><WelcomeOverlay /><EntrarComo email="admin@styleradar.co" /></>)
    await user.click(screen.getByRole('button', { name: 'Entrar de prueba' }))
    const hola = await screen.findByRole('status', {}, slow)
    expect(hola).toHaveTextContent(/Hola de nuevo,\s*Mariana/)
    expect(hola).toHaveTextContent('Administrador')
  })

  it('a la tienda la saluda con el nombre completo', async () => {
    const user = userEvent.setup()
    renderApp(<><WelcomeOverlay /><EntrarComo email="luna@styleradar.co" /></>)
    await user.click(screen.getByRole('button', { name: 'Entrar de prueba' }))
    expect(await screen.findByRole('status', {}, slow)).toHaveTextContent(/Hola de nuevo,\s*Luna Store/)
  })

  it('no aparece al recargar una sesión que ya existía', () => {
    loginAs('u-1', 'Valentina Rojas', 'usuario@styleradar.co', 'COMPRADOR')
    renderApp(<WelcomeOverlay />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
