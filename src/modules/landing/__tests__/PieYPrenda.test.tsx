import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingFooter } from '@/components/layout/LandingFooter'
import { GARMENT_SRC, GARMENT_SRC_MORADO } from '@/components/landing/CursorHanger'

// las dos prendas tienen que existir en public/ (se sirven tal cual desde /img/...)
const imagenes = Object.keys(import.meta.glob('../../../../public/img/percha-sueter*.png'))

describe('pie de página de la landing', () => {
  const pintar = () => render(<MemoryRouter><LandingFooter /></MemoryRouter>)

  it('el bloque legal va en una franja de color sólido aparte del llamado a la acción', () => {
    const { container } = pintar()
    const franja = container.querySelector('.sr-pie-legal') as HTMLElement
    expect(franja).not.toBeNull()

    // dentro de la franja: derechos, Marco Legal, ayuda, aliados y datos del proveedor
    expect(within(franja).getByText(/© 2026 StyleRadar/)).toBeInTheDocument()
    expect(within(franja).getByText('Marco Legal')).toBeInTheDocument()
    expect(within(franja).getByRole('link', { name: /Radicar PQRS Oficial/ })).toBeInTheDocument()
    expect(within(franja).getByText('Información del Proveedor')).toBeInTheDocument()
    expect(within(franja).getByRole('button', { name: /Volver arriba/ })).toBeInTheDocument()

    // fuera de la franja: el título y los botones del llamado a la acción
    expect(franja.contains(screen.getByRole('heading', { name: /Antes de salir a buscar/ }))).toBe(false)
    expect(franja.contains(screen.getAllByRole('link', { name: /Entrar a StyleRadar/ })[0])).toBe(false)
  })

  it('la página sigue teniendo un solo pie de página con su título', () => {
    pintar()
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
  })
})

describe('suéter del gancho de ropa', () => {
  it('hay una prenda para el modo claro (crema) y otra morada para oscuro y daltonismo', () => {
    expect(GARMENT_SRC).toBe('/img/percha-sueter.png')
    expect(GARMENT_SRC_MORADO).toBe('/img/percha-sueter-morado.png')
    expect(GARMENT_SRC_MORADO).not.toBe(GARMENT_SRC)
    expect(imagenes.some((r) => r.endsWith('/percha-sueter.png'))).toBe(true)
    expect(imagenes.some((r) => r.endsWith('/percha-sueter-morado.png'))).toBe(true)
  })
})
