import { describe, expect, it } from 'vitest'
import { calculateOrbitContrasts, contrastRatio } from '../contrast'

describe('Cálculo y cumplimiento de contraste WCAG AA en Sistema Órbita', () => {
  it('todas las combinaciones de texto principales cumplen con WCAG AA (>= 4.5:1)', () => {
    const results = calculateOrbitContrasts()

    // 1. Burbuja propia: texto #F7F1E4 sobre fondo morado de marca #4B1FA8
    expect(results.burbujaPropia.ratio).toBeGreaterThanOrEqual(4.5)
    expect(results.burbujaPropia.cumpleAA).toBe(true)

    // 2. Texto noche #F4EEE3 sobre fondo oscuro #05030A
    expect(results.textoNocheSobreOscuro.ratio).toBeGreaterThanOrEqual(4.5)
    expect(results.textoNocheSobreOscuro.cumpleAA).toBe(true)

    // 3. Texto secundario noche #CFC6E0 sobre fondo oscuro #05030A
    expect(results.textoSecundarioSobreOscuro.ratio).toBeGreaterThanOrEqual(4.5)
    expect(results.textoSecundarioSobreOscuro.cumpleAA).toBe(true)

    // 4. Texto tinta #1F1433 sobre fondo claro #E6D9C0
    expect(results.textoTintaSobreClaro.ratio).toBeGreaterThanOrEqual(4.5)
    expect(results.textoTintaSobreClaro.cumpleAA).toBe(true)

    // 5. Burbuja del otro en modo claro: texto #1F1433 sobre superficie clara
    expect(results.burbujaAjenaModoClaro.ratio).toBeGreaterThanOrEqual(4.5)
    expect(results.burbujaAjenaModoClaro.cumpleAA).toBe(true)
  })

  it('verifica contraste específico de elementos clave', () => {
    // Morado propio (#4B1FA8) con texto crema (#F7F1E4)
    const ratioPropio = contrastRatio('#F7F1E4', '#4B1FA8')
    expect(ratioPropio).toBeCloseTo(9.05, 1)

    // Texto tinta (#1F1433) sobre blanco (#FFFFFF)
    const ratioTintaBlanco = contrastRatio('#1F1433', '#FFFFFF')
    expect(ratioTintaBlanco).toBeGreaterThan(13.0)

    // Texto noche (#F4EEE3) sobre negro violeta (#05030A)
    const ratioNoche = contrastRatio('#F4EEE3', '#05030A')
    expect(ratioNoche).toBeGreaterThan(16.0)
  })
})
