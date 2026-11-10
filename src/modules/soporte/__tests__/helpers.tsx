import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import type { Role } from '@/modules/core/types/roles'

/** Deja una sesión iniciada como lo hace el login simulado (token + usuario). */
export function loginAs(id: string, name: string, role: Role = 'COMPRADOR') {
  localStorage.setItem('sr_token', `demo-${id}`)
  localStorage.setItem('sr_user', JSON.stringify({ id, name, email: `${id}@styleradar.co`, role }))
}

export function renderAt(path: string, routes: { path: string; element: ReactNode }[]) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{routes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}</Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}
