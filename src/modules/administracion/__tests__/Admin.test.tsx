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

beforeEach(() => { resetAdminMock(); sessionStorage.clear(); localStorage.setItem('sr_user', JSON.stringify({ id: 'a-1', name: 'Mariana Bernal', role: 'STYLERADAR_ADMIN' })) })

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

  it('asigna administradores del almacén y rechaza cuentas sin rol Tienda (422)', async () => {
    const user = userEvent.setup()
    renderAt('/admin/tiendas/luna', [['/admin/tiendas/:id', <AdminStoreDetailPage key="p" />]])
    const card = await screen.findByRole('region', { name: 'Administradores del almacén' }, T)
    expect(await within(card).findByText('Cuenta t-1', {}, T)).toBeInTheDocument()
    await user.type(within(card).getByLabelText('ID de la cuenta de Tienda'), 'u-2')
    await user.click(within(card).getByRole('button', { name: 'Asignar' }))
    expect(await within(card).findByText(/Esa cuenta no tiene rol Tienda/)).toBeInTheDocument()
    await user.clear(within(card).getByLabelText('ID de la cuenta de Tienda'))
    await user.type(within(card).getByLabelText('ID de la cuenta de Tienda'), 't-9')
    await user.click(within(card).getByRole('button', { name: 'Asignar' }))
    expect(await within(card).findByText('Cuenta t-9')).toBeInTheDocument()
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
  it('registra una fundación nueva con ubicación, categorías, representante y certificado (SR-RF-63)', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/admin/fundaciones', [['/admin/fundaciones', <AdminFoundationsPage key="p" />]])
    await user.click(await screen.findByRole('button', { name: '+ Nueva fundación' }, T))
    const dlg = screen.getByRole('dialog', { name: 'Registrar fundación aliada' })
    await user.click(within(dlg).getByRole('button', { name: 'Registrar fundación' }))
    expect(within(dlg).getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(within(dlg).getByText('Debe aceptar al menos una categoría de prenda')).toBeInTheDocument()
    expect(within(dlg).getByText('El ID del usuario representante es obligatorio')).toBeInTheDocument()
    expect(within(dlg).getByText('El certificado de personería jurídica en PDF es obligatorio para registrar la fundación aliada')).toBeInTheDocument()

    const campos: [string, string][] = [['Nombre', 'Fundación Abrigo Bogotá'], ['NIT', '900215884-1'], ['Correo', 'hola@ropaconamor.org'], ['Barrio', 'Usme'], ['Dirección', 'Cl. 90 Sur #1-20'], ['Latitud', '4.48'], ['Longitud', '-74.12']]
    for (const [label, v] of campos) await user.type(within(dlg).getByLabelText(label), v)
    await user.click(within(dlg).getByLabelText('Calzado'))
    await user.type(within(dlg).getByLabelText('Representante legal'), 'Mateo')
    await user.click(await within(dlg).findByRole('button', { name: /Elegir Mateo Pérez/ }, T))
    await user.upload(within(dlg).getByLabelText(/Certificado de existencia/), new File([new Uint8Array(64)], 'foto.jpg', { type: 'image/jpeg' }))
    expect(within(dlg).getByText('Sube el certificado en PDF de máximo 6 MB.')).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: 'Registrar fundación' }))
    expect(within(dlg).getByText('Ya existe una fundación aliada registrada con el nombre: Fundación Abrigo Bogotá')).toBeInTheDocument()
    expect(within(dlg).getByText('Ya existe una fundación aliada registrada con el NIT: 900215884-1')).toBeInTheDocument()
    expect(within(dlg).getByText('El usuario con ID u-2 ya se encuentra asignado como representante de otra fundación aliada')).toBeInTheDocument()

    await user.clear(within(dlg).getByLabelText('Nombre'))
    await user.type(within(dlg).getByLabelText('Nombre'), 'Ropa con Amor')
    await user.clear(within(dlg).getByLabelText('NIT'))
    await user.type(within(dlg).getByLabelText('NIT'), '901555000-3')
    await user.click(within(dlg).getByRole('button', { name: 'Cambiar representante' }))
    await user.type(within(dlg).getByLabelText('Representante legal'), 'Daniela')
    await user.click(await within(dlg).findByRole('button', { name: /Elegir Daniela Ortiz/ }, T))
    await user.upload(within(dlg).getByLabelText(/Certificado de existencia/), new File([new Uint8Array(64)], 'certificado.pdf', { type: 'application/pdf' }))
    expect(await within(dlg).findByText('Archivo: certificado.pdf', {}, T)).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: 'Registrar fundación' }))
    expect(await screen.findByText(/Ropa con Amor quedó registrada/, {}, T)).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Ropa con Amor')).toBeInTheDocument()
  }, 15000)

  it('edita, desactiva con motivo, controla el 409 y reactiva (SR-RF-64 y 65)', async () => {
    const user = userEvent.setup()
    renderAt('/admin/fundaciones/suba', [['/admin/fundaciones/:id', <AdminFoundationDetailPage key="p" />]])
    expect(await screen.findByText('Camila Suárez', {}, T)).toBeInTheDocument()
    const tel = screen.getByLabelText('Teléfono (opcional)')
    await user.clear(tel); await user.type(tel, '+57 601 555 9999')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Fundación actualizada.', {}, T)).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono (opcional)')).toHaveValue('+57 601 555 9999')

    sessionStorage.setItem('sr_mock', 'conflicto')
    await user.click(screen.getByRole('button', { name: 'Desactivar fundación' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByText('Esta fundación ya está inactiva')).toBeInTheDocument()

    sessionStorage.clear()
    await user.click(screen.getByRole('button', { name: 'Desactivar fundación' }))
    const dlg = screen.getByRole('dialog', { name: '¿Desactivar esta fundación?' })
    await user.type(within(dlg).getByLabelText('Motivo (opcional)'), 'Cerró su sede.')
    await user.click(within(dlg).getByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByText('Fundación desactivada.', {}, T)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reactivar fundación' }))
    await user.click(within(screen.getByRole('dialog', { name: '¿Reactivar esta fundación?' })).getByRole('button', { name: 'Reactivar' }))
    expect(await screen.findByText('Fundación reactivada.', {}, T)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desactivar fundación' })).toBeInTheDocument()
  }, 15000)

  it('valida NIT sin puntos, ubicación, categorías, representante y largos (SR-RF-63)', () => {
    const base = {
      name: 'Fundación Uno', nit: '900.215.884-1', email: 'malo', phone: '1'.repeat(31), neighborhood: 'X', address: 'Y', description: '',
      latitude: '95', longitude: 'abc', acceptedCategories: [], representativeId: '', representativeName: '', legalEntityCertificateUrl: '', certificateName: '',
      supportedCauses: '', openingHours: '', donationPolicies: '',
    }
    expect(erroresFundacion(base)).toEqual({
      nit: 'El NIT debe tener un formato válido (ej. 900215884-1)',
      email: 'El email no tiene un formato válido',
      phone: 'El teléfono no puede superar 30 caracteres',
      latitude: 'La latitud debe estar entre -90 y 90',
      longitude: 'La longitud debe estar entre -180 y 180',
      acceptedCategories: 'Debe aceptar al menos una categoría de prenda',
      representativeId: 'El ID del usuario representante es obligatorio',
    })
    const ok = { ...base, nit: '900215884', email: 'a@b.co', phone: '', latitude: '4.6', longitude: '-74,1', acceptedCategories: ['TOP' as const], representativeId: '7' }
    expect(erroresFundacion(ok)).toEqual({})
    expect(erroresFundacion({ ...ok, nit: '1234567' })).toHaveProperty('nit')
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
