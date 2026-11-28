import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { WelcomeOverlay } from '@/modules/core/components/WelcomeOverlay'
import { AuthModal } from '../AuthModal'

describe('AuthModal - Cuentas de prueba y cambio de pestaña', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderModal = (isOpen = true, initialTab: 'login' | 'register' = 'login') => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <WelcomeOverlay />
          <AuthModal isOpen={isOpen} onClose={vi.fn()} initialTab={initialTab} />
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  const sinCuentasDePrueba = () => {
    expect(screen.queryByText(/cuentas de prueba/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/clave: 1234/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(usuario|tienda|fundación|admin)$/i })).not.toBeInTheDocument()
  }

  it('no expone cuentas de prueba ni claves al abrir en Iniciar sesión', () => {
    renderModal(true, 'login')

    sinCuentasDePrueba()
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument()
  })

  it('muestra la bienvenida Hola de nuevo, Valentina con foto R1 al oprimir Entrar', async () => {
    renderModal(true, 'login')

    // En demostración la cuenta de Valentina tiene el correo verificado y entra sin código (SR-RF-02)
    fireEvent.change(screen.getByPlaceholderText(/tucorreo@ejemplo.com/i), { target: { value: 'usuario@styleradar.co' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '1234' } })
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))

    const welcome = await screen.findByRole('status')
    expect(welcome).toHaveTextContent(/Hola de nuevo,s*Valentina/)
    expect(welcome).toHaveTextContent('Usuario')
    expect(welcome.querySelector('img')).toHaveAttribute('src', '/img/representantes/R1.png')
  })

  it('no muestra pestañas y ofrece redirección al registro', () => {
    renderModal(true, 'login')

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Regístrate' })).toHaveAttribute('href', '/registro')
    sinCuentasDePrueba()
  })
})
