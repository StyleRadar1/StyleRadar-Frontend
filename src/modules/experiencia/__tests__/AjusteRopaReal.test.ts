import { describe, expect, it } from 'vitest'
import { aplicarCambioRapido, DEFAULT_BODY_MEASUREMENTS, tallaDesdePecho } from '@/modules/experiencia/utils/bodyMeasurementsEngine'
import { evaluateGarmentFitWithMeasurements } from '@/modules/experiencia/utils/lookEngine'
import { anchoRealPrenda } from '@/modules/experiencia/components/FitAnalysis2D'
import { ITEMS } from '@/modules/catalogo/mocks/items'
import { REFERENCE_GARMENT_MEASUREMENTS } from '@/modules/catalogo/types/garmentMeasurements.dto'

const guia = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => ({ size, ...REFERENCE_GARMENT_MEASUREMENTS[size] }))
const base = { ...DEFAULT_BODY_MEASUREMENTS, cuerpoBase: 'masculino' as const, estatura: 175, peso: 68 }

describe('ajuste rápido del cuerpo', () => {
  it('más peso con la misma estatura agranda pecho, cintura y cadera y sube la talla', () => {
    const flaco = aplicarCambioRapido(base, { peso: 52 })
    const grande = aplicarCambioRapido(base, { peso: 115 })
    expect(grande.pecho).toBeGreaterThan(flaco.pecho)
    expect(grande.cintura).toBeGreaterThan(flaco.cintura)
    expect(grande.cadera).toBeGreaterThan(flaco.cadera)
    expect(['XL', 'XXL']).toContain(grande.tallaHabitual)
    expect(['XS', 'S']).toContain(flaco.tallaHabitual)
  })

  it('elegir una talla usa sus medidas típicas', () => {
    const l = aplicarCambioRapido(base, { tallaHabitual: 'L' })
    expect(tallaDesdePecho(l.pecho)).toBe('L')
  })
})

describe('la ropa tiene su tamaño real', () => {
  it('una prenda más grande se dibuja más ancha que una más chica', () => {
    const m = anchoRealPrenda('superior', 'M', false)!
    const xl = anchoRealPrenda('superior', 'XL', false)!
    expect(xl).toBeGreaterThan(m)
    expect(anchoRealPrenda('superior', 'S', false)!).toBeLessThan(m)
  })

  it('una talla desconocida no altera el dibujo', () => {
    expect(anchoRealPrenda('superior', 'Única', false)).toBeNull()
  })

  it('la misma prenda M queda perfecta, pequeña o grande según el cuerpo', () => {
    const prenda = ITEMS.find((i) => i.tallas.includes('M'))!
    const veredicto = (peso: number) =>
      evaluateGarmentFitWithMeasurements(prenda, 'M', aplicarCambioRapido(base, { peso }), guia).veredicto
    expect(veredicto(120)).toMatch(/pequeña|ceñido/i)
    expect(veredicto(48)).toMatch(/grande|holgada/i)
  })
})
