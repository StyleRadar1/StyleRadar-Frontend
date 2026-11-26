import { describe, expect, it } from 'vitest'
import { ordenarTallas, tallasDeInventario } from '../utils/tallas'

describe('tallas de una prenda', () => {
  it('ordena XS, S, M, L, XL y las numéricas de menor a mayor', () => {
    expect(ordenarTallas(['L', 'S', 'XL', 'M', 'XS'])).toEqual(['XS', 'S', 'M', 'L', 'XL'])
    expect(ordenarTallas(['42', '38', '40'])).toEqual(['38', '40', '42'])
    expect(ordenarTallas(['Única'])).toEqual(['Única'])
  })

  it('separa las tallas con stock de las agotadas según el inventario', () => {
    const inv = { sedes: [{ activo: true, variantes: [{ talla: 'S', stockDisponible: 0 }, { talla: 'M', stockDisponible: 4 }] }] }
    expect(tallasDeInventario(inv)).toEqual({ conStock: ['M'], sinStock: ['S'] })
  })

  it('una talla con stock en una sede no cuenta como agotada aunque otra sede esté en 0', () => {
    const inv = { sedes: [{ activo: true, variantes: [{ talla: 'S', stockDisponible: 0 }] }, { activo: true, variantes: [{ talla: 'S', stockDisponible: 2 }] }] }
    expect(tallasDeInventario(inv)).toEqual({ conStock: ['S'], sinStock: [] })
  })

  it('sin datos de inventario no inventa tallas', () => {
    expect(tallasDeInventario(null)).toEqual({ conStock: [], sinStock: [] })
  })
})
