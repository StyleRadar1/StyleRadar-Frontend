import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminUsersPage from '../pages/AdminUsersPage'
import { usuarioService } from '../services/usuarioService'
import { isSameAccount } from '../utils/formato'
import { reiniciarDatos, renderConSesion, sesionComo } from './helpers'

const routes = [{ path: '/admin/usuarios', element: <AdminUsersPage /> }]
const abrir = () => renderConSesion('/admin/usuarios', routes)
const fila = (nombre: string) => screen.getByText(nombre).closest('tr') as HTMLElement

describe('AdminUsersPage (SR-RF-66)', () => {
  beforeEach(() => { reiniciarDatos(); sesionComo('admin@styleradar.co') })
  afterEach(() => { vi.restoreAllMocks() })

  it('muestra el estado de carga y luego la lista de cuentas', async () => {
    abrir()
    expect(screen.getByRole('status')).toHaveTextContent(/Cargando cuentas/i)
    expect(await screen.findByText('Valentina Rojas')).toBeInTheDocument()
    expect(screen.getByText('14 cuentas')).toBeInTheDocument()
  })

  it('busca por nombre o correo sin importar tildes', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Valentina Rojas')
    await user.type(screen.getByLabelText('Buscar'), 'andres')
    expect(await screen.findByText('1 cuenta')).toBeInTheDocument()
    expect(screen.getByText('Andrés Mora')).toBeInTheDocument()
    expect(screen.queryByText('Valentina Rojas')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('Buscar'))
    await user.type(screen.getByLabelText('Buscar'), 'luna@')
    expect(await screen.findByText('Luna Store')).toBeInTheDocument()
    expect(screen.getByText('1 cuenta')).toBeInTheDocument()
  })

  it('pide la búsqueda al servidor con los filtros del contrato', async () => {
    const spy = vi.spyOn(usuarioService, 'listAdmin')
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Valentina Rojas')
    expect(spy).toHaveBeenLastCalledWith({ q: '', page: 0, size: 20 })
    await user.click(screen.getByRole('button', { name: 'Bloqueada' }))
    await user.selectOptions(screen.getByLabelText('Rol'), 'BUYER')
    await screen.findByText('Julián Rincón')
    expect(spy).toHaveBeenLastCalledWith({ q: '', page: 0, size: 20, status: 'BLOCKED', role: 'BUYER' })
  })

  it('cada nombre lleva al detalle de la cuenta', async () => {
    abrir()
    expect(await screen.findByRole('link', { name: 'Mateo Pérez' })).toHaveAttribute('href', '/admin/usuarios/u-2')
  })

  it('filtra por estado y por rol', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Valentina Rojas')
    await user.click(screen.getByRole('button', { name: 'Bloqueada' }))
    expect(await screen.findByText('Julián Rincón')).toBeInTheDocument()
    expect(screen.getByText('1 cuenta')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Todas' }))
    await user.selectOptions(screen.getByLabelText('Rol'), 'STORE_ADMIN')
    expect(await screen.findByText('Luna Store')).toBeInTheDocument()
    expect(screen.getByText('1 cuenta')).toBeInTheDocument()
  })

  it('ofrece quitar los filtros cuando nada coincide', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Valentina Rojas')
    await user.type(screen.getByLabelText('Buscar'), 'nadie-se-llama-asi')
    expect(await screen.findByText('Ninguna cuenta coincide')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    expect(await screen.findByText('14 cuentas')).toBeInTheDocument()
  })

  it('cambia una cuenta a Bloqueada con motivo obligatorio y permite deshacer', async () => {
    const spy = vi.spyOn(usuarioService, 'setStatus')
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Mateo Pérez')
    await user.click(screen.getByRole('button', { name: 'Cambiar estado de Mateo Pérez' }))
    const dialog = screen.getByRole('dialog', { name: 'Estado de Mateo Pérez' })
    expect(within(dialog).getByRole('radio', { name: /Bloqueada/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(dialog).queryByRole('radio', { name: /Activa/ })).not.toBeInTheDocument()
    // Sin motivo no se envía nada (RN-03).
    await user.click(within(dialog).getByRole('button', { name: 'Cambiar a Bloqueada' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Escribe el motivo del bloqueo.')
    expect(within(dialog).getByLabelText('Motivo del bloqueo (obligatorio)')).toHaveAttribute('aria-invalid', 'true')
    expect(spy).not.toHaveBeenCalled()
    await user.type(within(dialog).getByLabelText('Motivo del bloqueo (obligatorio)'), 'Vendió prendas falsas')
    expect(within(dialog).getByText('21/1000')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cambiar a Bloqueada' }))
    expect(spy).toHaveBeenCalledWith('u-2', { status: 'BLOCKED', reason: 'Vendió prendas falsas' })
    expect(await screen.findByText('Mateo Pérez ahora está Bloqueada.')).toBeInTheDocument()
    expect(within(fila('Mateo Pérez')).getByText('Bloqueada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(await screen.findByText(/Se deshizo el cambio/)).toBeInTheDocument()
    expect(within(fila('Mateo Pérez')).getByText('Activa')).toBeInTheDocument()
  })

  it('permite elegir Inactiva y cancelar sin cambiar nada', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Laura Torres')
    await user.click(screen.getByRole('button', { name: 'Cambiar estado de Laura Torres' }))
    await user.click(screen.getByRole('radio', { name: /Inactiva/ }))
    expect(screen.getByRole('button', { name: 'Cambiar a Inactiva' })).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo (opcional)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(fila('Laura Torres')).getByText('Activa')).toBeInTheDocument()
  })

  it('muestra el error si el estado cambió mientras se veía (409)', async () => {
    const user = userEvent.setup()
    sessionStorage.setItem('sr_mock', 'conflicto')
    abrir()
    await screen.findByText('Mateo Pérez')
    await user.click(screen.getByRole('button', { name: 'Cambiar estado de Mateo Pérez' }))
    await user.type(screen.getByLabelText(/Motivo del bloqueo/), 'Prueba')
    await user.click(screen.getByRole('button', { name: 'Cambiar a Bloqueada' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Los cambios de estado responden 409/)
  })

  it('muestra un error con opción de reintentar si no hay conexión', async () => {
    sessionStorage.setItem('sr_mock', 'sin-red')
    abrir()
    expect(await screen.findByText('No pudimos cargar las cuentas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('isSameAccount', () => {
  it('compara correos normalizando espacios y mayúsculas sin quitar +subdirección', () => {
    expect(isSameAccount(' StyleRadar1+Admin.QA@gmail.com ', 'styleradar1+admin.qa@gmail.com')).toBe(true)
    expect(isSameAccount('styleradar1+admin.qa@gmail.com', 'styleradar1+otro@gmail.com')).toBe(false)
    expect(isSameAccount('styleradar1+admin.qa@gmail.com', undefined)).toBe(false)
    expect(isSameAccount('', '')).toBe(false)
  })
})
