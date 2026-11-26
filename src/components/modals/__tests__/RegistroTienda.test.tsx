import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PricingPlans } from '@/components/landing/PricingPlans'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import RegisterPage from '@/modules/identidad/pages/RegisterPage'
import { authService } from '@/modules/identidad/services/authService'
import { reiniciarDatos } from '@/modules/identidad/__tests__/helpers'
import { AuthModal } from '../AuthModal'

describe('alta de una tienda', () => {
  beforeEach(() => {
    reiniciarDatos()
    vi.restoreAllMocks()
  })

  it('«Registrar mi tienda» en los planes abre Crear cuenta como tienda', async () => {
    const abrir = vi.fn()
    render(<MemoryRouter><PricingPlans onOpenRegister={abrir} /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Registrar mi tienda' }))
    expect(abrir).toHaveBeenCalledWith('STORE_ADMIN')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta gratis' }))
    expect(abrir).toHaveBeenLastCalledWith('BUYER')
  })

  it('el modal abierto con initialRole STORE_ADMIN registra la tienda y, tras el código, va a /tienda/registro', async () => {
    const registrar = vi.spyOn(authService, 'register')
    render(
      <MemoryRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AuthModal isOpen onClose={vi.fn()} initialTab="register" initialRole="STORE_ADMIN" />} />
            <Route path="/tienda/registro" element={<h1>Registrar almacén</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('radio', { name: /Tienda/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.change(screen.getByLabelText('Nombre de la tienda'), { target: { value: 'Luna Store' } })
    fireEvent.change(screen.getByLabelText(/^Correo/i), { target: { value: 'luna@tienda.co' } })
    fireEvent.change(screen.getByLabelText(/^Contraseña/i), { target: { value: 'Password123*' } })
    screen.getAllByRole('checkbox').forEach((cb) => fireEvent.click(cb))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar mi tienda' }))

    expect(await screen.findByText('Verifica que eres tú')).toBeInTheDocument()
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ role: 'STORE_ADMIN' }))
    fireEvent.click(screen.getByRole('button', { name: /Rellenar código válido/i }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmar y entrar/i }))
    expect(await screen.findByRole('heading', { name: 'Registrar almacén' })).toBeInTheDocument()
  })

  it.each(['/registro?rol=tienda', '/registro?tipo=tienda'])('%s registra la cuenta como tienda', async (ruta) => {
    const registrar = vi.spyOn(authService, 'register')
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="*" element={<h1>Siguiente</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/^Nombre/), 'Luna Store')
    await user.type(screen.getByLabelText('Correo'), 'luna2@tienda.co')
    await user.type(screen.getByLabelText('Contraseña'), 'Secreta1*')
    for (const cb of screen.getAllByRole('checkbox')) await user.click(cb)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await screen.findByRole('heading', { name: 'Siguiente' })
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ role: 'STORE_ADMIN' }))
  })
})
