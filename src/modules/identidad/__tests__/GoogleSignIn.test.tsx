import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LoginPage from '../pages/LoginPage'
import { AuthProvider } from '../states/AuthProvider'

const renderLogin = () => render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/estadisticas" element={<p>Panel de administración</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

describe('ingreso con Google (P14)', () => {
  it('el inicio de sesión ofrece Google y entra sin código de verificación', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))
    const dialogo = screen.getByRole('dialog', { name: 'Elige una cuenta' })
    await user.click(within(dialogo).getByRole('button', { name: /Mariana Bernal/ }))
    expect(await screen.findByText('Panel de administración', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(localStorage.getItem('sr_token')).toBe('demo-a-1')
  })

  it('una cuenta de Google sin registro dice «No pudimos entrar con Google» (plan de errores)', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))
    await user.type(screen.getByLabelText('Usar otra cuenta'), 'alguien@gmail.com')
    await user.click(screen.getByRole('button', { name: 'Seguir' }))
    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toHaveTextContent('No pudimos entrar con Google')
  })

  it('el selector se cierra con Escape', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
