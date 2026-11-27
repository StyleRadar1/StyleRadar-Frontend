import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SmartXAxis } from './SmartXAxis'
import type { SeriesPoint } from './AreaChart'

export interface ActivityBarsProps {
  title: string
  seriesLabel: string
  points: SeriesPoint[]
  axisMax: number
  variant?: 'activity' | 'vertical'
  formatValue: (v: number) => string
  highlightPeaks?: boolean
  showAverage?: boolean
}

function barIntensityColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return 'rgba(184, 179, 206, 0.14)'
  const ratio = Math.min(1, value / max)
  const alphaTop = (0.35 + ratio * 0.62).toFixed(2)
  const alphaBottom = (0.14 + ratio * 0.36).toFixed(2)
  return `linear-gradient(180deg, rgba(192, 132, 252, ${alphaTop}) 0%, rgba(123, 77, 216, ${alphaBottom}) 100%)`
}

export function ActivityBars({
  title,
  seriesLabel,
  points,
  axisMax,
  variant = 'activity',
  formatValue,
  highlightPeaks = false,
  showAverage = false,
}: ActivityBarsProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()
  const n = points.length
  const rawMax = Math.max(...points.map((p) => p.value), 0)

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
  const avgPct = avg !== null && axisMax > 0 ? (avg / axisMax) * 100 : null

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

      {/* Barras */}
      <div className="relative h-52 border-b border-[var(--sr-border-subtle,rgba(255,255,255,0.12))]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-2 border-t border-dashed border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-white/10"
        />

        {avgPct !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-[#e8dccb]/70"
            style={{ bottom: `${avgPct}%` }}
          >
            <span className="absolute right-1 -top-5 rounded-full border border-[#e8dccb]/35 bg-[#141021]/85 px-2 py-0.5 text-[10px] font-semibold text-[#e8dccb]">
              Prom: {formatValue(Math.round(avg ?? 0))}
            </span>
          </div>
        )}

        <div
          aria-hidden="true"
          className={`flex h-full items-end pt-2 ${
            variant === 'activity' ? 'gap-[2px] px-0.5' : 'gap-2 px-1'
          }`}
        >
          {points.map((p, i) => {
            const pct = axisMax > 0 ? (p.value / axisMax) * 100 : 0
            const isHover = hoverIdx === i
            const dimmed = hoverIdx !== null && !isHover
            const isPeak = i === maxIdx
            const isLast = i === lastIdx
            const background =
              variant === 'activity'
                ? barIntensityColor(p.value, rawMax)
                : isPeak
                  ? 'linear-gradient(180deg, rgba(232, 220, 203, 0.92) 0%, rgba(232, 220, 203, 0.22) 100%)'
                  : 'linear-gradient(180deg, rgba(192, 132, 252, 0.9) 0%, rgba(123, 77, 216, 0.18) 100%)'

            return (
              <div
                key={p.key}
                className="flex h-full flex-1 items-end justify-center"
              >
                <motion.span
                  initial={reduceMotion ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.012, 0.25) }}
                  className={`block w-full origin-bottom transition-all duration-150 ${
                    variant === 'activity' ? 'rounded-t-sm' : 'max-w-10 rounded-t-md'
                  }`}
                  style={{
                    height: `${Math.max(pct, p.value > 0 ? 3 : 0)}%`,
                    background,
                    opacity: dimmed ? 0.35 : 1,
                    transform: isHover && !reduceMotion ? 'translateY(-2px)' : undefined,
                    boxShadow: isHover
                      ? '0 0 0 1px rgba(255, 255, 255, 0.65), 0 0 14px rgba(192, 132, 252, 0.55)'
                      : isLast && !isPeak
                        ? '0 0 0 1px rgba(192, 132, 252, 0.55)'
                        : undefined,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Capa accesible interactiva */}
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
      <SmartXAxis points={points} align="band" />
    </div>
  )
}
