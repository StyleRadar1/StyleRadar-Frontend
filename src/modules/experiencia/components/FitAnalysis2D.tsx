import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

export type FitLevel = 'perfecto' | 'un_poco_grande' | 'demasiado_grande' | 'muy_ajustada'

export interface WornFitInput {
  slot: string
  layer: string
  name?: string
  nombre?: string
  image?: string
  imagen?: string
  talla: string
  color?: string
  veredicto: string
  motivo?: string
}

export interface FitClassification {
  level: FitLevel
  label: string
  headline: string
  summary: string
  badgeClass: string
  dotColor: string
  zones: string[]
}

export function classifyFitVeredict(veredicto: string, motivo?: string): FitClassification {
  const v = `${veredicto} ${motivo ?? ''}`.toLowerCase()

  if (v.includes('pequeñ') || v.includes('ajustad') || v.includes('estrech') || v.includes('cort')) {
    return {
      level: 'muy_ajustada',
      label: 'Muy ajustada',
      headline: 'Queda apretada en tu cuerpo',
      summary: 'Tensión en pecho, hombros y mangas cortas según tus proporciones.',
      badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-300',
      dotColor: '#f87171',
      zones: [
        'Pecho / Espalda: apretado',
        'Mangas: demasiado cortas',
        'Largo: por encima de la cintura',
        'Brazos y torso: ajuste excesivo',
      ],
    }
  }

  if (v.includes('demasiado grande') || v.includes('muy grande') || v.includes('exceso')) {
    return {
      level: 'demasiado_grande',
      label: 'Demasiado grande',
      headline: 'Sobra bastante tela',
      summary: 'Hombros caídos, torso muy ancho y mangas largas sobre las manos.',
      badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-300',
      dotColor: '#f87171',
      zones: [
        'Hombros: caídos bajo la costura',
        'Torso / Espalda: ancho con exceso',
        'Mangas: largas sobre las manos',
        'Largo: cubre más de la cintura',
      ],
    }
  }

  if (v.includes('holgad') || v.includes('grande') || v.includes('suelt') || v.includes('ampl')) {
    return {
      level: 'un_poco_grande',
      label: 'Un poco grande',
      headline: 'Queda suelta en algunas zonas',
      summary: 'Holgura ligera en hombros, espalda y laterales del torso.',
      badgeClass: 'border-amber-400/50 bg-amber-500/15 text-amber-300',
      dotColor: '#fbbf24',
      zones: [
        'Hombros: ligeramente caídos',
        'Torso / Espalda: suelto a los lados',
        'Largo: cae debajo de la cintura',
      ],
    }
  }

  return {
    level: 'perfecto',
    label: 'Ajuste perfecto',
    headline: 'Es tu talla ideal',
    summary: 'Tus medidas coinciden con la prenda sin zonas apretadas ni exceso de tela.',
    badgeClass: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
    dotColor: '#34d399',
    zones: ['Hombros: alineados', 'Pecho / Cintura: ajuste ideal', 'Largo y mangas: proporcionados'],
  }
}

export function getLayerFitTransform(level: FitLevel, slot: string): CSSProperties {
  if (slot === 'calzado' || slot === 'accesorio') return {}
  switch (level) {
    case 'demasiado_grande':
      return {
        transform: 'translateY(3px) scaleX(1.13) scaleY(1.09)',
        transformOrigin: 'top center',
      }
    case 'un_poco_grande':
      return {
        transform: 'translateY(2px) scaleX(1.07) scaleY(1.05)',
        transformOrigin: 'top center',
      }
    case 'muy_ajustada':
      return {
        transform: 'translateY(-2px) scaleX(0.94) scaleY(0.91)',
        transformOrigin: 'top center',
      }
    default:
      return {}
  }
}

const GARMENT_COLOR_HEX: Record<string, { fill: string; stroke: string; detail: string }> = {
  negro: { fill: 'rgba(30, 29, 38, 0.72)', stroke: '#9ca3af', detail: '#6b7280' },
  blanco: { fill: 'rgba(236, 234, 228, 0.72)', stroke: '#cbd5e1', detail: '#94a3b8' },
  crudo: { fill: 'rgba(229, 220, 203, 0.72)', stroke: '#d6c8b0', detail: '#a89b84' },
  beige: { fill: 'rgba(214, 198, 173, 0.72)', stroke: '#c7b599', detail: '#9c8a70' },
  camel: { fill: 'rgba(184, 139, 88, 0.72)', stroke: '#d4a36a', detail: '#8c663b' },
  cafe: { fill: 'rgba(91, 62, 43, 0.72)', stroke: '#a67c5e', detail: '#5b3e2b' },
  café: { fill: 'rgba(91, 62, 43, 0.72)', stroke: '#a67c5e', detail: '#5b3e2b' },
  azul: { fill: 'rgba(44, 74, 117, 0.72)', stroke: '#60a5fa', detail: '#3b82f6' },
  gris: { fill: 'rgba(107, 114, 128, 0.72)', stroke: '#d1d5db', detail: '#9ca3af' },
  verde: { fill: 'rgba(47, 82, 65, 0.72)', stroke: '#6ee7b7', detail: '#34d399' },
  rojo: { fill: 'rgba(139, 38, 53, 0.72)', stroke: '#fda4af', detail: '#fb7185' },
  vino: { fill: 'rgba(97, 28, 44, 0.72)', stroke: '#f472b6', detail: '#db2777' },
  morado: { fill: 'rgba(91, 33, 182, 0.72)', stroke: '#c4b5fd', detail: '#8b5cf6' },
}

function pickGarmentPalette(color?: string, slot?: string) {
  const norm = (color || '').trim().toLowerCase()
  for (const [k, v] of Object.entries(GARMENT_COLOR_HEX)) {
    if (norm.includes(k)) return v
  }
  if (slot === 'inferior') return GARMENT_COLOR_HEX.azul
  if (slot === 'calzado') return GARMENT_COLOR_HEX.blanco
  if (slot === 'abrigo') return GARMENT_COLOR_HEX.negro
  return GARMENT_COLOR_HEX.morado
}

/**
 * Croquis técnico 2D (Frente y Espalda) estilo patrón anatómico gratuito,
 * con guías punteadas del cuerpo, silueta de prendas y líneas de ajuste (apretado/suelto/ideal).
 */
export function TechnicalCroquisSvg({
  view,
  female = false,
  layers,
  primaryFitLevel,
  inferiorFitLevel,
}: {
  view: 'front' | 'back'
  female?: boolean
  layers: { slot: string; layer: string; color?: string; fitLevel: FitLevel }[]
  primaryFitLevel: FitLevel | null
  inferiorFitLevel?: FitLevel | null
}) {
  const shL = female ? 58 : 49
  const shR = female ? 142 : 151
  const chestL = female ? 69 : 62
  const chestR = female ? 131 : 138
  const waistL = female ? 76 : 70
  const waistR = female ? 124 : 130
  const hipL = female ? 63 : 67
  const hipR = female ? 137 : 133

  const inferior = layers.find((l) => l.slot === 'inferior')
  const superior = layers.find((l) => l.slot === 'superior')
  const abrigo = layers.find((l) => l.slot === 'abrigo')
  const calzado = layers.find((l) => l.slot === 'calzado')

  const topColor =
    primaryFitLevel === 'muy_ajustada' || primaryFitLevel === 'demasiado_grande'
      ? '#f87171'
      : primaryFitLevel === 'un_poco_grande'
        ? '#fbbf24'
        : '#34d399'

  const botLevel = inferiorFitLevel ?? primaryFitLevel
  const botColor =
    botLevel === 'muy_ajustada' || botLevel === 'demasiado_grande'
      ? '#f87171'
      : botLevel === 'un_poco_grande'
        ? '#fbbf24'
        : '#34d399'

  const mannequinSrc = female
    ? view === 'front'
      ? '/img/mannequins/croquis-f-frente.png'
      : '/img/mannequins/croquis-f-espalda.png'
    : view === 'front'
      ? '/img/mannequins/croquis-m-frente.png'
      : '/img/mannequins/croquis-m-espalda.png'

  return (
    <svg
      viewBox="0 0 200 475"
      className="h-full w-auto max-h-full select-none"
      style={{ filter: 'drop-shadow(0 0 18px rgba(112, 35, 207, 0.28))' }}
      role="img"
      aria-label={view === 'front' ? 'Modelo anatómico técnico vista frontal' : 'Modelo anatómico técnico vista trasera'}
    >
      {/* 1. Maniquí anatómico vectorial (según género y vista frente/espalda) */}
      <image
        href={mannequinSrc}
        x="4"
        y="12"
        width="192"
        height="446"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* 3. Prendas superpuestas con deformación real por ajuste */}
      {inferior && (() => {
        const pal = pickGarmentPalette(inferior.color, 'inferior')
        const t = getLayerFitTransform(inferior.fitLevel, 'inferior')
        return (
          <g style={t}>
            <path
              d={`M${waistL} 174 L${waistR} 174 L${hipR} 214 L128 332 L124 422 L106 422 L100 256 L94 422 L76 422 L72 332 L${hipL} 214 Z`}
              fill={pal.fill}
              stroke={pal.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {view === 'back' && (
              <g fill="none" stroke={pal.detail} strokeWidth="1.1" opacity="0.8">
                <path d="M76 202 L93 202 L92 220 L77 220 Z" />
                <path d="M107 202 L124 202 L123 220 L108 220 Z" />
              </g>
            )}
          </g>
        )
      })()}

      {superior && (() => {
        const pal = pickGarmentPalette(superior.color, 'superior')
        const t = getLayerFitTransform(superior.fitLevel, 'superior')
        const neckPath = view === 'front' ? 'M86 78 Q100 94 114 78' : 'M86 78 Q100 84 114 78'
        return (
          <g style={t}>
            <path
              d={`${neckPath} L${shR} 88 L${shR + 14} 198 L${shR + 4} 201 L${chestR} 130 L${waistR + 2} 194 L${waistL - 2} 194 L${chestL} 130 L${shL - 4} 201 L${shL - 14} 198 L${shL} 88 Z`}
              fill={pal.fill}
              stroke={pal.stroke}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        )
      })()}

      {abrigo && (() => {
        const pal = pickGarmentPalette(abrigo.color, 'abrigo')
        const t = getLayerFitTransform(abrigo.fitLevel, 'abrigo')
        const neckPath = view === 'front' ? 'M84 76 L100 108 L116 76' : 'M84 76 Q100 83 116 76'
        return (
          <g style={t}>
            <path
              d={`${neckPath} L${shR + 3} 87 L${shR + 17} 204 L${shR + 5} 207 L${chestR + 3} 132 L${waistR + 5} 224 L${waistL - 5} 224 L${chestL - 3} 132 L${shL - 5} 207 L${shL - 17} 204 L${shL - 3} 87 Z`}
              fill={pal.fill}
              stroke={pal.stroke}
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            {view === 'front' && <line x1="100" y1="108" x2="100" y2="224" stroke={pal.detail} strokeWidth="1.2" />}
          </g>
        )
      })()}

      {calzado && (() => {
        const pal = pickGarmentPalette(calzado.color, 'calzado')
        return (
          <g>
            <rect x="65" y="424" width="24" height="24" rx="6" fill={pal.fill} stroke={pal.stroke} strokeWidth="1.4" />
            <rect x="111" y="424" width="24" height="24" rx="6" fill={pal.fill} stroke={pal.stroke} strokeWidth="1.4" />
          </g>
        )
      })()}

      {/* 4. Líneas indicadoras sobre el cuerpo: dónde queda apretado, suelto o ideal */}
      {primaryFitLevel && (
        <g fill="none" strokeLinecap="round">
          {/* Zona Hombros */}
          <line x1={shL - 12} y1="84" x2={shR + 12} y2="84" stroke={topColor} strokeWidth="1.6" strokeDasharray="4 3" />
          {/* Zona Pecho / Espalda */}
          <line x1={chestL - 10} y1="126" x2={chestR + 10} y2="126" stroke={topColor} strokeWidth="1.8" strokeDasharray={primaryFitLevel === 'muy_ajustada' ? '6 2' : '3 3'} />
          {/* Zona Cintura */}
          <line x1={waistL - 8} y1="174" x2={waistR + 8} y2="174" stroke={topColor} strokeWidth="1.6" strokeDasharray="4 3" />

          {(primaryFitLevel === 'un_poco_grande' || primaryFitLevel === 'demasiado_grande') && (
            <g stroke={topColor} strokeWidth="2">
              {/* Flechas/marcas de tela sobrante */}
              <path d={`M${shL - 14} 84 L${shL - 22} 80 M${shL - 14} 84 L${shL - 22} 88`} />
              <path d={`M${shR + 14} 84 L${shR + 22} 80 M${shR + 14} 84 L${shR + 22} 88`} />
              <path d={`M${waistL - 10} 166 L${waistL - 19} 169 M${waistR + 10} 166 L${waistR + 19} 169`} />
            </g>
          )}

          {primaryFitLevel === 'muy_ajustada' && (
            <g stroke={topColor} strokeWidth="2">
              {/* Marcas de tensión apretada hacia adentro */}
              <path d={`M${chestL - 18} 126 L${chestL - 9} 126 M${chestR + 18} 126 L${chestR + 9} 126`} />
              <path d={`M${shL - 10} 152 L${shL - 2} 148 M${shR + 10} 152 L${shR + 2} 148`} />
            </g>
          )}
        </g>
      )}

      {inferior && botLevel && (
        <line x1={hipL - 10} y1="214" x2={hipR + 10} y2="214" stroke={botColor} strokeWidth="1.6" strokeDasharray="4 3" />
      )}
    </svg>
  )
}

export function FitAnalysisPanel({ wornList }: { wornList: WornFitInput[] }) {
  const primary =
    wornList.find((w) => w.slot === 'superior') ??
    wornList.find((w) => w.slot === 'abrigo') ??
    wornList[0] ??
    null

  if (!primary) return null

  const fit = classifyFitVeredict(primary.veredicto, primary.motivo)
  const strokeColor =
    fit.level === 'perfecto'
      ? '#34d399'
      : fit.level === 'un_poco_grande'
        ? '#fbbf24'
        : '#f87171'

  return (
    <aside
      aria-label="Panel de ajuste del look"
      className="hidden xl:flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-white/15 bg-[#151121]/85 p-4 text-white backdrop-blur-xl shadow-2xl"
    >
      <div className="text-center">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${fit.badgeClass}`}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fit.dotColor }} />
          {fit.label}
        </span>
        <h3 className="mt-2 text-base font-extrabold leading-tight">{fit.headline}</h3>
        <p className="mt-1 text-[11px] leading-snug text-white/70">{fit.summary}</p>
      </div>

      {/* Zonas detectadas */}
      <div className="space-y-1 border-t border-white/10 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Líneas por tu cuerpo</p>
        <ul className="space-y-1 text-[11px] text-white/85">
          {fit.zones.map((z) => (
            <li key={z} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: strokeColor }} />
              <span className="truncate">{z}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Resumen del look por prenda */}
      <div className="space-y-1.5 border-t border-white/10 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Resumen del look</p>
        <div className="max-h-32 space-y-1.5 overflow-y-auto pr-0.5">
          {wornList.map((w) => {
            const itemFit = classifyFitVeredict(w.veredicto, w.motivo)
            const title = w.name ?? w.nombre ?? w.slot
            const imgSrc = w.image ?? w.imagen ?? ''
            return (
              <div key={w.slot} className="flex items-center gap-2 rounded-xl bg-white/5 p-1.5">
                {imgSrc && <img src={imgSrc} alt={title} className="h-8 w-8 shrink-0 rounded-md object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-white">{title}</p>
                  <p className="text-[10px] font-semibold" style={{ color: itemFit.dotColor }}>
                    ● {itemFit.label} ({w.talla})
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Paso 2: una vez confirmas la talla, probar en foto real con IA */}
      <Link
        to="/probador"
        className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-violeta px-3 py-2 text-xs font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-violeta-hover"
      >
        Probar con foto IA →
      </Link>
    </aside>
  )
}
