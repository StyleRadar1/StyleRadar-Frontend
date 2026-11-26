import { vi } from 'vitest'
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

export const png = (name = 'foto.png', size = 2048, type = 'image/png') => new File([new Uint8Array(size)], name, { type })

export function loginAs(id: string, name: string) {
  localStorage.setItem('sr_token', 'test-token')
  localStorage.setItem('sr_user', JSON.stringify({ id, name, email: `${id}@styleradar.co`, role: 'BUYER' }))
}

export function renderAt(path: string, routes: { path: string; element: ReactNode }[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>{routes.map((r) => <Route key={r.path} path={r.path} element={r.element} />)}</Routes>
    </MemoryRouter>,
  )
}

/**
 * jsdom no carga imágenes: `new Image()` nunca dispara `onload` ni `onerror`, y la revisión de brillo de la foto
 * se quedaba esperando. Aquí la imagen "falla" al instante, así la revisión se omite como en un navegador sin canvas.
 */
export function simularImagenesSinCanvas() {
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_: string) {
        queueMicrotask(() => this.onerror?.())
      }
    },
  )
}
