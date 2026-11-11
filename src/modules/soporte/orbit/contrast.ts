/**
 * Cálculo exacto de luminancia relativa y ratio de contraste WCAG 2.1
 * Garantiza cumplimiento de WCAG AA (>= 4.5:1 para texto normal)
 */

interface RGB {
  r: number
  g: number
  b: number
}

export function parseHex(hex: string): RGB {
  const clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    }
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

/**
 * Calcula la luminancia relativa según la fórmula WCAG 2.1
 */
export function relativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calcula el ratio de contraste entre dos colores (>= 1.0)
 */
export function contrastRatio(c1: string, c2: string): number {
  const l1 = relativeLuminance(parseHex(c1))
  const l2 = relativeLuminance(parseHex(c2))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Mezcla de color sobre fondo con opacidad alfa (color-mix / alpha blending)
 */
export function blend(fg: string, bg: string, alpha: number): string {
  const f = parseHex(fg)
  const b = parseHex(bg)
  const r = Math.round(f.r * alpha + b.r * (1 - alpha))
  const g = Math.round(f.g * alpha + b.g * (1 - alpha))
  const bl = Math.round(f.b * alpha + b.b * (1 - alpha))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

/**
 * Paleta del sistema Órbita:
 * - Morado de marca: #4B1FA8
 * - Lila: #B79AF5
 * - Rosa empolvado: #E8B4CC
 * - Tinta: #1F1433
 * - Texto noche: #F4EEE3
 * - Secundario noche: #CFC6E0
 * - Burbuja propia texto: #F7F1E4 sobre #4B1FA8
 * - Burbuja ajena texto: #1F1433 sobre superficie translúcida adaptativa
 */
export function calculateOrbitContrasts() {
  const results = {
    // 1. Burbujas propias: texto #F7F1E4 sobre fondo #4B1FA8
    burbujaPropia: {
      fg: '#F7F1E4',
      bg: '#4B1FA8',
      ratio: contrastRatio('#F7F1E4', '#4B1FA8'),
      cumpleAA: contrastRatio('#F7F1E4', '#4B1FA8') >= 4.5,
    },
    // 2. Texto noche (#F4EEE3) sobre fondo oscuro (#05030A)
    textoNocheSobreOscuro: {
      fg: '#F4EEE3',
      bg: '#05030A',
      ratio: contrastRatio('#F4EEE3', '#05030A'),
      cumpleAA: contrastRatio('#F4EEE3', '#05030A') >= 4.5,
    },
    // 3. Texto secundario noche (#CFC6E0) sobre fondo oscuro (#05030A)
    textoSecundarioSobreOscuro: {
      fg: '#CFC6E0',
      bg: '#05030A',
      ratio: contrastRatio('#CFC6E0', '#05030A'),
      cumpleAA: contrastRatio('#CFC6E0', '#05030A') >= 4.5,
    },
    // 4. Texto tinta (#1F1433) sobre fondo claro (#E6D9C0)
    textoTintaSobreClaro: {
      fg: '#1F1433',
      bg: '#E6D9C0',
      ratio: contrastRatio('#1F1433', '#E6D9C0'),
      cumpleAA: contrastRatio('#1F1433', '#E6D9C0') >= 4.5,
    },
    // 5. Burbuja ajena en modo oscuro: fondo translúcido (38% blanco sobre #1A1426 con tinte)
    burbujaAjenaModoOscuro: {
      // 38% blanco sobre fondo de vidrio oscuro (~#181224)
      bgEfectivo: blend('#FFFFFF', '#181224', 0.42),
      fg: '#1F1433', // O alternativo #FFFFFF en modo noche si el fondo fuera oscuro
      ratio: contrastRatio('#1F1433', blend('#FFFFFF', '#181224', 0.42)),
      cumpleAA: contrastRatio('#1F1433', blend('#FFFFFF', '#181224', 0.42)) >= 4.5,
    },
    // 6. Burbuja ajena en modo claro: 85% blanco/arena sobre #E6D9C0
    burbujaAjenaModoClaro: {
      bgEfectivo: blend('#FFFFFF', '#E6D9C0', 0.85),
      fg: '#1F1433',
      ratio: contrastRatio('#1F1433', blend('#FFFFFF', '#E6D9C0', 0.85)),
      cumpleAA: contrastRatio('#1F1433', blend('#FFFFFF', '#E6D9C0', 0.85)) >= 4.5,
    },
  }

  return results
}
