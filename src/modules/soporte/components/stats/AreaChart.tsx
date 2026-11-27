import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SmartXAxis } from './SmartXAxis'

export interface SeriesPoint {
  key: string
  axisLabel: string
  fullLabel: string
  value: number
}

export interface AreaChartProps {
  title: string
  seriesLabel: string
  points: SeriesPoint[]
  axisMax: number
  mode?: 'area' | 'line'
  formatValue: (v: number) => string
  highlightPeaks?: boolean
  showAverage?: boolean
}

export function AreaChart({
  title,
  seriesLabel,
  points,
  axisMax,
  mode = 'area',
  formatValue,
  highlightPeaks = false,
  showAverage = false,
}: AreaChartProps) {
  const gradId = `sr-area-${useId().replace(/:/g, '')}`
  const glowId = `sr-glow-${useId().replace(/:/g, '')}`
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  const n = points.length
  const coords = points.map((p, i) => {
    const x = n > 1 ? (i / (n - 1)) * 960 + 20 : 500
    const y = axisMax > 0 ? 172 - (p.value / axisMax) * 152 : 172
    return [x, y] as const
  })

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1][0].toFixed(1)} 172 L${coords[0][0].toFixed(1)} 172 Z`
      : ''

  let maxIdx = -1
  if (highlightPeaks && n > 0) {
    let best = -Infinity
    points.forEach((p, i) => {
      if (p.value > best) {
        best = p.value
        maxIdx = i
      }
    })
  }
  const lastIdx = highlightPeaks && n > 0 ? n - 1 : -1

  const avg =
    showAverage && n > 0
      ? points.reduce((sum, p) => sum + p.value, 0) / n
      : null
  const avgY =
    avg !== null && axisMax > 0 ? 172 - (avg / axisMax) * 152 : null

  return (
    <div className="relative grid grid-cols-[auto_1fr] gap-x-3">
      {/* Eje vertical */}
      <div
        aria-hidden="true"
        className="flex h-52 flex-col justify-between pb-1 text-right text-[11px] tabular-nums text-[var(--sr-text-muted,#8b86a4)]"
      >
        <span>{formatValue(axisMax)}</span>
        <span>{formatValue(axisMax > 0 ? Math.round(axisMax / 2) : 0)}</span>
        <span>{formatValue(0)}</span>
      </div>

      {/* Área de dibujo */}
      <div className="relative h-52 border-b border-[var(--sr-border-subtle,rgba(255,255,255,0.12))]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-2 border-t border-dashed border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-white/10"
        />

        <motion.svg
          viewBox="0 0 1000 180"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9d5cff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#9d5cff" stopOpacity="0.02" />
            </linearGradient>
            <filter id={glowId} x="-10%" y="-20%" width="120%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c084fc" floodOpacity="0.45" />
            </filter>
          </defs>

          {mode === 'area' && areaPath && (
            <path d={areaPath} fill={`url(#${gradId})`} />
          )}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--sr-accent-text, #c084fc)"
              strokeWidth="2.8"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#${glowId})`}
            />
          )}

          {avgY !== null && (
            <line
              x1="10"
              x2="990"
              y1={avgY}
              y2={avgY}
              stroke="#e8dccb"
              strokeOpacity="0.6"
              strokeWidth="1.5"
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {hoverIdx !== null && coords[hoverIdx] && (
            <line
              x1={coords[hoverIdx][0]}
              x2={coords[hoverIdx][0]}
              y1="6"
              y2="176"
              stroke="var(--sr-accent-text, #c084fc)"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </motion.svg>

        {/* Puntos interactivos y resaltado */}
        {coords.map(([x, y], i) => {
          const isHover = hoverIdx === i
          const isPeak = i === maxIdx
          const isLast = i === lastIdx
          const showDot = mode === 'line' || isHover || isPeak || isLast
          if (!showDot) return null
          const dimmed = hoverIdx !== null && !isHover
          return (
            <span
              key={points[i].key}
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150"
              style={{
                left: `${(x / 1000) * 100}%`,
                top: `${(y / 180) * 100}%`,
                width: isHover ? 12 : isPeak || isLast ? 9 : 6,
                height: isHover ? 12 : isPeak || isLast ? 9 : 6,
                opacity: dimmed ? 0.35 : 1,
                backgroundColor: isPeak ? '#e8dccb' : '#c084fc',
                border: '2px solid rgba(20, 16, 33, 0.9)',
                boxShadow: isHover
                  ? '0 0 12px rgba(192, 132, 252, 0.9)'
                  : isPeak
                    ? '0 0 8px rgba(232, 220, 203, 0.7)'
                    : undefined,
              }}
            />
          )
        })}

        {avg !== null && avgY !== null && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 -translate-y-full rounded-full border border-[#e8dccb]/35 bg-[#141021]/85 px-2 py-0.5 text-[10px] font-semibold text-[#e8dccb]"
            style={{ top: `${(avgY / 180) * 100}%` }}
          >
            Prom: {formatValue(Math.round(avg))}
          </span>
        )}

        {/* Capa accesible interactiva (mouse + teclado) */}
        <ol className="absolute inset-0 flex items-stretch" aria-label={title}>
          {points.map((p, i) => {
            const isPeak = i === maxIdx
            const isLast = i === lastIdx
            const badge = isPeak && isLast
              ? 'Máximo · Último mes'
              : isPeak
                ? 'Mes con más ingresos'
                : isLast
                  ? 'Último mes'
                  : null
            return (
              <li
                key={p.key}
                tabIndex={0}
                className="relative flex-1 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-accent,#9d5cff)]"
                aria-label={`${p.fullLabel}: ${seriesLabel} ${formatValue(p.value)}${badge ? ` (${badge})` : ''}`}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
              >
                {hoverIdx === i && (
                  <span
                    role="tooltip"
                    className={`glass-tooltip pointer-events-none absolute top-2 z-20 whitespace-nowrap px-3 py-2 text-xs ${
                      i >= Math.floor(n / 2) ? 'right-1' : 'left-1'
                    }`}
                  >
                    <b className="block font-semibold">{p.fullLabel}</b>
                    {badge && (
                      <span className="mt-0.5 block text-[10px] font-semibold text-[#e8dccb]">
                        {badge}
                      </span>
                    )}
                    <span className="mt-1 flex items-center gap-2">
                      <span className="text-[var(--sr-text-muted,#8b86a4)]">{seriesLabel}</span>
                      <b className="tabular-nums">{formatValue(p.value)}</b>
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Eje horizontal adaptable */}
      <span />
      <SmartXAxis points={points} align="center" />
    </div>
  )
}
