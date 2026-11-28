import { useId } from 'react'
import type { ModoCvd } from './cvdSim'

/**
 * Símbolo de cada modo de daltonismo: tres barras (rojo, verde, azul) donde la que se ve afectada va rayada.
 * El rayado es una señal que no depende del color, así que se entiende también con el propio daltonismo.
 *   - «-opía» (falta el color): la barra va toda rayada.
 *   - «-omalía» (color débil): la barra conserva su color, con rayas encima.
 *   - Acromatopsia: las tres barras en grises, cada una con su claridad.
 *   - Solo la paleta: tres barras con los colores seguros Okabe-Ito, sin rayas.
 */
type Canal = 'r' | 'g' | 'b'
const AFECTA: Partial<Record<ModoCvd, { canal: Canal; leve: boolean }>> = {
  protanomalia: { canal: 'r', leve: true },
  protanopia: { canal: 'r', leve: false },
  deuteranomalia: { canal: 'g', leve: true },
  deuteranopia: { canal: 'g', leve: false },
  tritanomalia: { canal: 'b', leve: true },
  tritanopia: { canal: 'b', leve: false },
}
const COLOR: Record<Canal, string> = { r: '#d62839', g: '#1f9d55', b: '#2563eb' }
const PALETA = ['#0072b2', '#e69f00', '#f0e442']
const GRISES = ['#5b5b5b', '#b4b4b4', '#2e2e2e']
const BARRAS: { canal: Canal; x: number }[] = [{ canal: 'r', x: 2 }, { canal: 'g', x: 13 }, { canal: 'b', x: 24 }]

export function IconoModoCvd({ modo, className }: { modo: ModoCvd; className?: string }) {
  const id = useId().replace(/:/g, '')
  const rayas = `rayas-${id}`
  const afecta = AFECTA[modo]

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 36 26"
      width="46"
      height="33"
      className={className}
      data-modo={modo}
    >
      <defs>
        <pattern id={rayas} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="4" fill="#d1d5db" />
          <rect width="2" height="4" fill="#4b5563" />
        </pattern>
      </defs>

      {BARRAS.map(({ canal, x }, i) => {
        const base = modo === 'normal' ? PALETA[i] : modo === 'acromatopsia' ? GRISES[i] : COLOR[canal]
        const afectada = afecta?.canal === canal
        return (
          <g key={canal}>
            <rect x={x} y={2} width={10} height={22} rx={3} fill={afectada && !afecta.leve ? `url(#${rayas})` : base} />
            {afectada && afecta.leve && <rect x={x} y={2} width={10} height={22} rx={3} fill={`url(#${rayas})`} opacity={0.55} />}
            <rect x={x} y={2} width={10} height={22} rx={3} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
          </g>
        )
      })}
    </svg>
  )
}
