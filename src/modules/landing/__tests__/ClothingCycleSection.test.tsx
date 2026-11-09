import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClothingCycleSection } from '../components/ClothingCycleSection'

describe('ClothingCycleSection (P6)', () => {
  it('renderiza el ciclo con la pestaña inicial de Tiendas locales activa', () => {
    render(
      <MemoryRouter>
        <ClothingCycleSection />
      </MemoryRouter>,
    )

    expect(screen.getByText('El ecosistema de StyleRadar:')).toBeInTheDocument()
    expect(screen.getByText('Comprar · Tiendas locales')).toBeInTheDocument()
    expect(screen.getByText('Moda independiente en los barrios de Bogotá')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrar mi tienda/i })).toBeInTheDocument()
  })

  it('cambia a la pestaña de Segunda vida al hacer clic', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <ClothingCycleSection onSelectPhase={onSelect} />
      </MemoryRouter>,
    )

    const tabSegunda = screen.getByRole('tab', { name: /Segunda vida/i })
    fireEvent.click(tabSegunda)

    expect(onSelect).toHaveBeenCalledWith('segunda')
    expect(screen.getByText('Circular · Segunda vida')).toBeInTheDocument()
    expect(screen.getByText('Tu ropa merece seguir viviendo nuevas historias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Publicar prenda/i })).toBeInTheDocument()
  })

  it('cambia a la pestaña de Fundaciones al hacer clic', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <ClothingCycleSection onSelectPhase={onSelect} />
      </MemoryRouter>,
    )

    const tabFundaciones = screen.getByRole('tab', { name: /Donar con propósito/i })
    fireEvent.click(tabFundaciones)

    expect(onSelect).toHaveBeenCalledWith('fundaciones')
    expect(screen.getByText('Donar · Impacto social')).toBeInTheDocument()
    expect(screen.getByText('Impacto social directo sin intermediarios')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrar fundación/i })).toBeInTheDocument()
  })
})

