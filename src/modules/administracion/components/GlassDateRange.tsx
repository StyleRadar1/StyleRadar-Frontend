import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { formatDateLongSpanish, parseIsoDateLocal } from '@/modules/soporte/utils/statsFormat'
import {
  addDaysIso,
  buildMonthGrid,
  formatCalendarMonthTitle,
  formatDateRangeLabel,
  getShortcutRange,
  selectRangeDay,
  toIsoLocal,
  type DateRangeValue,
  type DateShortcutKey,
} from '../utils/dateRange'
import '@/styles/admin-glass.css'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

const SHORTCUTS: Array<{ key: DateShortcutKey; label: string }> = [
  { key: 'today', label: 'Hoy' },
  { key: 'last7', label: 'Últimos 7 días' },
  { key: 'last30', label: 'Últimos 30 días' },
  { key: 'thisMonth', label: 'Este mes' },
  { key: 'lastMonth', label: 'Mes pasado' },
  { key: 'all', label: 'Todas' },
]

interface GlassDateRangeProps {
  from?: string
  to?: string
  onChange: (next: DateRangeValue) => void
  label?: string
}

/**
 * Selector de rango de fechas en estilo glass con atajos rápidos y calendario compacto (lunes a domingo).
 */
export function GlassDateRange({ from, to, onChange, label = 'Filtrar por rango de fechas' }: GlassDateRangeProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRangeValue>({ from, to })
  const [todayIso] = useState(() => toIsoLocal(new Date()))

  const [viewYear, setViewYear] = useState(() => (parseIsoDateLocal(from) ?? parseIsoDateLocal(to) ?? new Date()).getFullYear())
  const [viewMonth, setViewMonth] = useState(() => (parseIsoDateLocal(from) ?? parseIsoDateLocal(to) ?? new Date()).getMonth())

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const popoverId = useId()

  const summaryLabel = formatDateRangeLabel(from, to)

  const openPopover = () => {
    setDraft({ from, to })
    const anchor = parseIsoDateLocal(from) ?? parseIsoDateLocal(to) ?? new Date()
    setViewYear(anchor.getFullYear())
    setViewMonth(anchor.getMonth())
    setOpen(true)
  }

  const closePopover = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        closePopover(false)
      }
    }
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closePopover(true)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const stepMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const handleShortcut = (key: DateShortcutKey) => {
    const next = getShortcutRange(key)
    setDraft(next)
    const anchor = parseIsoDateLocal(next.from) ?? parseIsoDateLocal(todayIso)!
    setViewYear(anchor.getFullYear())
    setViewMonth(anchor.getMonth())
  }

  const handleApply = () => {
    if (draft.from && !draft.to) {
      onChange({ from: draft.from, to: draft.from })
    } else {
      onChange({ from: draft.from, to: draft.to })
    }
    closePopover(true)
  }

  const handleClear = () => {
    setDraft({})
    onChange({})
    closePopover(true)
  }

  const handleDayKeyDown = (iso: string, e: KeyboardEvent<HTMLButtonElement>) => {
    let delta = 0
    if (e.key === 'ArrowRight') delta = 1
    else if (e.key === 'ArrowLeft') delta = -1
    else if (e.key === 'ArrowDown') delta = 7
    else if (e.key === 'ArrowUp') delta = -7
    if (delta === 0) return

    e.preventDefault()
    const targetIso = addDaysIso(iso, delta)
    const targetDate = parseIsoDateLocal(targetIso)
    if (targetDate && (targetDate.getFullYear() !== viewYear || targetDate.getMonth() !== viewMonth)) {
      setViewYear(targetDate.getFullYear())
      setViewMonth(targetDate.getMonth())
    }
    requestAnimationFrame(() => dayRefs.current[targetIso]?.focus())
  }

  const rangeStart = draft.from
  const rangeEnd = draft.to ?? draft.from

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`${label}: ${summaryLabel}`}
        onClick={() => (open ? closePopover(false) : openPopover())}
        className={`glass-pill cursor-pointer px-3.5 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violeta-claro ${
          from || to ? 'is-active' : ''
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 shrink-0 opacity-80">
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
        <span className="whitespace-nowrap">{summaryLabel}</span>
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Seleccionar rango de fechas"
          className="glass-popover absolute right-0 z-30 mt-2 w-[min(92vw,31rem)] p-4 sm:w-[31rem]"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Atajos rápidos (arriba en móvil, izquierda en escritorio) */}
            <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3 sm:w-36 sm:shrink-0 sm:flex-col sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleShortcut(s.key)}
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-blanco focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violeta-claro"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Calendario compacto */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 pb-2">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  onClick={() => stepMonth(-1)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-white/15 bg-white/5 text-sm text-white/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violeta-claro"
                >
                  ‹
                </button>
                <span className="text-xs font-bold tracking-wide text-blanco">
                  {formatCalendarMonthTitle(viewYear, viewMonth)}
                </span>
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() => stepMonth(1)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-white/15 bg-white/5 text-sm text-white/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violeta-claro"
                >
                  ›
                </button>
              </div>

              <div role="grid" aria-label={formatCalendarMonthTitle(viewYear, viewMonth)}>
                <div role="row" className="grid grid-cols-7 gap-1 pb-1 text-center text-[10px] font-bold uppercase text-white/50">
                  {WEEKDAYS.map((w) => (
                    <span key={w} role="columnheader" className="py-1">
                      {w}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((cell) => {
                    const isEdge = cell.iso === rangeStart || cell.iso === rangeEnd
                    const isInRange = Boolean(rangeStart && rangeEnd && cell.iso >= rangeStart && cell.iso <= rangeEnd)
                    const isToday = cell.iso === todayIso
                    return (
                      <button
                        key={cell.iso}
                        ref={(el) => { dayRefs.current[cell.iso] = el }}
                        type="button"
                        aria-label={formatDateLongSpanish(cell.iso)}
                        aria-pressed={isEdge || isInRange}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => setDraft((prev) => selectRangeDay(prev, cell.iso))}
                        onKeyDown={(e) => handleDayKeyDown(cell.iso, e)}
                        className={`glass-date-day h-8 w-full cursor-pointer text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violeta-claro ${
                          cell.inMonth ? 'text-white/90' : 'text-white/35'
                        } ${isInRange ? 'is-in-range' : ''} ${isEdge ? 'is-edge' : ''} ${isToday ? 'is-today' : ''}`}
                      >
                        {cell.day}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violeta-claro"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="cursor-pointer rounded-xl border border-violeta-claro/60 bg-violeta/70 px-3.5 py-1.5 text-xs font-semibold text-blanco transition hover:bg-violeta focus-visible:outline-2 focus-visible:outline-violeta-claro"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
