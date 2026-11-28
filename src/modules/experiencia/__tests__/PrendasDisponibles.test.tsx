import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TryOnPage from '../pages/TryOnPage'
import { FitAnalysisPanel } from '../components/FitAnalysis2D'
import { renderAt, simularImagenesSinCanvas } from './helpers'

simularImagenesSinCanvas()

const abrir = () => renderAt('/probador/avanzado', [{ path: '/probador/avanzado', element: <TryOnPage /> }])

describe('probador con IA: ropa disponible en pop-up', () => {
  it('la ropa no se lista en la página: se abre en un pop-up y elegir una prenda lo cierra', async () => {
    const user = userEvent.setup()
    abrir()
    expect(screen.queryByRole('list', { name: 'Prendas para probar' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /Elegir ropa disponible/ }))
    const dialogo = await screen.findByRole('dialog', { name: 'Ropa disponible' })
    const prendas = await within(dialogo).findByRole('list', { name: 'Prendas para probar' })
    await user.click(within(prendas).getByRole('button', { name: /Blazer oversize/ }))
    expect(screen.queryByRole('dialog', { name: 'Ropa disponible' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cambiar prenda' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Tallas disponibles' })).toBeInTheDocument()
  })

  it('el pop-up tiene la pestaña «Mis playlists» y se cierra con Escape', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: /Usar una de mis playlists/ }))
    const dialogo = await screen.findByRole('dialog', { name: 'Ropa disponible' })
    expect(within(dialogo).getByRole('tab', { name: 'Mis playlists', selected: true })).toBeInTheDocument()
    expect(within(dialogo).getByRole('list', { name: 'Mis playlists' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Ropa disponible' })).not.toBeInTheDocument()
  })
})

describe('panel de ajuste: botón «Probar con foto IA»', () => {
  it('lleva al probador con IA con la prenda y su talla, no a la misma página', () => {
    render(
      <MemoryRouter>
        <FitAnalysisPanel wornList={[{ slot: 'superior', layer: 'base', talla: 'M', veredicto: 'Ajuste perfecto', item: { id: 'p1' } }]} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Probar con foto IA/ })).toHaveAttribute('href', '/probador/avanzado?prenda=p1&talla=M')
  })
})
