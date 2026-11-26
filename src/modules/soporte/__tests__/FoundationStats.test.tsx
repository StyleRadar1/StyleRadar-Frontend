import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StatsPage from '../pages/StatsPage'
import { loginAs, renderAt } from './helpers'

const routes = [{ path: '/fundacion/estadisticas', element: <StatsPage /> }]

beforeEach(() => { localStorage.clear(); loginAs('f-1', 'Fundación Abrigo Bogotá', 'FOUNDATION_REPRESENTATIVE') })

describe('estadísticas de la fundación (RF-82)', () => {
  afterEach(() => window.history.pushState({}, '', '/'))

  it('muestra el total de prendas recibidas con su número y sin «NaN»', async () => {
    renderAt('/fundacion/estadisticas', routes)
    expect(await screen.findByRole('heading', { name: 'Estadísticas de tu fundación' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Prendas recibidas históricamente')).toBeInTheDocument()
    expect(await screen.findByText('128', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('sin prendas confirmadas lo dice en vez de inventar cifras', async () => {
    window.history.pushState({}, '', '/?mockEstado=VACIO')
    renderAt('/fundacion/estadisticas', routes)
    expect(await screen.findByText('Aún no registras prendas recibidas confirmadas', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('si el servicio falla avisa y deja reintentar', async () => {
    window.history.pushState({}, '', '/?mockEstado=ERROR')
    renderAt('/fundacion/estadisticas', routes)
    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })
})
