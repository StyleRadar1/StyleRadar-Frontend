import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { AuthModal } from '../AuthModal'

describe('AuthModal - Flujo OTP y usabilidad', () => {
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

  it('permite ir directamente a OTP desde Iniciar sesión', async () => {
    renderModal(true, 'login')

    const btnOtpLogin = screen.getByRole('button', { name: /Entrar con OTP/i })
    expect(btnOtpLogin).toBeInTheDocument()
    fireEvent.click(btnOtpLogin)

    expect(await screen.findByText('Verifica que eres tú')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rellenar código válido/i })).toBeInTheDocument()
  })

  it('el botón de autocompletar llena los 6 dígitos con 123456', async () => {
    renderModal(true, 'login')

    fireEvent.click(screen.getByRole('button', { name: /Entrar con OTP/i }))
    await screen.findByText('Verifica que eres tú')

    const btnAutoFill = screen.getByRole('button', { name: /Rellenar código válido/i })
    fireEvent.click(btnAutoFill)

    for (let i = 1; i <= 6; i++) {
      const input = screen.getByLabelText(`Dígito ${i}`) as HTMLInputElement
      expect(input.value).toBe(String(i))
    }
  })

  it('permite pegar 6 dígitos de una vez', async () => {
    renderModal(true, 'login')

    fireEvent.click(screen.getByRole('button', { name: /Entrar con OTP/i }))
    await screen.findByText('Verifica que eres tú')

    const input0 = screen.getByLabelText('Dígito 1')
    fireEvent.paste(input0, {
      clipboardData: {
        getData: () => '654321',
      },
    })

    const expected = ['6', '5', '4', '3', '2', '1']
    for (let i = 1; i <= 6; i++) {
      const input = screen.getByLabelText(`Dígito ${i}`) as HTMLInputElement
      expect(input.value).toBe(expected[i - 1])
    }
  })

  it('al completar el registro con OTP abre el asistente de medidas corporales para el probador', async () => {
    renderModal(true, 'register')

    // Llenar formulario de registro con cuenta demo
    fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Nueva Usuaria' } })
    fireEvent.change(screen.getByLabelText(/^Correo/i), { target: { value: 'valen@correo.com' } })
    fireEvent.change(screen.getByLabelText(/^Contraseña/i), { target: { value: 'password123' } })

    // Marcar consentimientos legales obligatorios
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => fireEvent.click(cb))

    // Enviar registro
    const btnCrear = screen.getByRole('button', { name: /Crear cuenta/i })
    fireEvent.click(btnCrear)

    // Pasa a pantalla de OTP
    expect(await screen.findByText('Verifica que eres tú')).toBeInTheDocument()

    // Autocompletar y verificar OTP
    const btnAutoFill = screen.getByRole('button', { name: /Rellenar código válido/i })
    fireEvent.click(btnAutoFill)

    const btnVerificar = screen.getByRole('button', { name: /Confirmar y entrar/i })
    fireEvent.click(btnVerificar)

    // Debe abrir el asistente de medidas anatómicas para onboarding justo después de crear la cuenta
    expect(await screen.findByRole('heading', { name: /Elige tu silueta base y unidades/i })).toBeInTheDocument()
  })
})
