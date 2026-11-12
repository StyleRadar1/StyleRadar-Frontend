import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import RegisterPage from '../pages/RegisterPage'
import { reiniciarDatos, renderConSesion } from './helpers'

const routes = [
  { path: '/registro', element: <RegisterPage /> },
  { path: '/catalogo', element: <h1>Catálogo</h1> },
]
const abrir = () => renderConSesion('/registro', routes)

describe('RegisterPage (RF-01)', () => {
  beforeEach(() => { reiniciarDatos() })

  it('valida los campos y lleva el foco al primero con error', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText(/mínimo 3 letras/)).toBeInTheDocument()
    expect(screen.getByText(/correo válido/)).toBeInTheDocument()
    expect(screen.getByText(/al menos 6 caracteres/)).toBeInTheDocument()
    expect(screen.getByText(/aceptar los términos/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveFocus()
  })

  it('crea la cuenta, inicia la sesión y lleva al catálogo', async () => {
    const user = userEvent.setup()
    abrir()
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana María Gómez')
    await user.type(screen.getByLabelText('Correo'), 'ana@correo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secreta1')
    await user.click(screen.getByRole('radio', { name: /Hombre/ }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('sr_user') ?? '{}')).toMatchObject({ name: 'Ana María Gómez', role: 'COMPRADOR' })
    expect(localStorage.getItem('sr_token')).toBeTruthy()
  })

  it('si el correo ya tiene cuenta (409) no lo confirma y ofrece entrar o recuperar', async () => {
    const user = userEvent.setup()
    abrir()
    await user.type(screen.getByLabelText('Nombre completo'), 'Otra Persona')
    await user.type(screen.getByLabelText('Correo'), 'usuario@styleradar.co')
    await user.type(screen.getByLabelText('Contraseña'), 'secreta1')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos crear la cuenta con esos datos.')
    expect(screen.queryByText(/ya existe|ya tiene cuenta|ya está registrad/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Recuperar contraseña' })).toBeInTheDocument()
  })

  it('muestra u oculta la contraseña', async () => {
    const user = userEvent.setup()
    abrir()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
  })
})
