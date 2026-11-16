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

  it('pone el error del servidor debajo de cada campo y deja los datos como estaban escritos', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.clear(screen.getByLabelText('Nombre completo'))
    await user.type(screen.getByLabelText('Nombre completo'), 'Valentina Rojas Díaz')
    await user.selectOptions(screen.getByLabelText('Talla superior'), 'L')
    await user.clear(screen.getByLabelText('Barrio'))
    await user.type(screen.getByLabelText('Barrio'), BARRIO_DEMO_400)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText(TEXTOS_PERFIL.campos)).toBeInTheDocument()
    expect(screen.getByText('Escribe un barrio de Bogotá.').closest('[role="alert"]')).toHaveAttribute('id', 'pf-barrio-err')
    expect(screen.getByText('Elige una talla de calzado de la lista.')).toHaveAttribute('id', 'pf-calzado-err')
    expect(screen.getByLabelText('Barrio')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Calzado')).toHaveAttribute('aria-describedby', 'pf-calzado-err')
    expect(screen.getByLabelText('Barrio')).toHaveFocus()
    // Nada se borró
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Valentina Rojas Díaz')
    expect(screen.getByLabelText('Talla superior')).toHaveValue('L')
    expect(screen.getByLabelText('Barrio')).toHaveValue(BARRIO_DEMO_400)
    expect(screen.queryByText('Cambios guardados.')).not.toBeInTheDocument()
  })

  it('acepta los nombres de campo del servidor (tallas.calzado, phone…)', async () => {
    vi.spyOn(usuarioService, 'updateMe').mockRejectedValue(new ApiError(400, 'x', { phone: 'Ese celular no es válido.', calzado: 'Talla fuera de rango.' }))
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Ese celular no es válido.')).toHaveAttribute('id', 'pf-celular-err')
    expect(screen.getByText('Talla fuera de rango.')).toHaveAttribute('id', 'pf-calzado-err')
    expect(screen.getByLabelText('Celular')).toHaveFocus()
  })

  it('400 sin campos: mensaje general y los datos siguen ahí', async () => {
    vi.spyOn(usuarioService, 'updateMe').mockRejectedValue(new ApiError(400, 'Texto interno del servidor'))
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: 'Hola, Valentina' })
    await user.selectOptions(screen.getByLabelText('Calzado'), '40')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText(TEXTOS_PERFIL.general)).toBeInTheDocument()
    expect(screen.queryByText('Texto interno del servidor')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Calzado')).toHaveValue('40')
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
