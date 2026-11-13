import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('muestra las cuentas de prueba al abrir en Iniciar sesión', () => {
    renderModal(true, 'login')

    expect(screen.getByText(/cuentas de prueba/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^usuario$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^tienda$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^fundación$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^admin$/i })).toBeInTheDocument()
  })

  it('muestra la bienvenida Hola de nuevo, Valentina con foto R1 al oprimir Entrar', async () => {
    renderModal(true, 'login')

    // Seleccionar cuenta de prueba Usuario (Valentina)
    const userDemoBtn = screen.getByRole('button', { name: /^usuario$/i })
    fireEvent.click(userDemoBtn)

    // Oprimir Entrar
    const submitBtn = screen.getByRole('button', { name: /^entrar$/i })
    fireEvent.click(submitBtn)

    // Debe mostrar la bienvenida
    const welcome = await screen.findByRole('status')
    expect(welcome).toHaveTextContent(/Hola de nuevo,\s*Valentina/)
    expect(welcome).toHaveTextContent('Usuario')
    expect(welcome.querySelector('img')).toHaveAttribute('src', '/img/representantes/R1.png')
  })

  it('mantiene las cuentas de prueba visibles y funcionales al cambiar a Crear cuenta y volver a Iniciar sesión', async () => {
    renderModal(true, 'login')

    // 1. Inicialmente se ven las cuentas de prueba
    expect(screen.getByText(/cuentas de prueba/i)).toBeInTheDocument()

    // 2. Cambiar a Crear cuenta mediante la pestaña
    const registerTab = screen.getByRole('tab', { name: /crear cuenta/i })
    fireEvent.click(registerTab)

    // En Crear cuenta no deben estar las cuentas de prueba
    await waitFor(() => {
      expect(screen.queryByText(/cuentas de prueba/i)).not.toBeInTheDocument()
    })

    // 3. Volver a Iniciar sesión mediante la pestaña
    const loginTab = screen.getByRole('tab', { name: /iniciar sesión/i })
    fireEvent.click(loginTab)

    // Las cuentas de prueba deben reaparecer intactas
    await waitFor(() => {
      expect(screen.getByText(/cuentas de prueba/i)).toBeInTheDocument()
    })

    // Verificar que los botones de cuentas de prueba están presentes y responden al clic
    const storeDemoBtn = screen.getByRole('button', { name: /^tienda$/i })
    expect(storeDemoBtn).toBeInTheDocument()
    fireEvent.click(storeDemoBtn)

    const emailInput = screen.getByPlaceholderText(/tucorreo@ejemplo.com/i) as HTMLInputElement
    expect(emailInput.value).toBe('luna@styleradar.co')
  })

  it('mantiene las cuentas de prueba al volver mediante el enlace del pie de página', async () => {
    renderModal(true, 'login')

    // Ir a Crear cuenta desde el botón del pie
    const toRegisterLink = screen.getByRole('button', { name: /crear cuenta gratis →/i })
    fireEvent.click(toRegisterLink)

    await waitFor(() => {
      expect(screen.queryByText(/cuentas de prueba/i)).not.toBeInTheDocument()
    })

    // Volver a Iniciar sesión desde el botón del pie
    const toLoginLink = screen.getByRole('button', { name: /inicia sesión →/i })
    fireEvent.click(toLoginLink)

    await waitFor(() => {
      expect(screen.getByText(/cuentas de prueba/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^usuario$/i })).toBeInTheDocument()
    })
  })
})
