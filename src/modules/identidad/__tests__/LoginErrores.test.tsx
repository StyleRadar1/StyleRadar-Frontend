import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthModal } from '@/components/modals/AuthModal'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { AuthProvider } from '../states/AuthProvider'
import { TEXTOS_ACCESO } from '../utils/erroresAcceso'
import { reiniciarDatos } from './helpers'

const abrir = () => render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AuthModal isOpen onClose={() => {}} />} />
        <Route path="/catalogo" element={<p>Inicio del comprador</p>} />
        <Route path="/playlists/12" element={<p>La playlist donde estaba</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

const escribir = (correo: string, clave: string) => {
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: correo } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: clave } })
}
const entrar = () => fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

describe('Iniciar sesión · errores del plan (Cristian)', () => {
  beforeEach(() => { reiniciarDatos() })
  afterEach(() => { vi.useRealTimers(); localStorage.clear(); sessionStorage.clear() })

  it('400: valida antes de enviar y pone el mensaje debajo de cada campo', async () => {
    abrir()
    escribir('valentina@', '12')
    entrar()
    expect((await screen.findByText(/Escribe un correo válido/)).closest('[role="alert"]')).toHaveAttribute('id', 'authEmail-err')
    expect(screen.getByText('La contraseña tiene al menos 4 caracteres.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Correo')).toHaveFocus()
  })

  it('401: el mismo texto si el correo no existe o si la contraseña es mala', async () => {
    abrir()
    escribir('nadie@styleradar.co', '1234')
    entrar()
    expect(await screen.findByText(TEXTOS_ACCESO.credenciales, {}, { timeout: 3000 })).toBeInTheDocument()
    escribir('usuario@styleradar.co', 'mala')
    entrar()
    expect(await screen.findByText(TEXTOS_ACCESO.credenciales, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByText(/no existe|no encontramos|no coincide/i)).not.toBeInTheDocument()
  })

  it('403: cuenta bloqueada sin decir que está bloqueada', async () => {
    abrir()
    escribir('bloqueada@styleradar.co', '1234')
    entrar()
    expect(await screen.findByText(TEXTOS_ACCESO.bloqueada, {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('503: ofrece Reintentar', async () => {
    abrir()
    escribir('caido@styleradar.co', '1234')
    entrar()
    expect(await screen.findByText(TEXTOS_ACCESO.servicio, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('429: el botón queda bloqueado con cuenta regresiva', async () => {
    abrir()
    escribir('muchos-intentos@styleradar.co', '1234')
    entrar()
    expect(await screen.findByText(TEXTOS_ACCESO.limite, {}, { timeout: 3000 })).toBeInTheDocument()
    const boton = screen.getByRole('button', { name: /Intenta de nuevo en 1:00|Intenta de nuevo en 0:59/ })
    expect(boton).toBeDisabled()
  })

  it('al entrar vuelve a la página guardada cuando la sesión venció', async () => {
    guardarRetorno('/playlists/12')
    abrir()
    escribir('usuario@styleradar.co', '1234')
    entrar()
    expect(await screen.findByText('La playlist donde estaba', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('sin página guardada va al inicio de su rol', async () => {
    abrir()
    escribir('usuario@styleradar.co', '1234')
    entrar()
    expect(await screen.findByText('Inicio del comprador', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})

describe('Código OTP · errores del plan', () => {
  afterEach(() => { vi.useRealTimers() })

  const irAlCodigo = async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByRole('tab', { name: /Crear cuenta/ }))
    fireEvent.change(await screen.findByLabelText(/Nombre/), { target: { value: 'Valentina Rojas' } })
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'valen@correo.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreta1' } })
    fireEvent.submit(screen.getByLabelText('Correo').closest('form') as HTMLFormElement)
    await screen.findByText('Verifica que eres tú')
  }
  const codigo = (c: string) => c.split('').forEach((d, i) => fireEvent.change(screen.getByLabelText(`Dígito ${i + 1}`), { target: { value: d } }))
  const confirmar = () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar y entrar' }))

  it('401: código equivocado o vencido → mensaje debajo del código y opción de pedir otro', async () => {
    await irAlCodigo()
    codigo('000000'); confirmar()
    expect((await screen.findByText(TEXTOS_ACCESO.otp)).closest('[role="alert"]')).toHaveAttribute('id', 'authOtp-err')
    fireEvent.click(screen.getByRole('button', { name: 'Pedir otro código' }))
    expect(screen.getByRole('status')).toHaveTextContent('Te enviamos un código nuevo a valen@correo.com.')
  })

  it('429: a los 3 intentos fallidos bloquea con cuenta regresiva', async () => {
    await irAlCodigo()
    for (let i = 0; i < 3; i++) { codigo('000000'); confirmar(); await act(async () => {}) }
    expect(await screen.findByText(TEXTOS_ACCESO.otpLimite)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Intenta de nuevo en/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Podrás pedir otro código en/ })).toBeDisabled()
  })
})
