import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import SecondHandPage from '../pages/SecondHandPage'
import { resetSecondHandMock } from '../services/secondHandService'
import { nombreLocalidad } from '../types/secondhand.dto'
import { loginAs, renderAt } from './helpers'

const routes = [{ path: '/segunda-mano', element: <SecondHandPage /> }]

beforeEach(() => {
  resetSecondHandMock()
  loginAs('u-1', 'Valentina Rojas')
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
})

describe('detalle de una publicación de segunda mano', () => {
  it('la localidad se muestra con su nombre, sin guiones bajos', () => {
    expect(nombreLocalidad('CIUDAD_BOLIVAR')).toBe('Ciudad Bolívar')
    expect(nombreLocalidad('RAFAEL_URIBE_URIBE')).toBe('Rafael Uribe Uribe')
    expect(nombreLocalidad('ZONA_NUEVA')).toBe('Zona Nueva')
    expect(nombreLocalidad('Chapinero')).toBe('Chapinero')
    expect(nombreLocalidad(undefined)).toBe('')
  })

  it('con el detalle abierto la página de atrás no se desplaza, y al cerrar vuelve a desplazarse', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderAt('/segunda-mano', routes)
    const res = await screen.findByRole('list', { name: 'Resultados' }, { timeout: 3000 })
    await user.click(within(within(res).getAllByRole('listitem')[0]).getAllByRole('button')[0])

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Localidad:').parentElement?.textContent).not.toContain('_')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(within(dialog).getByRole('button', { name: 'Cerrar detalle' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
  })
})
