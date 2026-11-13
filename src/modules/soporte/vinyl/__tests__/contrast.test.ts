import { describe, it, expect } from 'vitest'
import {
  getContrastRatio,
  getRelativeLuminance,
  VINYL_CONTRAST_TOKENS,
} from '../contrast'

describe('Sistema de Contrastes Formales del Vinilo (WCAG 2.1)', () => {
  it('calcula la luminancia relativa correctamente', () => {
    expect(getRelativeLuminance('#FFFFFF')).toBeCloseTo(1.0, 2)
    expect(getRelativeLuminance('#000000')).toBeCloseTo(0.0, 2)
  })

  it('Burbuja propia (#F7F1E4 sobre #4B1FA8) cumple WCAG AAA (>= 7.0:1)', () => {
    const ratio = getContrastRatio('#F7F1E4', '#4B1FA8')
    expect(ratio).toBeGreaterThanOrEqual(7.0)
    expect(ratio).toBeCloseTo(9.05, 1)
  })

  it('Texto noche (#F4EEE3) cumple WCAG AAA (>= 7.0:1)', () => {
    const ratioBase = getContrastRatio('#F4EEE3', '#05030A')
    const ratioDisc = getContrastRatio('#F4EEE3', '#0B0615')
    expect(ratioBase).toBeCloseTo(17.76, 1)
    expect(ratioDisc).toBeGreaterThanOrEqual(7.0)
  })

  it('Texto secundario noche (#CFC6E0) cumple WCAG AAA (>= 7.0:1)', () => {
    const ratioBase = getContrastRatio('#CFC6E0', '#05030A')
    const ratioDisc = getContrastRatio('#CFC6E0', '#0B0615')
    expect(ratioBase).toBeCloseTo(12.51, 1)
    expect(ratioDisc).toBeGreaterThanOrEqual(7.0)
  })

  it('Texto día (#1F1433 sobre #E6D9C0) cumple WCAG AAA (>= 7.0:1)', () => {
    const ratio = getContrastRatio('#1F1433', '#E6D9C0')
    expect(ratio).toBeGreaterThanOrEqual(7.0)
    expect(ratio).toBeCloseTo(12.48, 1)
  })

  it('Todos los tokens exportados están formalmente certificados como WCAG AA y AAA', () => {
    Object.values(VINYL_CONTRAST_TOKENS).forEach((token) => {
      expect(token.wcagAA).toBe(true)
      expect(token.wcagAAA).toBe(true)
      expect(token.ratio).toBeGreaterThanOrEqual(7.0)
    })
  })
})
