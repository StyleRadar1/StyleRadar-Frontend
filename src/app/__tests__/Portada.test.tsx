import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'

vi.mock('@/modules/landing/pages/LandingPage', () => ({ default: () => <p>Landing</p> }))

const { Portada } = await import('../router')

const renderPortada = (inicio: string) => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[inicio]}>
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/inicio" element={<p>Inicio del comprador</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

const loginComprador = () => {
  localStorage.setItem('sr_token', 'demo-u-1')
  localStorage.setItem('sr_user', JSON.stringify({ id: 'u-1', name: 'Valentina Rojas', email: 'u-1@styleradar.co', role: 'BUYER' }))
}

describe('portada (/)', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

  it('sin sesión muestra el landing', async () => {
    renderPortada('/')
    expect(await screen.findByText('Landing')).toBeInTheDocument()
  })

  it('con sesión lleva al inicio de su rol', async () => {
    loginComprador()
    renderPortada('/')
    expect(await screen.findByText('Inicio del comprador')).toBeInTheDocument()
  })

  it('durante el inicio de sesión (/?login) no redirige: el modal lleva a la página guardada', async () => {
    loginComprador()
    renderPortada('/?login')
    expect(await screen.findByText('Landing')).toBeInTheDocument()
    expect(screen.queryByText('Inicio del comprador')).not.toBeInTheDocument()
  })
})
