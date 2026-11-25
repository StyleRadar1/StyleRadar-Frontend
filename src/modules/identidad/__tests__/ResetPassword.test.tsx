import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderAt } from '@/modules/experiencia/__tests__/helpers'
import ResetPasswordPage from '../pages/ResetPasswordPage'

const routes = [
  { path: '/restablecer-contrasena', element: <ResetPasswordPage /> },
]

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('envía OTP al correo registrado, verifica nueva contraseña y confirma restablecimiento', async () => {
    const user = userEvent.setup()
    renderAt('/restablecer-contrasena', routes)

    await user.type(screen.getByLabelText(/Correo registrado/i), 'usuario@styleradar.co')
    await user.click(screen.getByRole('button', { name: /Enviar código OTP/i }))

    expect(await screen.findByLabelText(/Código OTP/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Código OTP/i), '123456')
    await user.type(screen.getByLabelText(/^Nueva contraseña$/i), 'NuevaClave123!')
    await user.type(screen.getByLabelText(/Confirmar nueva contraseña/i), 'NuevaClave123!')
    await user.click(screen.getByRole('button', { name: /Verificar y restablecer contraseña/i }))

    await waitFor(() => {
      expect(screen.getByText(/Tu contraseña se restableció correctamente\./i)).toBeInTheDocument()
    })
  })
})
