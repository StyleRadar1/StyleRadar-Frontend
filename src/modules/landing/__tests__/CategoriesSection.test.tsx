import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CategoriesSection } from '../components/CategoriesSection'

describe('CategoriesSection (P3)', () => {
  it('renderiza la categoría Streetwear activa por defecto', () => {
    render(
      <MemoryRouter>
        <CategoriesSection />
      </MemoryRouter>,
    )

    expect(screen.getByText('Descubre tu identidad:')).toBeInTheDocument()
    expect(screen.getByText('Estilo 01 · Tendencia urbana')).toBeInTheDocument()
    expect(screen.getAllByText('Streetwear').length).toBeGreaterThan(0)
    expect(screen.getByText('Actitud de calle y autenticidad bogotana')).toBeInTheDocument()
    expect(screen.getByText(/Ver prendas Streetwear en el catálogo/i)).toBeInTheDocument()
  })

  it('cambia a la categoría Elegante al pulsar su miniatura', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <CategoriesSection onSelectCategory={onSelect} />
      </MemoryRouter>,
    )

    const thumbElegante = screen.getByRole('tab', { name: /Elegante/i })
    fireEvent.click(thumbElegante)

    expect(onSelect).toHaveBeenCalled()
    expect(screen.getByText('Estilo 02 · Sastrería & Formal')).toBeInTheDocument()
    expect(screen.getByText('Cortes estructurados y sobriedad contemporánea')).toBeInTheDocument()
    expect(screen.getByText(/Ver prendas Elegante en el catálogo/i)).toBeInTheDocument()
  })

  it('permite cambiar a Vintage y muestra sus tags', () => {
    render(
      <MemoryRouter>
        <CategoriesSection />
      </MemoryRouter>,
    )

    const thumbVintage = screen.getByRole('tab', { name: /Vintage/i })
    fireEvent.click(thumbVintage)

    expect(screen.getByText('Estilo 04 · Retro & Segunda mano')).toBeInTheDocument()
    expect(screen.getByText('Piezas con historia, carácter y nostalgia')).toBeInTheDocument()
    expect(screen.getByText('Chaquetas de cuero')).toBeInTheDocument()
  })
})

