import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/modules/core/api/apiClient'
import ProfilePage from '../pages/ProfilePage'
import { BARRIO_DEMO_400, usuarioService } from '../services/usuarioService'
import { TEXTOS_PERFIL } from '../utils/erroresPerfil'
import { reiniciarDatos, renderConSesion, sesionComo } from './helpers'

const abrir = () => renderConSesion('/perfil', [{ path: '/perfil', element: <ProfilePage /> }])

describe('Mi cuenta · 400 al guardar (plan de errores · Cristian)', () => {
  beforeEach(() => { reiniciarDatos(); sesionComo('usuario@styleradar.co') })
  afterEach(() => { vi.restoreAllMocks() })

  const talla = (tipo: string, t: string) => screen.getByRole('button', { name: `${tipo} ${t}` })

  it('pone el error del servidor debajo de cada campo y deja los datos como estaban escritos', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.clear(screen.getByLabelText('Nombre completo'))
    await user.type(screen.getByLabelText('Nombre completo'), 'Valentina Rojas Díaz')
    await user.click(talla('Talla superior', 'L'))
    await user.clear(screen.getByLabelText('Barrio'))
    await user.type(screen.getByLabelText('Barrio'), BARRIO_DEMO_400)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText(TEXTOS_PERFIL.campos)).toBeInTheDocument()
    expect(screen.getByText('Escribe un barrio de Bogotá.').closest('[role="alert"]')).toHaveAttribute('id', 'pf-barrio-err')
    // SR-RF-04 EX-02: errors.validSizes va al grupo de tallas.
    expect(screen.getByText('Una o más tallas no corresponden al tipo de prenda.')).toHaveAttribute('id', 'pf-tallas-err')
    expect(screen.getByLabelText('Barrio')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Barrio')).toHaveFocus()
    // Nada se borró
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Valentina Rojas Díaz')
    expect(talla('Talla superior', 'L')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Barrio')).toHaveValue(BARRIO_DEMO_400)
    expect(screen.queryByText('Cambios guardados.')).not.toBeInTheDocument()
  })

  it('acepta los nombres de campo del servidor (phone, sizesByGarmentType…)', async () => {
    vi.spyOn(usuarioService, 'updateMe').mockRejectedValue(new ApiError(400, 'x', { phone: 'El formato del teléfono es inválido', sizesByGarmentType: 'Las tallas por tipo de prenda son obligatorias' }))
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('El formato del teléfono es inválido')).toHaveAttribute('id', 'pf-celular-err')
    expect(screen.getByText('Las tallas por tipo de prenda son obligatorias')).toHaveAttribute('id', 'pf-tallas-err')
    expect(screen.getByLabelText('Teléfono')).toHaveFocus()
  })

  it('400 sin campos: mensaje general y los datos siguen ahí', async () => {
    vi.spyOn(usuarioService, 'updateMe').mockRejectedValue(new ApiError(400, 'Texto interno del servidor'))
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.click(talla('Calzado', '40'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText(TEXTOS_PERFIL.general)).toBeInTheDocument()
    expect(screen.queryByText('Texto interno del servidor')).not.toBeInTheDocument()
    expect(talla('Calzado', '40')).toHaveAttribute('aria-pressed', 'true')
  })

  it('al corregir y guardar se quitan los errores', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.clear(screen.getByLabelText('Barrio'))
    await user.type(screen.getByLabelText('Barrio'), BARRIO_DEMO_400)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByText(TEXTOS_PERFIL.campos)
    await user.clear(screen.getByLabelText('Barrio'))
    await user.type(screen.getByLabelText('Barrio'), 'Chapinero')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(screen.queryByText('Escribe un barrio de Bogotá.')).not.toBeInTheDocument()
  })
})
