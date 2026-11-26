import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { LegalFooter } from '@/modules/legal/components/LegalFooter'
import { hasSeenLanding, LANDING_SEEN_KEY, markLandingSeen } from '@/modules/landing/landingSeen'
import LoginPage from '@/modules/identidad/pages/LoginPage'

function RutaActual() {
  const { pathname, search } = useLocation()
  return <p data-testid="ruta">{pathname + search}</p>
}

function PortadaPrueba() {
  const [params] = useSearchParams()
  const [seenOnEntry] = useState(() => hasSeenLanding())
  useEffect(() => {
    if (!seenOnEntry) markLandingSeen()
  }, [seenOnEntry])
  if (seenOnEntry) {
    return <p data-testid="redir">{params.has('login') ? '/login' : '/catalogo'}</p>
  }
  return <p data-testid="landing">LandingPage</p>
}

describe('Landing una sola vez, /login y enlace StyleRadar', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('muestra LandingPage en la primera visita sin expulsar y marca localStorage para las siguientes', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <PortadaPrueba />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('landing')).toBeInTheDocument()
    await waitFor(() => {
      expect(localStorage.getItem(LANDING_SEEN_KEY)).toBe('true')
    })
    expect(screen.getByTestId('landing')).toBeInTheDocument()
    unmount()

    render(
      <MemoryRouter initialEntries={['/']}>
        <PortadaPrueba />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('redir')).toHaveTextContent('/catalogo')
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
