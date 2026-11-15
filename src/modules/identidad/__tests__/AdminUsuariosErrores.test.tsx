import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/modules/core/api/apiClient'
import AdminUsersPage from '../pages/AdminUsersPage'
import { usuarioService } from '../services/usuarioService'
import { TEXTOS_ADMIN_USUARIOS } from '../utils/erroresAdmin'
import { reiniciarDatos, renderConSesion, sesionComo } from './helpers'

const abrir = () => renderConSesion('/admin/usuarios', [{ path: '/admin/usuarios', element: <AdminUsersPage /> }])
const fila = (nombre: string) => screen.getByText(nombre).closest('tr') as HTMLElement

const cambiarA = async (user: ReturnType<typeof userEvent.setup>, nombre: string) => {
  await screen.findByText(nombre)
  await user.click(screen.getByRole('button', { name: `Cambiar estado de ${nombre}` }))
  await user.click(screen.getByRole('button', { name: 'Cambiar a Bloqueada' }))
}

describe('Admin · Usuarios · errores del plan (Cristian)', () => {
  beforeEach(() => { reiniciarDatos(); sesionComo('admin@styleradar.co') })
  afterEach(() => { vi.restoreAllMocks() })

  it('403: «No se pudo cambiar el estado» y la cuenta queda como estaba', async () => {
    const user = userEvent.setup()
    abrir()
    await cambiarA(user, 'Paula Méndez')
    const toast = await screen.findByRole('alert')
    expect(toast).toHaveTextContent(TEXTOS_ADMIN_USUARIOS.sinPermiso.titulo)
    expect(toast).toHaveTextContent(TEXTOS_ADMIN_USUARIOS.sinPermiso.texto)
    expect(within(fila('Paula Méndez')).getByText('Activa')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deshacer' })).not.toBeInTheDocument()
  })

  it('403 del servidor real: no se muestra su texto', async () => {
    vi.spyOn(usuarioService, 'setStatus').mockRejectedValue(new ApiError(403, 'Forbidden: role ADMIN cannot…'))
    const user = userEvent.setup()
    abrir()
    await cambiarA(user, 'Mateo Pérez')
    expect(await screen.findByRole('alert')).toHaveTextContent(TEXTOS_ADMIN_USUARIOS.sinPermiso.titulo)
    expect(screen.queryByText(/Forbidden/)).not.toBeInTheDocument()
    expect(within(fila('Mateo Pérez')).getByText('Activa')).toBeInTheDocument()
  })

  it('404: «Ese usuario no existe» y la lista se refresca', async () => {
    const user = userEvent.setup()
    abrir()
    expect(await screen.findByText('14 cuentas')).toBeInTheDocument()
    await cambiarA(user, 'Felipe Castro')
    expect(await screen.findByText(TEXTOS_ADMIN_USUARIOS.noExiste.titulo)).toBeInTheDocument()
    expect(screen.getByText(TEXTOS_ADMIN_USUARIOS.noExiste.texto)).toBeInTheDocument()
    expect(await screen.findByText('13 cuentas')).toBeInTheDocument()
    expect(screen.queryByText('Felipe Castro')).not.toBeInTheDocument()
  })
})
