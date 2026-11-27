import { MESES_CORTO, MESES_LARGO, parseIsoDateLocal } from '@/modules/soporte/utils/statsFormat'

export interface DateRangeValue {
  from?: string
  to?: string
}

export type DateShortcutKey = 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'all'

export function toIsoLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysIso(iso: string, delta: number): string {
  const d = parseIsoDateLocal(iso)
  if (!d) return iso
  d.setDate(d.getDate() + delta)
  return toIsoLocal(d)
}

export function getShortcutRange(key: DateShortcutKey, today = new Date()): DateRangeValue {
  const todayIso = toIsoLocal(today)
  switch (key) {
    case 'today':
      return { from: todayIso, to: todayIso }
    case 'last7':
      return { from: addDaysIso(todayIso, -6), to: todayIso }
    case 'last30':
      return { from: addDaysIso(todayIso, -29), to: todayIso }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { from: toIsoLocal(start), to: toIsoLocal(end) }
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: toIsoLocal(start), to: toIsoLocal(end) }
    }
    case 'all':
      return {}
  }
}

export function selectRangeDay(current: DateRangeValue, clickedIso: string): DateRangeValue {
  if (!current.from || (current.from && current.to)) {
    return { from: clickedIso, to: undefined }
  }
  if (clickedIso < current.from) {
    return { from: clickedIso, to: current.from }
  }
  return { from: current.from, to: clickedIso }
}

function formatShortDay(iso: string, includeYear: boolean): string {
  const d = parseIsoDateLocal(iso)
  if (!d) return iso
  const base = `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`
  return includeYear ? `${base} ${d.getFullYear()}` : base
}

export function formatDateRangeLabel(from?: string, to?: string): string {
  if (!from && !to) return 'Todas las fechas'
  if (from && to) {
    if (from === to) return formatShortDay(from, true)
    const d1 = parseIsoDateLocal(from)
    const d2 = parseIsoDateLocal(to)
    const sameYear = d1 && d2 && d1.getFullYear() === d2.getFullYear()
    return `${formatShortDay(from, !sameYear)} – ${formatShortDay(to, true)}`
  }
  if (from) return `Desde ${formatShortDay(from, true)}`
  return `Hasta ${formatShortDay(to!, true)}`
}

export function formatCalendarMonthTitle(year: number, monthIndex: number): string {
  return `${MESES_LARGO[monthIndex]} ${year}`
}

/** Devuelve las celdas (lunes a domingo) del mes indicado como `{ iso, day, inMonth }[]`. */
export function buildMonthGrid(year: number, monthIndex: number): Array<{ iso: string; day: number; inMonth: boolean }> {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const lastOfMonth = new Date(year, monthIndex + 1, 0)
  // Lunes = 0 ... Domingo = 6
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const totalCells = Math.ceil((startOffset + lastOfMonth.getDate()) / 7) * 7
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = []
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, monthIndex, 1 - startOffset + i)
    cells.push({
      iso: toIsoLocal(d),
      day: d.getDate(),
      inMonth: d.getMonth() === monthIndex && d.getFullYear() === year,
    })
  }
  return cells
}
