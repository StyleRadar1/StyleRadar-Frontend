import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import AdminUsersPage from '../pages/AdminUsersPage'
import { reiniciarDatos, renderConSesion, sesionComo } from './helpers'

const routes = [{ path: '/admin/usuarios', element: <AdminUsersPage /> }]
const abrir = () => renderConSesion('/admin/usuarios', routes)
const fila = (nombre: string) => screen.getByText(nombre).closest('tr') as HTMLElement

describe('AdminUsersPage (RF-66)', () => {
  beforeEach(() => { reiniciarDatos(); sesionComo('admin@styleradar.co') })

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
    expect(screen.getByText('Andrés Mora')).toBeInTheDocument()
    expect(screen.queryByText('Valentina Rojas')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('Buscar'))
    await user.type(screen.getByLabelText('Buscar'), 'luna@')
    expect(screen.getByText('Luna Store')).toBeInTheDocument()
    expect(screen.getByText('1 cuenta')).toBeInTheDocument()
  })

  it('filtra por estado y por rol', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Valentina Rojas')
    await user.click(screen.getByRole('button', { name: /Bloqueada \(1\)/ }))
    expect(screen.getByText('Julián Rincón')).toBeInTheDocument()
    expect(screen.getByText('1 cuenta')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Todas/ }))
    await user.selectOptions(screen.getByLabelText('Rol'), 'ADMIN_ALMACEN')
    expect(screen.getByText('Luna Store')).toBeInTheDocument()
    expect(screen.getByText('1 cuenta')).toBeInTheDocument()
  })

  it('ofrece quitar los filtros cuando nada coincide', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Valentina Rojas')
    await user.type(screen.getByLabelText('Buscar'), 'nadie-se-llama-asi')
    expect(screen.getByText('Ninguna cuenta coincide')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    expect(screen.getByText('14 cuentas')).toBeInTheDocument()
  })

  it('cambia una cuenta a Bloqueada con confirmación y permite deshacer', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Mateo Pérez')
    await user.click(screen.getByRole('button', { name: 'Cambiar estado de Mateo Pérez' }))
    const dialog = screen.getByRole('dialog', { name: 'Estado de Mateo Pérez' })
    expect(within(dialog).getByRole('radio', { name: /Bloqueada/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(dialog).queryByRole('radio', { name: /Activa/ })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cambiar a Bloqueada' }))
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
