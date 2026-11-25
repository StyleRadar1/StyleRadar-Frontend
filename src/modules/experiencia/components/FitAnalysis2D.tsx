import type { CSSProperties } from 'react'

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
      headline: 'La prenda te queda pequeña',
      summary: 'Presenta tensión en pecho, brazos y largo por encima de la cintura.',
      badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-300',
      dotColor: '#f87171',
      zones: [
        'Mangas demasiado cortas',
        'Tela estirada en el pecho',
        'No llega a la cintura',
        'Ajuste excesivo en brazos y torso',
      ],
    }
  }

  if (v.includes('demasiado grande') || v.includes('muy grande') || v.includes('exceso')) {
    return {
      level: 'demasiado_grande',
      label: 'Demasiado grande',
      headline: 'La prenda te queda muy grande',
      summary: 'Sobra tela en torso, hombros caídos y mangas cubriendo parte de las manos.',
      badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-300',
      dotColor: '#f87171',
      zones: [
        'Hombros caídos bajo la costura',
        'Mangas largas sobre las manos',
        'Torso ancho con pliegues laterales',
        'Largo excesivo sobre la cintura',
      ],
    }
  }

  if (v.includes('holgad') || v.includes('grande') || v.includes('suelt') || v.includes('ampl')) {
    return {
      level: 'un_poco_grande',
      label: 'Un poco grande',
      headline: 'La prenda te queda grande',
      summary: 'Tiene holgura adicional en hombros, espalda y laterales del torso.',
      badgeClass: 'border-amber-400/50 bg-amber-500/15 text-amber-300',
      dotColor: '#fbbf24',
      zones: [
        'Hombros ligeramente caídos',
        'Holgura extra en espalda y torso',
        'Largo suave por debajo de la cintura',
      ],
    }
  }

  return {
    level: 'perfecto',
    label: 'Ajuste perfecto',
    headline: 'Te queda bien',
    summary: 'Las medidas coinciden con tu silueta sin exceso ni tensión de tela.',
    badgeClass: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
    dotColor: '#34d399',
    zones: ['Hombros alineados', 'Largo ideal en cintura', 'Caída equilibrada'],
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

export function FitIndicatorsSvg({
  level,
  view,
}: {
  level: FitLevel
  view: 'front' | 'back'
}) {
  const isLarge = level === 'un_poco_grande' || level === 'demasiado_grande'
  const isTight = level === 'muy_ajustada'
  const stroke =
    level === 'demasiado_grande' || isTight
      ? '#f87171'
      : level === 'un_poco_grande'
        ? '#fbbf24'
        : '#34d399'

  return (
    <svg
      viewBox="0 0 200 420"
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      aria-hidden="true"
    >
      {isLarge && (
        <g stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9">
          {/* Líneas de holgura en hombros caídos */}
          <path d="M46 92 L35 84 M43 99 L32 95" />
          <path d="M154 92 L165 84 M157 99 L168 95" />
          {/* Exceso lateral en torso / espalda */}
          <path d="M52 152 L41 150 M52 162 L40 164 M54 172 L43 176" />
          <path d="M148 152 L159 150 M148 162 L160 164 M146 172 L157 176" />
          {/* Pliegues adicionales y largo extra en cintura */}
          <path d="M74 188 Q100 198 126 188" strokeDasharray="4 4" />
          {view === 'back' && <path d="M82 126 Q100 136 118 126" strokeDasharray="3 3" />}
        </g>
      )}

      {isTight && (
        <g stroke={stroke} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.92">
          {/* Tensión horizontal en pecho / espalda */}
          <path d="M70 122 L130 122" strokeDasharray="5 3" />
          <path d="M75 134 L125 134" strokeDasharray="5 3" />
          {/* Mangas cortas / tensión en brazos */}
          <path d="M45 135 L58 130 M155 135 L142 130" />
          {/* Largo corto sobre cintura */}
          <path d="M72 170 L128 170" />
        </g>
      )}

      {level === 'perfecto' && (
        <g stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75">
          <path d="M52 94 L43 90 M148 94 L157 90" />
          <path d="M78 184 L122 184" strokeDasharray="4 4" />
        </g>
      )}
    </svg>
  )
}

const GARMENT_COLOR_HEX: Record<string, { fill: string; stroke: string; detail: string }> = {
  negro: { fill: '#1c1b22', stroke: '#3a3846', detail: '#2d2b36' },
  blanco: { fill: '#e8e6e1', stroke: '#b8b5ae', detail: '#d0cdc6' },
  crudo: { fill: '#e5dccb', stroke: '#bfb49f', detail: '#d3c8b4' },
  beige: { fill: '#d6c6ad', stroke: '#a99980', detail: '#c2b197' },
  camel: { fill: '#b88b58', stroke: '#8c663b', detail: '#a37847' },
  cafe: { fill: '#5b3e2b', stroke: '#3e291b', detail: '#4b3222' },
  café: { fill: '#5b3e2b', stroke: '#3e291b', detail: '#4b3222' },
  azul: { fill: '#2c4a75', stroke: '#1d3252', detail: '#3a5d8f' },
  gris: { fill: '#6b7280', stroke: '#4b5563', detail: '#808896' },
  verde: { fill: '#2f5241', stroke: '#1e382b', detail: '#3e6854' },
  rojo: { fill: '#8b2635', stroke: '#5e1722', detail: '#a63344' },
  vino: { fill: '#611c2c', stroke: '#41111d', detail: '#7a2539' },
  morado: { fill: '#4c1d95', stroke: '#35126b', detail: '#6128b8' },
}

function pickGarmentPalette(color?: string, slot?: string) {
  const norm = (color || '').trim().toLowerCase()
  for (const [k, v] of Object.entries(GARMENT_COLOR_HEX)) {
    if (norm.includes(k)) return v
  }
  if (slot === 'inferior') return GARMENT_COLOR_HEX.azul
  if (slot === 'calzado') return GARMENT_COLOR_HEX.blanco
  if (slot === 'abrigo') return GARMENT_COLOR_HEX.negro
  return GARMENT_COLOR_HEX.crudo
}

/**
 * Capas traseras vectoriales limpias para el maniquí de espalda, evitando
 * huecos de escote frontal y sombras/manchas de recortes delanteros.
 */
export function BackGarmentLayersSvg({
  layers,
  female = false,
}: {
  layers: { slot: string; layer: string; color?: string; fitLevel: FitLevel }[]
  female?: boolean
}) {
  const inferior = layers.find((l) => l.slot === 'inferior')
  const superior = layers.find((l) => l.slot === 'superior')
  const abrigo = layers.find((l) => l.slot === 'abrigo')
  const calzado = layers.find((l) => l.slot === 'calzado')

  const shL = female ? 58 : 49
  const shR = female ? 142 : 151
  const waistL = female ? 72 : 66
  const waistR = female ? 128 : 134
  const hipL = female ? 63 : 66
  const hipR = female ? 137 : 134

  return (
    <svg
      viewBox="0 0 200 480"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      aria-hidden="true"
    >
      {/* Inferior (pantalón / falda vista trasera limpia) */}
      {inferior && (() => {
        const pal = pickGarmentPalette(inferior.color, 'inferior')
        const t = getLayerFitTransform(inferior.fitLevel, 'inferior')
        return (
          <g style={t}>
            <path
              d={`M${waistL} 206 L${waistR} 206 L${hipR} 252 L${hipR - 6} 422 L106 422 L101 278 L99 278 L94 422 L${hipL + 6} 422 L${hipL} 252 Z`}
              fill={pal.fill}
              stroke={pal.stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Bolsillos traseros sutiles */}
            <path d="M74 226 L92 226 L91 245 L75 245 Z" fill="none" stroke={pal.detail} strokeWidth="1.2" />
            <path d="M108 226 L126 226 L125 245 L109 245 Z" fill="none" stroke={pal.detail} strokeWidth="1.2" />
          </g>
        )
      })()}

      {/* Superior (camisa / suéter vista trasera cerrada en cuello) */}
      {superior && (() => {
        const pal = pickGarmentPalette(superior.color, 'superior')
        const t = getLayerFitTransform(superior.fitLevel, 'superior')
        return (
          <g style={t}>
            <path
              d={`M83 82 Q100 88 117 82 L${shR} 96 L${shR + 18} 206 L${shR + 4} 209 L${shR - 8} 130 L${waistR} 212 L${waistL} 212 L${shL + 8} 130 L${shL - 4} 209 L${shL - 18} 206 L${shL} 96 Z`}
              fill={pal.fill}
              stroke={pal.stroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Costura trasera de cuello y hombros */}
            <path d="M84 84 Q100 91 116 84" fill="none" stroke={pal.detail} strokeWidth="1.4" />
            <path d={`M${shL + 8} 102 L${shL + 8} 130 M${shR - 8} 102 L${shR - 8} 130`} fill="none" stroke={pal.detail} strokeWidth="1.1" opacity="0.7" />
          </g>
        )
      })()}

      {/* Abrigo / Chaqueta vista trasera */}
      {abrigo && (() => {
        const pal = pickGarmentPalette(abrigo.color, 'abrigo')
        const t = getLayerFitTransform(abrigo.fitLevel, 'abrigo')
        return (
          <g style={t}>
            <path
              d={`M81 80 Q100 87 119 80 L${shR + 3} 95 L${shR + 21} 212 L${shR + 5} 215 L${shR - 6} 132 L${waistR + 4} 232 L${waistL - 4} 232 L${shL + 6} 132 L${shL - 5} 215 L${shL - 21} 212 L${shL - 3} 95 Z`}
              fill={pal.fill}
              stroke={pal.stroke}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <line x1="100" y1="88" x2="100" y2="230" stroke={pal.detail} strokeWidth="1.1" opacity="0.55" />
          </g>
        )
      })()}

      {/* Calzado vista trasera */}
      {calzado && (() => {
        const pal = pickGarmentPalette(calzado.color, 'calzado')
        return (
          <g>
            <rect x="69" y="424" width="22" height="24" rx="6" fill={pal.fill} stroke={pal.stroke} strokeWidth="1.4" />
            <rect x="109" y="424" width="22" height="24" rx="6" fill={pal.fill} stroke={pal.stroke} strokeWidth="1.4" />
          </g>
        )
      })()}
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

      {/* Esquema visual SVG de la prenda */}
      <div className="flex justify-center py-1">
        <svg viewBox="0 0 120 96" className="h-20 w-24" aria-hidden="true">
          <path
            d="M38 14 L20 26 L12 62 L26 65 L32 36 L32 82 L88 82 L88 36 L94 65 L108 62 L100 26 L82 14 Q60 22 38 14 Z"
            fill="rgba(139,92,246,0.12)"
            stroke="#c4b5fd"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {fit.level !== 'perfecto' && (
            <>
              <path d="M10 38 L4 35 M10 46 L4 48" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
              <path d="M110 38 L116 35 M110 46 L116 48" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
              <path d="M40 48 L80 48" stroke={strokeColor} strokeWidth="1.6" strokeDasharray="4 3" />
            </>
          )}
        </svg>
      </div>

      {/* Zonas detectadas */}
      <div className="space-y-1 border-t border-white/10 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Zonas analizadas</p>
        <ul className="space-y-1 text-[11px] text-white/85">
          {fit.zones.map((z) => (
            <li key={z} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: fit.dotColor }} />
              <span className="truncate">{z}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Resumen del look por prenda */}
      <div className="space-y-1.5 border-t border-white/10 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Resumen del look</p>
        <div className="max-h-36 space-y-1.5 overflow-y-auto pr-0.5">
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
    </aside>
  )
}
