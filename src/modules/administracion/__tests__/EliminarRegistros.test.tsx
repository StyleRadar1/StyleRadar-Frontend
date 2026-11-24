import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import AdminUserDetailPage from '@/modules/identidad/pages/AdminUserDetailPage'
import AdminUsersPage from '@/modules/identidad/pages/AdminUsersPage'
import { resetUsuariosMock } from '@/modules/identidad/services/usuarioService'
import AdminFoundationDetailPage from '../pages/AdminFoundationDetailPage'
import AdminFoundationsPage from '../pages/AdminFoundationsPage'
import AdminStoreDetailPage from '../pages/AdminStoreDetailPage'
import AdminStoresPage from '../pages/AdminStoresPage'
import { adminStoreService, resetAdminMock } from '../services/adminService'

const renderAt = (path: string, routes: [string, ReactNode][]) => render(
  <MemoryRouter initialEntries={[path]}><Routes>{routes.map(([p, el]) => <Route key={p} path={p} element={el} />)}</Routes></MemoryRouter>,
)
const T = { timeout: 3000 }

beforeEach(() => {
  resetAdminMock(); resetUsuariosMock(); sessionStorage.clear()
  localStorage.setItem('sr_user', JSON.stringify({ id: 'a-1', name: 'Mariana Bernal', role: 'STYLERADAR_ADMIN' }))
})

describe('eliminar registros desde el admin (SR-RF-115 · SR-RF-119 · SR-RF-120)', () => {
  it('elimina una tienda: confirma con «Esta acción no se puede deshacer» y vuelve a la lista sin ella', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas/luna', [['/admin/tiendas/:id', <AdminStoreDetailPage key="d" />], ['/admin/tiendas', <AdminStoresPage key="l" />]])
    await screen.findByRole('heading', { level: 1, name: 'Luna Store' }, T)
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Luna Store fue eliminada.', {}, T)).toHaveAttribute('role', 'status')
    await screen.findByRole('table', {}, T)
    expect(screen.queryByText('Luna Store')).not.toBeInTheDocument()
  })

  it('si otro administrador ya la eliminó (404), vuelve a la lista con el aviso', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas/luna', [['/admin/tiendas/:id', <AdminStoreDetailPage key="d" />], ['/admin/tiendas', <AdminStoresPage key="l" />]])
    await screen.findByRole('heading', { level: 1, name: 'Luna Store' }, T)
    await adminStoreService.remove('luna')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Esa tienda ya había sido eliminada.', {}, T)).toHaveAttribute('role', 'status')
  })

  it('cancelar no elimina nada', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas/luna', [['/admin/tiendas/:id', <AdminStoreDetailPage key="d" />]])
    await screen.findByRole('heading', { level: 1, name: 'Luna Store' }, T)
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await adminStoreService.get('luna')).toMatchObject({ nombre: 'Luna Store' })
  })

  it('elimina una fundación', async () => {
    const user = userEvent.setup()
    renderAt('/admin/fundaciones/suba', [['/admin/fundaciones/:id', <AdminFoundationDetailPage key="d" />], ['/admin/fundaciones', <AdminFoundationsPage key="l" />]])
    const titulo = await screen.findByRole('heading', { level: 1 }, T)
    const nombre = titulo.textContent ?? ''
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText(`${nombre} fue eliminada.`, {}, T)).toHaveAttribute('role', 'status')
  })

  it('elimina una cuenta de usuario y muestra «Cuenta eliminada»', async () => {
    const user = userEvent.setup()
    renderAt('/admin/usuarios/u-7', [['/admin/usuarios/:id', <AdminUserDetailPage key="d" />], ['/admin/usuarios', <AdminUsersPage key="l" />]])
    await screen.findByRole('heading', { name: 'Julián Rincón' }, T)
    await user.click(screen.getByRole('button', { name: 'Eliminar cuenta' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Cuenta eliminada', {}, T)).toBeInTheDocument()
    expect(screen.queryByText('Julián Rincón')).not.toBeInTheDocument()
  })
})
