import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { formatFullDateSpanish, parseIsoDateLocal } from '../../utils/statsFormat'
import type { SeriesPoint } from './AreaChart'

const DIAS_CABECERA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

function heatCellBg(value: number, max: number): string {
  if (value <= 0 || max <= 0) return 'rgba(255, 255, 255, 0.04)'
  const ratio = Math.min(1, value / max)
  if (ratio < 0.25) return 'rgba(157, 92, 255, 0.22)'
  if (ratio < 0.5) return 'rgba(157, 92, 255, 0.44)'
  if (ratio < 0.75) return 'rgba(157, 92, 255, 0.68)'
  return 'rgba(192, 132, 252, 0.92)'
}

function pickDefaultKey(points: SeriesPoint[]): string | null {
  if (points.length === 0) return null
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i].value > 0) return points[i].key
  }
  return points[points.length - 1].key
}

/**
 * Calendario compacto del mes (L M X J V S D) + panel de detalle en glass del día seleccionado.
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
  const reduceMotion = useReducedMotion()
  const monthSignature = points[0]?.key.slice(0, 7) ?? 'empty'
  const [selection, setSelection] = useState<{ month: string; key: string } | null>(null)
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const selectedKey = useMemo(() => {
    if (selection && selection.month === monthSignature && points.some((p) => p.key === selection.key)) {
      return selection.key
    }
    return pickDefaultKey(points)
  }, [selection, monthSignature, points])

  const maxVal = Math.max(...points.map((p) => p.value), 0)
  const totalMonth = points.reduce((sum, p) => sum + p.value, 0)
  const avgDaily = points.length > 0 ? totalMonth / points.length : 0

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

  const selectedIdx = points.findIndex((p) => p.key === selectedKey)
  const selectedPoint = selectedIdx >= 0 ? points[selectedIdx] : null

  const selectByIndex = (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= points.length) return
    const next = points[nextIdx]
    setSelection({ month: monthSignature, key: next.key })
    cellRefs.current[next.key]?.focus()
  }

  const handleCellKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      selectByIndex(idx + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      selectByIndex(idx - 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectByIndex(idx + 7)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectByIndex(idx - 7)
    }
  }

  const sharePct =
    selectedPoint && totalMonth > 0
      ? ((selectedPoint.value / totalMonth) * 100).toFixed(1)
      : '0.0'

  const avgComparison = (() => {
    if (!selectedPoint) return ''
    const diff = selectedPoint.value - avgDaily
    if (Math.abs(diff) < 0.05) {
      return `Igual al promedio diario del mes (${avgDaily.toFixed(1)})`
    }
    return diff > 0
      ? `Por encima del promedio diario (${avgDaily.toFixed(1)})`
      : `Por debajo del promedio diario (${avgDaily.toFixed(1)})`
  })()

  const isMaxDay = Boolean(selectedPoint && maxVal > 0 && selectedPoint.value === maxVal)

  return (
    <div
      className="grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr] md:items-start"
      role="region"
      aria-label={`${title} en calendario`}
    >
      {/* Izquierda: calendario compacto */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--sr-text-muted,#8b86a4)]">
          {DIAS_CABECERA.map((d) => (
            <span key={d} className="w-7">
              {d}
            </span>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 gap-1">
              {week.map((cell, dIdx) => {
                if (!cell) {
                  return <div key={`empty-${wIdx}-${dIdx}`} className="h-7 w-7" aria-hidden="true" />
                }
                const parsed = parseIsoDateLocal(cell.key)
                const dayNum = parsed ? parsed.getDate() : cell.axisLabel
                const isSelected = cell.key === selectedKey
                const fullDate = formatFullDateSpanish(cell.key)
                const pointIndex = points.findIndex((p) => p.key === cell.key)

                return (
                  <button
                    key={cell.key}
                    ref={(el) => {
                      cellRefs.current[cell.key] = el
                    }}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${fullDate}: ${formatValue(cell.value)} ${seriesLabel.toLowerCase()}`}
                    onClick={() => setSelection({ month: monthSignature, key: cell.key })}
                    onKeyDown={(e) => handleCellKeyDown(e, pointIndex)}
                    className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-accent,#9d5cff)] ${
                      isSelected ? 'ring-2 ring-[#c084fc]' : ''
                    }`}
                    style={{
                      backgroundColor: heatCellBg(cell.value, maxVal),
                      borderColor: isSelected
                        ? 'rgba(255, 255, 255, 0.85)'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected
                        ? '0 0 12px rgba(192, 132, 252, 0.55)'
                        : undefined,
                    }}
                  >
                    {dayNum}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Escala compacta */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--sr-text-muted,#8b86a4)]">
          <span>Menos</span>
          <div className="flex items-center gap-1">
            {[0, 0.2, 0.45, 0.7, 1].map((r, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-[3px] border border-white/10"
                style={{ backgroundColor: heatCellBg(r * (maxVal || 1), maxVal || 1) }}
              />
            ))}
          </div>
          <span>Más</span>
        </div>
      </div>

      {/* Derecha: panel de detalle en glass del día seleccionado */}
      <div className="glass-subpanel p-5">
        {selectedPoint ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPoint.key}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[var(--sr-text-primary,#f8fafc)]">
                  {formatFullDateSpanish(selectedPoint.key)}
                </p>
                {isMaxDay && (
                  <span className="glass-pill is-active px-2.5 py-0.5 text-[11px] font-semibold">
                    Día con más registros del mes
                  </span>
                )}
              </div>

              {selectedPoint.value > 0 ? (
                <div className="flex items-baseline gap-2.5">
                  <span className="text-4xl font-extrabold tabular-nums text-[var(--sr-text-primary,#f8fafc)]">
                    {formatValue(selectedPoint.value)}
                  </span>
                  <span className="text-sm font-medium text-[var(--sr-text-muted,#8b86a4)]">
                    registros nuevos
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-[var(--sr-text-muted,#8b86a4)]">
                  Sin registros nuevos este día (0)
                </p>
              )}

              <div className="space-y-1 border-t border-white/10 pt-3 text-xs text-[var(--sr-text-secondary,#b8b3ce)]">
                <p>
                  Representa el <b className="tabular-nums text-[var(--sr-text-primary,#f8fafc)]">{sharePct}%</b> del total del mes ({formatValue(totalMonth)}).
                </p>
                <p>{avgComparison}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-sm text-[var(--sr-text-muted,#8b86a4)]">
            Selecciona un día para ver su detalle.
          </p>
        )}
      </div>
    </div>
  )
}
