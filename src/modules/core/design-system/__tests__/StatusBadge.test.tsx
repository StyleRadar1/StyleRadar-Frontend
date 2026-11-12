import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge (WCAG 1.4.1 no solo color)', () => {
  it('renderiza disponible con icono y texto explícito', () => {
    const { container } = render(<StatusBadge status="disponible" />)
    expect(screen.getByText('Disponible')).toBeInTheDocument()
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('renderiza pocas_unidades con icono de alerta y texto', () => {
    const { container } = render(<StatusBadge status="pocas_unidades" />)
    expect(screen.getByText('Pocas unidades')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza agotado con icono y texto descriptivo', () => {
    const { container } = render(<StatusBadge status="agotado" />)
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('permite etiqueta personalizada conservando el icono', () => {
    const { container } = render(<StatusBadge status="disponible" label="En stock (3 u.)" />)
    expect(screen.getByText('En stock (3 u.)')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
