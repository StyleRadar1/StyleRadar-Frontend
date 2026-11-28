import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProbadorSecciones } from '@/modules/experiencia/components/ProbadorSecciones'

const pintar = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="*" element={<ProbadorSecciones />} />
      </Routes>
    </MemoryRouter>,
  )

describe('probador: botones de sección', () => {
  it('hay un botón por sección y ninguno es «Volver»', () => {
    pintar('/probador')
    expect(screen.getByRole('link', { name: 'Arma tu look' })).toHaveAttribute('href', '/probador')
    expect(screen.getByRole('link', { name: 'Probar con tu foto IA' })).toHaveAttribute('href', '/probador/avanzado')
    expect(screen.queryByText(/volver/i)).toBeNull()
  })

  it('marca la sección actual y cambia al navegar', async () => {
    const user = userEvent.setup()
    pintar('/probador')
    expect(screen.getByRole('link', { name: 'Arma tu look' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('link', { name: 'Probar con tu foto IA' }))
    expect(screen.getByRole('link', { name: 'Probar con tu foto IA' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Arma tu look' })).not.toHaveAttribute('aria-current')
  })
})
