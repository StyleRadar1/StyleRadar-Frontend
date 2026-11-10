import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatsPage from '../pages/StatsPage'
import { loginAs, renderAt } from './helpers'

const routes = [{ path: '/fundacion/estadisticas', element: <StatsPage /> }]

beforeEach(() => { localStorage.clear(); loginAs('f-1', 'Fundación Abrigo Bogotá', 'REPRESENTANTE_FUNDACION') })

describe('estadísticas de la fundación (RF-82 a 85)', () => {
  it('muestra los indicadores, la meta sin «NaN» y los gráficos con sus números', async () => {
    renderAt('/fundacion/estadisticas', routes)
    expect(await screen.findByRole('heading', { name: 'Estadísticas de tu fundación' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText(/recibidas por Abrigo Bogotá/)).toBeInTheDocument()
    expect(screen.getByText('420')).toBeInTheDocument()
    expect(screen.getByText('Lotes de prendas nuevas y saldos')).toBeInTheDocument()

    expect(screen.getByRole('img', { name: 'Meta de prendas de septiembre 2026: 55% alcanzado' })).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()

    const tipos = screen.getByRole('list', { name: 'Prendas por tipo' })
    expect(within(tipos).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Chaquetas44%', 'Calzado26%', 'Suéteres17%', 'Pantalones13%'])

    const estados = screen.getByRole('list', { name: 'Solicitudes por estado' })
    expect(within(estados).getByText('Recibida').closest('li')).toHaveTextContent('3167%')
    expect(screen.getByRole('img', { name: /^46 solicitudes/ })).toBeInTheDocument()
  })

  it('las solicitudes por mes se pueden ver como tabla y cada mes tiene tooltip', async () => {
    const user = userEvent.setup()
    renderAt('/fundacion/estadisticas', routes)
    const mayo = await screen.findByRole('listitem', { name: 'may 2026: 19 de personas y 6 de tiendas' }, { timeout: 3000 })
    await user.hover(mayo)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Personas 19')

    await user.click(screen.getByRole('button', { name: 'Ver como tabla' }))
    const tabla = screen.getByRole('table', { name: 'Detalle de solicitudes mensuales' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(7)
    expect(within(tabla).getByRole('row', { name: /sep 2026/ })).toHaveTextContent('sep 202615722')
    await user.click(screen.getByRole('button', { name: 'Ver como gráfico' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('exporta un archivo para Excel', async () => {
    const user = userEvent.setup()
    const crear = vi.fn(() => 'blob:prueba')
    const liberar = vi.fn()
    Object.assign(URL, { createObjectURL: crear, revokeObjectURL: liberar })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderAt('/fundacion/estadisticas', routes)
    await user.click(await screen.findByRole('button', { name: 'Exportar a Excel' }, { timeout: 3000 }))
    expect(crear).toHaveBeenCalledOnce()
    const archivo = (crear.mock.calls[0] as unknown as [Blob])[0]
    expect(await archivo.text()).toContain('"Prendas recibidas en total";"420"')
    expect(click).toHaveBeenCalledOnce()
    click.mockRestore()
  })
})
