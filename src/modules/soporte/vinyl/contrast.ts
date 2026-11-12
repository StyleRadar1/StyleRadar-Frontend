/**
 * Sistema de Contrastes Formales WCAG para el Vinilo de Mensajes
 * Garantiza cumplimiento WCAG AA (>= 4.5:1) y WCAG AAA (>= 7.0:1)
 */

export interface ContrastRatioReport {
  name: string
  fgHex: string
  bgHex: string
  ratio: number
  wcagAA: boolean
  wcagAAA: boolean
}

/**
 * Convierte canal RGB (0-255) a luminancia lineal según WCAG 2.1
 */
function sRgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/**
 * Calcula luminancia relativa de un color HEX
 */
export function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b)
}

/**
 * Calcula ratio de contraste entre dos colores (L1 + 0.05) / (L2 + 0.05)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1)
  const l2 = getRelativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

export const VINYL_CONTRAST_TOKENS: Record<string, ContrastRatioReport> = {
  BURBUJA_PROPIA: {
    name: 'Burbuja propia',
    fgHex: '#F7F1E4',
    bgHex: '#4B1FA8',
    ratio: 9.05,
    wcagAA: true,
    wcagAAA: true,
  },
  BURBUJA_AJENA_DIA: {
    name: 'Burbuja ajena (día)',
    fgHex: '#1F1433',
    bgHex: '#FFFFFF', // fondo translúcido sobre base clara
    ratio: 14.2,
    wcagAA: true,
    wcagAAA: true,
  },
  TEXTO_NOCHE: {
    name: 'Texto noche principal',
    fgHex: '#F4EEE3',
    bgHex: '#05030A',
    ratio: 17.76,
    wcagAA: true,
    wcagAAA: true,
  },
  TEXTO_SECUNDARIO_NOCHE: {
    name: 'Texto secundario noche',
    fgHex: '#CFC6E0',
    bgHex: '#05030A',
    ratio: 12.51,
    wcagAA: true,
    wcagAAA: true,
  },
  TEXTO_DIA: {
    name: 'Texto día principal',
    fgHex: '#1F1433',
    bgHex: '#E6D9C0',
    ratio: 12.48,
    wcagAA: true,
    wcagAAA: true,
  },
}
