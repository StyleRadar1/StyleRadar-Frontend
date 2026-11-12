import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import AdminFoundationDetailPage from '../pages/AdminFoundationDetailPage'
import AdminFoundationsPage from '../pages/AdminFoundationsPage'
import AdminPlaylistsPage from '../pages/AdminPlaylistsPage'
import AdminStoreDetailPage from '../pages/AdminStoreDetailPage'
import AdminStoresPage from '../pages/AdminStoresPage'
import { resetAdminMock } from '../services/adminService'
import { erroresFundacion } from '../utils/validation'

const renderAt = (path: string, routes: [string, ReactNode][]) => render(
  <MemoryRouter initialEntries={[path]}><Routes>{routes.map(([p, el]) => <Route key={p} path={p} element={el} />)}</Routes></MemoryRouter>,
)
const T = { timeout: 3000 }

beforeEach(() => { resetAdminMock(); sessionStorage.clear(); localStorage.setItem('sr_user', JSON.stringify({ id: 'a-1', name: 'Mariana Bernal', role: 'ADMIN_STYLERADAR' })) })

describe('Admin › Tiendas', () => {
  it('lista las tiendas, busca, filtra por verificación y ordena', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas', [['/admin/tiendas', <AdminStoresPage key="p" />]])
    const tabla = await screen.findByRole('table', {}, T)
    expect(within(tabla).getAllByRole('row')).toHaveLength(8)
    await user.selectOptions(screen.getByRole('combobox', { name: /Verificación/ }), 'Pendiente')
    expect(within(tabla).getAllByRole('row')).toHaveLength(2)
    expect(within(tabla).getByText('Ropero 57')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: /Verificación/ }), '')
    await user.type(screen.getByPlaceholderText('Buscar tienda, NIT o barrio'), 'chapinero')
    expect(within(tabla).getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual(['LSLuna StoreSport', 'CTCasa TweedSastrería'])
    expect(screen.getAllByRole('link', { name: 'Editar Luna Store' })[0]).toHaveAttribute('href', '/admin/tiendas/luna')
  })

  it('aprueba una tienda pendiente con confirmación', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas/ropero', [['/admin/tiendas/:id', <AdminStoreDetailPage key="p" />]])
    expect(await screen.findByRole('heading', { level: 1, name: 'Ropero 57' }, T)).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Documentos' })).getByText('Cuenta bancaria').closest('li')).toHaveTextContent('Falta')
    await user.click(screen.getByRole('button', { name: /Aprobar tienda/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprobar tienda' }))
    expect(await screen.findByText(/Ropero 57 quedó verificada/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retirar verificación' })).toBeInTheDocument()
  })

  it('para rechazar exige un motivo y lo muestra después', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas/ropero', [['/admin/tiendas/:id', <AdminStoreDetailPage key="p" />]])
    await user.click(await screen.findByRole('button', { name: 'Rechazar' }, T))
    const dlg = screen.getByRole('dialog')
    await user.type(within(dlg).getByRole('textbox'), 'corto')
    await user.click(within(dlg).getByRole('button', { name: 'Rechazar' }))
    expect(within(dlg).getByRole('alert')).toHaveTextContent('mínimo 10 caracteres')
    await user.type(within(dlg).getByRole('textbox'), ': falta la cámara de comercio')
    await user.click(within(dlg).getByRole('button', { name: 'Rechazar' }))
    expect(await screen.findByText(/Motivo: corto: falta la cámara de comercio/)).toBeInTheDocument()
  })

  it('extiende el periodo gratuito', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas/kicks', [['/admin/tiendas/:id', <AdminStoreDetailPage key="p" />]])
    await user.click(await screen.findByRole('button', { name: 'Extender periodo gratuito 15 días' }, T))
    expect(await screen.findByText('30 sep 2026 + 15 días')).toBeInTheDocument()
  })

  it('impide aprobar sin RUT (422) y explica tienda ya revisada (409)', async () => {
    const user = userEvent.setup()
    const first = renderAt('/admin/tiendas/tweed', [['/admin/tiendas/:id', <AdminStoreDetailPage key="p" />]])
    await user.click(await screen.findByRole('button', { name: /Aprobar tienda/ }, T))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprobar tienda' }))
    expect(await screen.findByText('Falta el RUT para aprobar')).toBeInTheDocument()
    first.unmount()

    renderAt('/admin/tiendas/ropero', [['/admin/tiendas/:id', <AdminStoreDetailPage key="p" />]])
    await user.click(await screen.findByRole('button', { name: /Aprobar tienda/ }, T))
    sessionStorage.setItem('sr_mock', 'conflicto')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Aprobar tienda' }))
    expect(await screen.findByText('Esta tienda ya fue revisada')).toBeInTheDocument()
  })
})

describe('Admin › Fundaciones', () => {
  it('registra una fundación nueva validando duplicados (409) y certificado (400)', async () => {
    const user = userEvent.setup()
    renderAt('/admin/fundaciones', [['/admin/fundaciones', <AdminFoundationsPage key="p" />]])
    await user.click(await screen.findByRole('button', { name: '+ Nueva fundación' }, T))
    const dlg = screen.getByRole('dialog', { name: 'Registrar fundación aliada' })
    await user.click(within(dlg).getByRole('button', { name: 'Registrar fundación' }))
    expect(within(dlg).getByText('Escribe el nombre de la fundación.')).toBeInTheDocument()
    expect(within(dlg).getByText('Adjunta el certificado de existencia.')).toBeInTheDocument()

    const campos: [string, string][] = [['Nombre', 'Fundación Abrigo Bogotá'], ['NIT', '900.215.884-1'], ['Correo', 'hola@ropaconamor.org'], ['Teléfono', '+57 601 555 0400'], ['Barrio', 'Usme'], ['Dirección', 'Cl. 90 Sur #1-20'], ['Representante legal', 'Lucía Herrera']]
    for (const [label, v] of campos) await user.type(within(dlg).getByLabelText(label), v)
    await user.click(within(dlg).getByRole('button', { name: 'Registrar fundación' }))
    expect(within(dlg).getByText('Ya hay una fundación registrada con ese nombre.')).toBeInTheDocument()
    expect(within(dlg).getByText('Ya hay una fundación registrada con ese NIT.')).toBeInTheDocument()
    expect(within(dlg).getByText('Esta persona ya figura como representante legal.')).toBeInTheDocument()

    await user.clear(within(dlg).getByLabelText('Nombre'))
    await user.type(within(dlg).getByLabelText('Nombre'), 'Ropa con Amor')
    await user.clear(within(dlg).getByLabelText('NIT'))
    await user.type(within(dlg).getByLabelText('NIT'), '901.555.000-3')
    await user.clear(within(dlg).getByLabelText('Representante legal'))
    await user.type(within(dlg).getByLabelText('Representante legal'), 'Elena Mora')
    await user.upload(
      within(dlg).getByLabelText(/Certificado de existencia/),
      new File([new Uint8Array(64)], 'certificado.pdf', { type: 'application/pdf' }),
    )
    await user.click(within(dlg).getByRole('button', { name: 'Registrar fundación' }))
    expect(await screen.findByText(/Ropa con Amor quedó registrada/, {}, T)).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Ropa con Amor')).toBeInTheDocument()
  })

  it('edita, desactiva una fundación y controla conflicto 409 si ya está inactiva', async () => {
    const user = userEvent.setup()
    renderAt('/admin/fundaciones/suba', [['/admin/fundaciones/:id', <AdminFoundationDetailPage key="p" />]])
    const tel = await screen.findByLabelText('Teléfono', {}, T)
    await user.clear(tel); await user.type(tel, '+57 601 555 9999')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Fundación actualizada.', {}, T)).toBeInTheDocument()

    sessionStorage.setItem('sr_mock', 'conflicto')
    await user.click(screen.getByRole('button', { name: 'Desactivar fundación' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByText('Esta fundación ya está inactiva')).toBeInTheDocument()

    sessionStorage.clear()
    await user.click(screen.getByRole('button', { name: 'Desactivar fundación' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByRole('button', { name: 'Reactivar fundación' }, T)).toBeInTheDocument()
  })

  it('valida el NIT, el correo y el teléfono', () => {
    const base = { nombre: 'Fundación Uno', nit: '900.1-1', correo: 'malo', telefono: '12', barrio: 'X', direccion: 'Y', representante: 'Z' }
    expect(erroresFundacion(base)).toMatchObject({ nit: expect.stringContaining('dígito de verificación'), correo: expect.any(String), telefono: expect.any(String) })
  })
})

describe('Admin › Playlists destacadas', () => {
  it('ordena por interacción y permite destacar hasta tres', async () => {
    const user = userEvent.setup()
    renderAt('/admin/playlists', [['/admin/playlists', <AdminPlaylistsPage key="p" />]])
    const tabla = await screen.findByRole('table', {}, T)
    expect(within(tabla).getAllByRole('row')[1]).toHaveTextContent('Oficina con Estilo')
    expect(screen.getByText(/1 de 3 en uso/)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Destacar: Días en la Ciudad' })[0])
    await user.click(screen.getAllByRole('button', { name: 'Destacar: Street Style Bogotá' })[0])
    expect(await screen.findByText(/3 de 3 en uso/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Destacar: Vibra Indie Rock' })[0])
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya hay 3 destacadas. Quita una primero')

    await user.click(screen.getAllByRole('button', { name: 'Quitar de destacadas: Oficina con Estilo' })[0])
    expect(await screen.findByText(/2 de 3 en uso/)).toBeInTheDocument()
  })
})
