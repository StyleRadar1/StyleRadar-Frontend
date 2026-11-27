import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { ThemeProvider } from '@/modules/core/theme'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import StatsPage from '../pages/StatsPage'
import { loginAs } from './helpers'

const renderAdmin = (path = '/admin/estadisticas') => render(
  <ThemeProvider>
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin/estadisticas" element={<StatsPage />} />
            <Route path="/admin/usuarios" element={<p>Página de usuarios</p>} />
          </Route>
          <Route path="/" element={<p>Inicio del landing</p>} />
          <Route path="/inicio" element={<p>Inicio del comprador</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  </ThemeProvider>,
)

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

describe('módulo de administración', () => {
  it('tiene la barra lateral con todas las secciones del prototipo y sus insignias', async () => {
    loginAs('a-1', 'Mariana Bernal', 'STYLERADAR_ADMIN')
    renderAdmin()
    const nav = screen.getByRole('navigation', { name: 'Administración' })
    expect(within(nav).getByRole('link', { name: 'Estadísticas' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Usuarios' })).toHaveAttribute('href', '/admin/usuarios')
    expect(within(nav).getByRole('link', { name: 'Pagos' })).toHaveAttribute('href', '/admin/pagos')
    expect(await within(nav).findByRole('link', { name: /Publicaciones\s*5\s*pendientes/ }, { timeout: 3000 })).toHaveAttribute('href', '/admin/moderacion')
    expect(await within(nav).findByRole('link', { name: /Tiendas\s*1\s*pendientes/ })).toHaveAttribute('href', '/admin/tiendas')
    expect(within(nav).getByRole('link', { name: 'Fundaciones' })).toHaveAttribute('href', '/admin/fundaciones')
    expect(within(nav).getByRole('link', { name: 'Playlists' })).toHaveAttribute('href', '/admin/playlists')
    expect(within(nav).queryByText('Pronto')).not.toBeInTheDocument()
    expect(screen.getByText('Mariana Bernal')).toBeInTheDocument()
  })

  it('solo entra el administrador', () => {
    loginAs('u-1', 'Valentina Rojas', 'BUYER')
    renderAdmin()
    expect(screen.getByText('Inicio del comprador')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Administración' })).not.toBeInTheDocument()
  })

  it('cierra sesión desde el menú del administrador y pide confirmación', async () => {
    const user = userEvent.setup()
    loginAs('a-1', 'Mariana Bernal', 'STYLERADAR_ADMIN')
    renderAdmin('/admin/usuarios')
    expect(screen.queryByRole('link', { name: 'Volver al radar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cuenta de administrador: Mariana Bernal' }))
    await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByText('Inicio del landing')).toBeInTheDocument()
  })
})

describe('estadísticas del administrador (RF-86 a 91)', () => {
  beforeEach(() => loginAs('a-1', 'Mariana Bernal', 'STYLERADAR_ADMIN'))

  it('muestra los seis indicadores principales con sus totales y sin «NaN»', async () => {
    renderAdmin()
    expect(await screen.findByRole('heading', { level: 1, name: 'Estadísticas' }, { timeout: 3000 })).toBeInTheDocument()
    const indicadores = screen.getByRole('region', { name: 'Indicadores principales' })
    for (const nombre of ['Usuarios registrados', 'Compradores', 'Almacenes aliados', 'Prendas publicadas', 'Playlists creadas', 'Donaciones del mes']) {
      expect(within(indicadores).getByText(nombre)).toBeInTheDocument()
    }
    for (const total of ['920', '40', '1.420', '385', '42']) {
      expect(await within(indicadores).findByText(total, {}, { timeout: 3000 })).toBeInTheDocument()
    }
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('muestra las gráficas de ingresos y registros, con selector de mes y vista de tabla', async () => {
    const user = userEvent.setup()
    renderAdmin()
    expect(await screen.findByRole('heading', { name: 'Ingresos por suscripciones' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Registros de usuarios por día' })).toBeInTheDocument()
    expect(screen.getAllByRole('combobox', { name: 'Seleccionar mes de registros' }).length).toBeGreaterThan(0)
    expect(await screen.findByRole('list', { name: 'Registros de usuarios por día' }, { timeout: 3000 })).toBeInTheDocument()

    const revenueGroup = screen.getByRole('group', { name: 'Tipo de gráfico para Ingresos por suscripciones' })
    await user.click(within(revenueGroup).getByRole('button', { name: /tabla/i }))
    expect(screen.getByRole('table', { name: 'Ingresos por suscripciones' })).toBeInTheDocument()
  })
})
