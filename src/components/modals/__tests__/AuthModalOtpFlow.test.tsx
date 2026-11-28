import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { AuthModal } from '../AuthModal'

describe('AuthModal - OTP solo en registro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderModal = (isOpen = true, initialTab: 'login' | 'register' = 'login') => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <AuthModal isOpen={isOpen} onClose={vi.fn()} initialTab={initialTab} />
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  it('no ofrece un atajo de OTP desde Iniciar sesión', () => {
    renderModal(true, 'login')
    expect(screen.queryByRole('button', { name: /Entrar con OTP/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Verifica que eres tú')).not.toBeInTheDocument()
  })

  it('el registro avanza al OTP y permite autocompletar el código', async () => {
    renderModal(true, 'register')
    fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Nueva Usuaria' } })
    fireEvent.change(screen.getByLabelText(/^Correo/i), { target: { value: 'valen@correo.com' } })
    fireEvent.change(screen.getByLabelText(/^Contraseña/i), { target: { value: 'Password123*' } })
    for (const cb of screen.getAllByRole('checkbox')) fireEvent.click(cb)
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }))
    expect(await screen.findByText('Verifica que eres tú')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Rellenar código válido/i }))
    for (let i = 1; i <= 6; i++) {
      const input = screen.getByLabelText(`Dígito ${i}`) as HTMLInputElement
      expect(input.value).toBe(String(i))
    }
  })
})
