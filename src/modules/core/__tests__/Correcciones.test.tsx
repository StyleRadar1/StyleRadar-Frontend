import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { ApiError } from '../api/apiClient'
import { avisarSinConexion } from '../api/conexion'
import { failIfScenario } from '../api/mockScenario'
import { NotFound } from '../components/NotFound'
import { SinConexion } from '../components/SinConexion'

describe('correcciones de la revisión de errores', () => {
  afterEach(() => { sessionStorage.clear(); window.history.replaceState({}, '', '/') })

  it('el 404 usa la escena grande', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'No encontramos esta página' }).closest('section'))
      .toHaveAttribute('data-tamano', 'grande')
  })

  it('sin conexión: una sola pantalla completa que se cierra al volver internet', () => {
    render(<SinConexion />)
    expect(screen.queryByTestId('sin-conexion')).not.toBeInTheDocument()
    act(() => avisarSinConexion())
    expect(screen.getByRole('alertdialog', { name: 'Sin conexión' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'No hay conexión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveFocus()
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(screen.queryByTestId('sin-conexion')).not.toBeInTheDocument()
  })

  it('?mock=sin-red abre la misma pantalla en cualquier servicio y ofrece quitar la simulación', () => {
    window.history.replaceState({}, '', '/tienda/inventario?mock=sin-red')
    render(<SinConexion />)
    act(() => { expect(() => failIfScenario()).toThrow(ApiError) })
    expect(screen.getByTestId('sin-conexion')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar simulación' })).toBeInTheDocument()
  })
})
