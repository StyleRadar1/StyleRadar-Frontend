import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MapCard from '../components/MapCard'
import { ALL_PINS } from '../mocks/mapData'

const renderCard = (id: string) => {
  const pin = ALL_PINS.find((p) => p.id === id)!
  return render(
    <MemoryRouter>
      <MapCard pin={pin} onClose={vi.fn()} />
    </MemoryRouter>,
  )
}

describe('MapCard', () => {
  it('tienda: muestra la foto y una vista previa de sus productos', () => {
    renderCard('luna')
    expect(screen.getByAltText('Luna Store')).toBeInTheDocument()
    expect(screen.getByText('Lo que ofrece')).toBeInTheDocument()
    expect(screen.getByText('Hoodie azul noche')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver tienda/ })).toBeInTheDocument()
  })

  it('fundación: muestra foto y descripción, sin productos', () => {
    renderCard('abrigo')
    expect(screen.getByAltText('Fundación Abrigo Bogotá')).toBeInTheDocument()
    expect(screen.getByText(/ropa de abrigo/i)).toBeInTheDocument()
    expect(screen.queryByText('Lo que ofrece')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Conocer la fundación/ })).toBeInTheDocument()
  })
})
