import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { marcarSalidaVoluntaria } from '@/modules/identidad/states/salida'
import { RequireRole } from '../RequireRole'

function Donde() {
  const { pathname, search } = useLocation()
  return <p>destino:{pathname}{search}</p>
}

const renderProtegida = () => render(
  <AuthProvider>
    <MemoryRouter initialEntries={['/admin/usuarios']}>
      <Routes>
        <Route path="/admin/usuarios" element={<RequireRole roles={['ADMIN_STYLERADAR']}><p>Zona admin</p></RequireRole>} />
        <Route path="*" element={<Donde />} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

describe('RequireRole sin sesión', () => {
  it('manda al inicio de sesión del landing (/?login)', () => {
    renderProtegida()
    expect(screen.getByText('destino:/?login')).toBeInTheDocument()
  })

  it('si la persona acaba de cerrar sesión, la manda al inicio sin abrir el login', () => {
    marcarSalidaVoluntaria()
    renderProtegida()
    expect(screen.getByText('destino:/')).toBeInTheDocument()
  })
})
