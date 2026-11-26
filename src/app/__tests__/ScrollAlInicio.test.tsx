import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollAlInicio } from '../ScrollAlInicio'

const renderRutas = (inicio = '/') => render(
  <MemoryRouter initialEntries={[inicio]}>
    <ScrollAlInicio />
    <Routes>
      <Route path="/" element={<><Link to="/legal/terminos">Términos</Link><Link to="/#planes">Planes</Link></>} />
      <Route path="/legal/terminos" element={<p>Términos y condiciones</p>} />
    </Routes>
  </MemoryRouter>,
)

describe('subir al inicio al cambiar de página', () => {
  const scrollTo = vi.fn()
  beforeEach(() => { scrollTo.mockClear(); window.scrollTo = scrollTo as unknown as typeof window.scrollTo })

  it('al abrir un enlace del pie la página nueva empieza arriba', async () => {
    renderRutas()
    scrollTo.mockClear()
    await userEvent.click(screen.getByRole('link', { name: 'Términos' }))
    expect(await screen.findByText('Términos y condiciones')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('respeta los enlaces a una sección de la página', async () => {
    renderRutas()
    scrollTo.mockClear()
    await userEvent.click(screen.getByRole('link', { name: 'Planes' }))
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
