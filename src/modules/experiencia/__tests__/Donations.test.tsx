import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import DonatePage from '../pages/DonatePage'
import FoundationPage from '../pages/FoundationPage'
import { resetDonationMock } from '../services/donationService'
import { isoDay } from '../utils/dates'
import { loginAs, png, renderAt } from './helpers'

beforeEach(() => resetDonationMock())

describe('donar una prenda (RF-42, 44, 45 y 48)', () => {
  it('elige una fundación compatible, completa la logística y envía', async () => {
    loginAs('u-1', 'Valentina Rojas')
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/donar', [{ path: '/donar', element: <DonatePage /> }])
    await user.upload(screen.getByTestId('dfotos-input'), png())
    await user.type(screen.getByLabelText('¿Qué donas?'), 'Camisa de lino')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Camisas')
    await user.type(screen.getByLabelText('Talla'), 'M')
    await user.click(screen.getByRole('radio', { name: 'Muy bueno' }))
    await user.type(screen.getByLabelText('Descripción'), 'Blanca, sin manchas.')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const group = await screen.findByRole('radiogroup', { name: 'Fundaciones' }, { timeout: 3000 })
    expect(within(group).queryByText('Fundación Abrigo Bogotá')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText(/Solo las que reciben/))
    expect(within(group).getByRole('radio', { name: /Fundación Abrigo Bogotá/ })).toBeDisabled()
    expect(within(group).getByRole('radio', { name: /Banco de Ropa Kennedy/ })).toBeDisabled()
    await user.click(within(group).getByRole('radio', { name: /Vestir con Dignidad/ }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(screen.getByText('Elige cómo la entregas.')).toBeInTheDocument()
    expect(screen.getByText('Elige el día.')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'La llevo a un punto de acopio' }))
    await user.type(screen.getByLabelText('Día'), isoDay(3))
    await user.selectOptions(screen.getByLabelText('Franja horaria'), '8:00 a 12:00')
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(screen.getByText('Elige el punto de acopio.')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Punto de acopio'), 'dig-1')
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByText('Gracias por donar', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('una solicitud duplicada (409) se explica sin perder datos', async () => {
    loginAs('u-1', 'Valentina Rojas')
    sessionStorage.setItem('sr_mock', 'duplicado')
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/donar', [{ path: '/donar', element: <DonatePage /> }])
    await user.upload(screen.getByTestId('dfotos-input'), png())
    await user.type(screen.getByLabelText('¿Qué donas?'), 'Suéter gris')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Suéteres')
    await user.type(screen.getByLabelText('Talla'), 'L')
    await user.click(screen.getByRole('radio', { name: 'Bueno' }))
    await user.type(screen.getByLabelText('Descripción'), 'Lana, algo de motas.')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(await screen.findByRole('radio', { name: /Fundación Abrigo Bogotá/ }, { timeout: 3000 }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('radio', { name: 'Que la recojan' }))
    await user.type(screen.getByLabelText('Día'), isoDay(2))
    await user.selectOptions(screen.getByLabelText('Franja horaria'), '12:00 a 15:00')
    await user.type(screen.getByLabelText('Dirección de recogida'), 'Cra. 7 #54-20')
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByText(/No pudimos enviar la solicitud/, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByLabelText('Dirección de recogida')).toHaveValue('Cra. 7 #54-20')
  })
})

describe('panel de fundación (RF-46, 47 y 49)', () => {
  const open = () => renderAt('/f', [{ path: '/f', element: <FoundationPage /> }])

  it('rechazar exige justificación', async () => {
    loginAs('f-1', 'Fundación Abrigo Bogotá')
    const user = userEvent.setup({ applyAccept: false })
    open()
    const list = await screen.findByRole('list', { name: 'Solicitudes' }, { timeout: 3000 })
    await user.click(within(list).getByRole('button', { name: 'Rechazar: Suéter trenzado crudo' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Rechazar' }))
    expect(within(dialog).getByText(/mínimo 10 caracteres/)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Motivo del rechazo'), 'Este mes solo recibimos chaquetas.')
    await user.click(within(dialog).getByRole('button', { name: 'Rechazar' }))
    expect(await screen.findByText('«Suéter trenzado crudo» ahora está rechazada.')).toBeInTheDocument()
  })

  it('no deja confirmar una entrega antes de la fecha y genera comprobante cuando sí', async () => {
    loginAs('f-1', 'Fundación Abrigo Bogotá')
    const user = userEvent.setup({ applyAccept: false })
    open()
    await screen.findByRole('list', { name: 'Solicitudes' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: /En recogida/ }))
    expect(screen.getByRole('button', { name: 'Confirmar recepción: Pantalón de pinzas gris' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Confirmar recepción: Botas Chelsea negras' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar recepción' }))
    expect(await screen.findByText(/Recepción confirmada\. Comprobante SR-DON-/)).toBeInTheDocument()
  })

  it('las entregadas y rechazadas no tienen acciones', async () => {
    loginAs('f-1', 'Fundación Abrigo Bogotá')
    const user = userEvent.setup({ applyAccept: false })
    open()
    await screen.findByRole('list', { name: 'Solicitudes' }, { timeout: 3000 })
    await user.click(screen.getByRole('button', { name: /Entregada/ }))
    expect(screen.getByText('Sin acciones')).toBeInTheDocument()
    expect(screen.getByText(/Comprobante SR-DON-0006/)).toBeInTheDocument()
  })

  it('una cuenta que no representa una fundación recibe 403 controlado', async () => {
    loginAs('u-1', 'Valentina Rojas')
    open()
    expect(await screen.findByText('Tu cuenta no representa a ninguna fundación.', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
