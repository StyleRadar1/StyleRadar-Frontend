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
})
