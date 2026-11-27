import { useMemo, useState } from 'react'
import { parseIsoDateLocal } from '../../utils/statsFormat'
import type { SeriesPoint } from './AreaChart'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const
const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

function formatFullSpanishDate(raw: string): string {
  const d = parseIsoDateLocal(raw)
  if (!d) return raw
  return `${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`
}

function heatCellBg(value: number, max: number): string {
  if (value <= 0 || max <= 0) return 'rgba(255, 255, 255, 0.04)'
  const ratio = Math.min(1, value / max)
  if (ratio < 0.25) return 'rgba(157, 92, 255, 0.22)'
  if (ratio < 0.5) return 'rgba(157, 92, 255, 0.44)'
  if (ratio < 0.75) return 'rgba(157, 92, 255, 0.68)'
  return 'rgba(192, 132, 252, 0.92)'
}

/**
 * Mapa de calor de calendario (semanas × días del mes).
 * Sin backdrop-filter en las celdas por rendimiento.
 */
export function CalendarHeatmap({
  title,
  seriesLabel,
  points,
  formatValue,
}: {
  title: string
  seriesLabel: string
  points: SeriesPoint[]
  formatValue: (v: number) => string
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const maxVal = Math.max(...points.map((p) => p.value), 0)

  const weeks = useMemo(() => {
    if (points.length === 0) return [] as (SeriesPoint | null)[][]
    const firstDate = parseIsoDateLocal(points[0].key)
    const leadingEmpty = firstDate ? (firstDate.getDay() + 6) % 7 : 0
    const cells: (SeriesPoint | null)[] = [
      ...Array.from({ length: leadingEmpty }, () => null),
      ...points,
    ]
    while (cells.length % 7 !== 0) cells.push(null)
    const rows: (SeriesPoint | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7))
    }
    return rows
  }, [points])

  return (
    <div className="space-y-3" role="region" aria-label={`${title} en calendario`}>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-[var(--sr-text-muted,#8b86a4)]">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="space-y-1.5">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7 gap-1.5">
            {week.map((cell, dIdx) => {
              if (!cell) {
                return <div key={`empty-${wIdx}-${dIdx}`} className="h-9 rounded-lg" aria-hidden="true" />
              }
              const parsed = parseIsoDateLocal(cell.key)
              const dayNum = parsed ? parsed.getDate() : cell.axisLabel
              const isHover = hoverKey === cell.key
              const dimmed = hoverKey !== null && !isHover
              const fullDate = formatFullSpanishDate(cell.key)

              return (
                <div
                  key={cell.key}
                  tabIndex={0}
                  role="button"
                  aria-label={`${fullDate}: ${seriesLabel} ${formatValue(cell.value)}`}
                  onMouseEnter={() => setHoverKey(cell.key)}
                  onMouseLeave={() => setHoverKey(null)}
                  onFocus={() => setHoverKey(cell.key)}
                  onBlur={() => setHoverKey(null)}
                  className="relative flex h-9 cursor-pointer items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-accent,#9d5cff)]"
                  style={{
                    backgroundColor: heatCellBg(cell.value, maxVal),
                    borderColor: isHover
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(255, 255, 255, 0.1)',
                    opacity: dimmed ? 0.4 : 1,
                    transform: isHover ? 'translateY(-1px)' : undefined,
                  }}
                >
                  <span>{dayNum}</span>
                  {isHover && (
                    <span
                      role="tooltip"
                      className={`glass-tooltip pointer-events-none absolute bottom-full z-20 mb-2 whitespace-nowrap px-3 py-2 text-xs ${
                        dIdx >= 4 ? 'right-0' : 'left-0'
                      }`}
                    >
                      <b className="block font-semibold">{fullDate}</b>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="text-[var(--sr-text-muted,#8b86a4)]">{seriesLabel}</span>
                        <b className="tabular-nums">{formatValue(cell.value)}</b>
                      </span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Escala de intensidad */}
      <div className="flex items-center justify-end gap-1.5 pt-1 text-[11px] text-[var(--sr-text-muted,#8b86a4)]">
        <span>Menos</span>
        {[0, 0.2, 0.45, 0.7, 1].map((r, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="h-3 w-3 rounded border border-white/10"
            style={{ backgroundColor: heatCellBg(r * (maxVal || 1), maxVal || 1) }}
          />
        ))}
        <span>Más</span>
      </div>
    </div>
  )
}
