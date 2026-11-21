import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import AdminUserDetailPage from '../pages/AdminUserDetailPage'
import { reiniciarDatos, renderConSesion, sesionComo } from './helpers'

const abrir = (id: string) => renderConSesion(`/admin/usuarios/${id}`, [{ path: '/admin/usuarios/:id', element: <AdminUserDetailPage /> }])

describe('Admin · Usuarios · detalle (F-14)', () => {
  beforeEach(() => { reiniciarDatos(); sesionComo('admin@styleradar.co') })

  it('muestra la cuenta y la auditoría del último cambio de estado', async () => {
    abrir('u-7')
    expect(await screen.findByRole('heading', { name: 'Julián Rincón' })).toBeInTheDocument()
    const cuenta = screen.getByRole('region', { name: 'Cuenta' })
    expect(within(cuenta).getByText('Bloqueada')).toBeInTheDocument()
    expect(within(cuenta).getByText('Kennedy')).toBeInTheDocument()
    const auditoria = screen.getByRole('region', { name: 'Último cambio de estado' })
    expect(within(auditoria).getByText('Publicó prendas que no eran suyas.')).toBeInTheDocument()
    expect(within(auditoria).getByText('Administrador a-1')).toBeInTheDocument()
  })

  it('cambia el estado desde el detalle y actualiza la auditoría', async () => {
    const user = userEvent.setup()
    abrir('u-2')
    await screen.findByRole('heading', { name: 'Mateo Pérez' })
    expect(screen.getByText('Esta cuenta no ha cambiado de estado.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cambiar estado' }))
    await user.type(screen.getByLabelText('Motivo del bloqueo (obligatorio)'), 'Prendas falsas')
    await user.click(screen.getByRole('button', { name: 'Cambiar a Bloqueada' }))
    expect(await screen.findByText('Mateo Pérez ahora está Bloqueada.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Último cambio de estado' })).getByText('Prendas falsas')).toBeInTheDocument()
  })

  it('si la cuenta no existe lo dice y ofrece volver a la lista', async () => {
    abrir('no-hay')
    expect(await screen.findByText('Esa cuenta no existe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todas las cuentas' })).toHaveAttribute('href', '/admin/usuarios')
  })
})
