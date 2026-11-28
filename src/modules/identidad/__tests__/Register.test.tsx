import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import RegisterPage from '../pages/RegisterPage'
import { reiniciarDatos, renderConSesion } from './helpers'

const routes = [
  { path: '/registro', element: <RegisterPage /> },
  { path: '/catalogo', element: <h1>Catálogo</h1> },
  { path: '/login', element: <h1>Inicio de sesión</h1> },
]
const abrir = () => renderConSesion('/registro', routes)

describe('RegisterPage (RF-01)', () => {
  beforeEach(() => { reiniciarDatos() })

  it('valida los campos y lleva el foco al primero con error', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText(/Entre 2 y 100 caracteres/)).toBeInTheDocument()
    expect(screen.getByText(/correo válido/)).toBeInTheDocument()
    expect(screen.getAllByText(/8 a 72 caracteres/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Términos y Condiciones/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveFocus()
  })

  it('crea la cuenta sin verificar y muestra el paso de OTP del registro (SR-RF-01 paso 6)', async () => {
    const user = userEvent.setup()
    abrir()
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana María Gómez')
    await user.type(screen.getByLabelText('Correo'), 'ana@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Secreta1*')
    for (const cb of screen.getAllByRole('checkbox')) {
      await user.click(cb)
    }
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Verifica que eres tú')).toBeInTheDocument()
    // El correo queda sin verificar: todavía no hay sesión.
    expect(localStorage.getItem('sr_token')).toBeNull()
  })

  it('muestra u oculta la contraseña', async () => {
    const user = userEvent.setup()
    abrir()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: /Mostrar contraseña/i }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
  })
})
