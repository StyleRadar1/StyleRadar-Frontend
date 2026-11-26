import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { marcarSalidaVoluntaria } from '@/modules/identidad/states/salida'
import { LegalFooter } from '@/modules/legal/components/LegalFooter'
import { LANDING_SEEN_KEY, markLandingSeen } from '@/modules/landing/landingSeen'
import LoginPage from '@/modules/identidad/pages/LoginPage'

function RutaActual() {
  const { pathname, search } = useLocation()
  return <p data-testid="ruta">{pathname + search}</p>
}

function LogoutHarness() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => {
        marcarSalidaVoluntaria()
        logout()
        navigate('/', { replace: true })
      }}
    >
      Cerrar sesión
    </button>
  )
}

function ExpireHarness() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event('sr:sesion-expirada'))
        navigate('/?login', { replace: true })
      }}
    >
      Expirar sesión
    </button>
  )
}

function PortadaPrueba() {
  useEffect(() => {
    markLandingSeen()
  }, [])
  return <p data-testid="landing">LandingPage</p>
}

describe('Landing, /login y enlace StyleRadar', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('muestra LandingPage en cada visita sin sesión, aunque ya se haya visto', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <PortadaPrueba />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('landing')).toBeInTheDocument()
    await waitFor(() => {
      expect(localStorage.getItem(LANDING_SEEN_KEY)).toBe('true')
    })
    unmount()

    render(
      <MemoryRouter initialEntries={['/']}>
        <PortadaPrueba />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('landing')).toBeInTheDocument()
  })

  it('vuelve al landing después de un logout voluntario aunque ya se hubiera visto', async () => {
    localStorage.setItem(LANDING_SEEN_KEY, 'true')
    localStorage.setItem('sr_token', 'jwt-test')
    localStorage.setItem(
      'sr_user',
      JSON.stringify({ id: 'u-1', name: 'Valentina Rojas', email: 'usuario@styleradar.co', role: 'BUYER' }),
    )

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/catalogo']}>
          <Routes>
            <Route path="/" element={<PortadaPrueba />} />
            <Route path="/catalogo" element={<LogoutHarness />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByTestId('landing')).toHaveTextContent('LandingPage')
    expect(localStorage.getItem(LANDING_SEEN_KEY)).toBe('true')
  })

  it('vuelve al landing cuando la sesión expira aunque ya se hubiera visto', () => {
    localStorage.setItem(LANDING_SEEN_KEY, 'true')
    localStorage.setItem('sr_token', 'jwt-test')
    localStorage.setItem(
      'sr_user',
      JSON.stringify({ id: 'u-1', name: 'Valentina Rojas', email: 'usuario@styleradar.co', role: 'BUYER' }),
    )

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/catalogo']}>
          <Routes>
            <Route path="/" element={<PortadaPrueba />} />
            <Route path="/catalogo" element={<ExpireHarness />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expirar sesión' }))
    expect(screen.getByTestId('landing')).toHaveTextContent('LandingPage')
    expect(localStorage.getItem(LANDING_SEEN_KEY)).toBe('true')
  })

  it('redirige /?login a /login cuando la landing ya fue vista y LoginPage abre AuthModal sin LandingPage', () => {
    localStorage.setItem(LANDING_SEEN_KEY, 'true')

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<RutaActual />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument()
  })

  it('LegalFooter apunta el logo StyleRadar a /fundacion cuando hay sesión de fundación', () => {
    localStorage.setItem('sr_token', 'demo-f-1')
    localStorage.setItem(
      'sr_user',
      JSON.stringify({ id: 'f-1', name: 'Fundación Abrigo', email: 'abrigo@styleradar.co', role: 'FOUNDATION_REPRESENTATIVE' }),
    )

    render(
      <AuthProvider>
        <MemoryRouter>
          <LegalFooter />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('link', { name: /StyleRadar\s*Bogotá/i })).toHaveAttribute('href', '/fundacion')
  })
})
