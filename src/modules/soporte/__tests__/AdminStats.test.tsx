import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import StatsPage from '../pages/StatsPage'
import { loginAs } from './helpers'

const renderAdmin = (path = '/admin/estadisticas') => render(
  <AuthProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/estadisticas" element={<StatsPage />} />
          <Route path="/admin/usuarios" element={<p>Página de usuarios</p>} />
        </Route>
        <Route path="/" element={<p>Inicio del landing</p>} />
        <Route path="/catalogo" element={<p>Catálogo</p>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
)

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

describe('módulo de administración', () => {
  it('tiene la barra lateral con todas las secciones del prototipo y sus insignias', async () => {
    loginAs('a-1', 'Mariana Bernal', 'ADMIN_STYLERADAR')
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
    loginAs('u-1', 'Valentina Rojas', 'COMPRADOR')
    renderAdmin()
    expect(screen.getByText('Catálogo')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Administración' })).not.toBeInTheDocument()
  })

  it('pide confirmación para cerrar sesión', async () => {
    const user = userEvent.setup()
    loginAs('a-1', 'Mariana Bernal', 'ADMIN_STYLERADAR')
    renderAdmin('/admin/usuarios')
    await user.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0])
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByText('Inicio del landing')).toBeInTheDocument()
  })
})

describe('estadísticas del administrador (RF-86 a 91)', () => {
  beforeEach(() => loginAs('a-1', 'Mariana Bernal', 'ADMIN_STYLERADAR'))

  it('muestra los siete indicadores con sus variaciones', async () => {
    renderAdmin()
    expect(await screen.findByRole('heading', { level: 1, name: 'Estadísticas' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('1.859')).toBeInTheDocument()
    expect(screen.getByText(/11.2% vs\. agosto/)).toBeInTheDocument()
    expect(screen.getByText('1 pendiente de verificación')).toBeInTheDocument()
    expect(screen.getByText('Ingresos de septiembre')).toBeInTheDocument()
    expect(screen.getByText('Solicitudes registradas')).toBeInTheDocument()
  })

  it('tiene actividad diaria con tabla, ingresos, usuarios en vivo, meta sin «NaN» y cuentas por plan', async () => {
    const user = userEvent.setup()
    renderAdmin()
    const dia = await screen.findByRole('listitem', { name: '13 sep: 1.220 búsquedas, 44 registros y 74 publicaciones' }, { timeout: 3000 })
    await user.hover(dia)
    expect(screen.getByRole('tooltip')).toHaveTextContent(/Búsquedas\s*1\.220/)

    const actividad = screen.getByRole('region', { name: 'Actividad diaria · septiembre 2026' })
    await user.click(within(actividad).getByRole('button', { name: 'Ver como tabla' }))
    expect(within(screen.getByRole('table', { name: 'Detalle de actividad diaria' })).getAllByRole('row')).toHaveLength(25)

    expect(screen.getByRole('listitem', { name: /^septiembre: Usuarios \(Radar\+\) \$44,7 mil, Tiendas aliadas \$178 mil$/ })).toBeInTheDocument()
    const vivo = screen.getByRole('region', { name: 'Usuarios conectados ahora' })
    expect(within(vivo).getByText('En vivo')).toBeInTheDocument()
    expect(await within(vivo).findByText(/^\d{3}$/, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Avance de la meta de ingresos de septiembre: 22%' })).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    const planes = screen.getByRole('list', { name: 'Cuentas por plan' })
    expect(within(planes).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Radar (gratis)840 cuentas70%', 'Radar+300 cuentas25%', 'Tiendas aliadas63 cuentas5%'])
  })
})
