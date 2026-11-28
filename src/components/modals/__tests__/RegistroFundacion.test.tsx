import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PricingPlans } from '@/components/landing/PricingPlans'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import RegisterPage from '@/modules/identidad/pages/RegisterPage'
import { authService } from '@/modules/identidad/services/authService'
import { reiniciarDatos } from '@/modules/identidad/__tests__/helpers'
import PlansPage from '@/modules/transacciones/pages/PlansPage'
import { AuthModal } from '../AuthModal'

describe('flujo real de alta de fundaciones (SR-RF-63: solo administrador)', () => {
  beforeEach(() => {
    reiniciarDatos()
    vi.restoreAllMocks()
  })

  it('AuthModal en Crear cuenta solo permite Usuario o Tienda e informa que las fundaciones las registra el administrador', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthModal isOpen onClose={vi.fn()} initialTab="register" />
        </AuthProvider>
      </MemoryRouter>,
    )

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Usuario/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Tienda/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Fundación/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Registrar mi fundación/i })).not.toBeInTheDocument()
    expect(screen.getByText(/certificado ESAL/i)).toBeInTheDocument()
  })

  it.each(['/registro?tipo=fundacion', '/registro?rol=fundacion'])(
    '%s muestra aviso de registro por administrador y crea cuenta personal como BUYER',
    async (ruta) => {
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

      expect(screen.getByRole('heading', { name: 'Regístrate' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Registra tu fundación/i })).not.toBeInTheDocument()
      expect(screen.getByText(/certificado ESAL/i)).toBeInTheDocument()

      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Nombre completo'), 'Camila Representante')
      await user.type(screen.getByLabelText('Correo'), 'rep@fundacion.co')
      await user.type(screen.getByLabelText('Contraseña'), 'Secreta1*')
      for (const cb of screen.getAllByRole('checkbox')) await user.click(cb)
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
      expect(await screen.findByText('Verifica que eres tú')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Rellenar código válido/i }))
      await user.click(screen.getByRole('button', { name: 'Confirmar y entrar' }))

      expect(await screen.findByRole('heading', { name: /Elige tu silueta base/i })).toBeInTheDocument()
      expect(registrar).toHaveBeenCalledWith(expect.not.objectContaining({ role: 'FOUNDATION_REPRESENTATIVE' }))
    },
  )

  it('PricingPlans y PlansPage enlazan Fundación aliada a /registro?tipo=fundacion como Solicitar vinculación', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <PricingPlans onOpenRegister={vi.fn()} />
          <PlansPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link', { name: 'Solicitar vinculación' })
    expect(links.length).toBeGreaterThanOrEqual(2)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/registro?tipo=fundacion')
    }
    expect(screen.queryByRole('button', { name: /Registrar mi fundación/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Registrar mi fundación/i })).not.toBeInTheDocument()
  })
})
