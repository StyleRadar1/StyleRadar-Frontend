import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

export const png = (name = 'foto.png', size = 2048, type = 'image/png') => new File([new Uint8Array(size)], name, { type })

export function loginAs(id: string, name: string) {
  localStorage.setItem('sr_user', JSON.stringify({ id, name }))
}

export function renderAt(path: string, routes: { path: string; element: ReactNode }[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>{routes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}</Routes>
    </MemoryRouter>,
  )
}
