import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import TryOnPage from '../pages/TryOnPage'
import { renderAt, simularImagenesSinCanvas } from './helpers'

simularImagenesSinCanvas()

describe('probador con IA: subir la foto', () => {
  it('la subida es lo principal y las reglas largas ya no están en la tarjeta', async () => {
    renderAt('/probador/avanzado', [{ path: '/probador/avanzado', element: <TryOnPage /> }])
    expect(await screen.findByRole('button', { name: /Sube tu foto frontal/ })).toBeInTheDocument()
    expect(screen.queryByText(/Cómo tomar o subir tu foto para el probador IA/)).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Cómo tomar tu foto' })).not.toBeInTheDocument()
  })

  it('el bombillo abre un pop-up con los pasos y se cierra con Escape', async () => {
    const user = userEvent.setup()
    renderAt('/probador/avanzado', [{ path: '/probador/avanzado', element: <TryOnPage /> }])
    await user.click(await screen.findByRole('button', { name: /¿Cómo tomar la foto\?/ }))
    const dialogo = await screen.findByRole('dialog', { name: 'Cómo tomar tu foto' })
    expect(dialogo).toHaveTextContent('Cuerpo entero, de frente')
    expect(dialogo).toHaveTextContent('Brazos separados del torso')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Cómo tomar tu foto' })).not.toBeInTheDocument()
  })
})
