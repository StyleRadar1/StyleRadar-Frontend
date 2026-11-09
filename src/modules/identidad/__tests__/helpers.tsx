import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../states/AuthProvider'
import { DEMO_ACCOUNTS } from '../mocks/demoAccounts'
import { resetUsuariosMock } from '../services/usuarioService'
import { resetRegistrosMock } from '../services/authService'

/** Deja una sesión de prueba guardada, como si la persona hubiera iniciado sesión. */
export function sesionComo(email: string) {
  const u = DEMO_ACCOUNTS.find((a) => a.email === email)
  if (!u) throw new Error(`No hay cuenta de prueba ${email}`)
  localStorage.setItem('sr_token', `demo-${u.id}`)
  localStorage.setItem('sr_user', JSON.stringify(u))
}

export function reiniciarDatos() {
  resetUsuariosMock()
  resetRegistrosMock()
}

export function renderConSesion(path: string, routes: { path: string; element: ReactNode }[]) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{routes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}</Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}
