/**
 * Utilidades de formateo de fechas y cálculo de variaciones para ms-estadisticas.
 * Nunca usa `new Date("YYYY-MM-DD")` ni `toLocaleDateString` para evitar desfases de zona horaria.
 */

const MESES_CORTO = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const

const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

const DIAS_SEMANA_LARGO = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
] as const

export function parseIsoDateLocal(raw?: string | null): Date | null {
  if (!raw) return null
  const parts = raw.trim().slice(0, 10).split('-')
  if (parts.length !== 3) return null
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day)
}

/** Formatea YYYY-MM-DD como "Noviembre 2026" (mes completo capitalizado). */
export function formatMonthShort(raw?: string | null): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return raw ?? ''
  return `${MESES_LARGO[date.getMonth()]} ${date.getFullYear()}`
}

/** Formatea YYYY-MM-DD como "Noviembre de 2026" (mes completo capitalizado). */
export function formatMonthLong(raw?: string | null): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return ''
  return `${MESES_LARGO[date.getMonth()]} de ${date.getFullYear()}`
}

/** Abreviatura capitalizada para ticks densos del eje X mensual ("Nov"). */
export function formatMonthAbbr(raw?: string | null): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return raw ?? ''
  return MESES_CORTO[date.getMonth()]
}

/** Formatea YYYY-MM-DD como "01 Nov" para ticks densos del eje X diario. */
export function formatDayShort(raw?: string | null): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return raw ?? ''
  const day = String(date.getDate()).padStart(2, '0')
  return `${day} ${MESES_CORTO[date.getMonth()]}`
}

/** Formatea YYYY-MM-DD como "Martes 25 de Noviembre de 2026" (día y mes capitalizados). */
export function formatFullDateSpanish(raw?: string | null): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return raw ?? ''
  const weekday = DIAS_SEMANA_LARGO[date.getDay()]
  const month = MESES_LARGO[date.getMonth()]
  return `${weekday} ${date.getDate()} de ${month} de ${date.getFullYear()}`
}

/** Devuelve "YYYY-MM" del mes calendario actual en hora local. */
export function getCurrentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Calcula `{ startDate, endDate }` (YYYY-MM-DD) para un mes "YYYY-MM". */
export function monthRangeFromYearMonth(yearMonth: string): { startDate: string; endDate: string } {
  const [yStr, mStr] = yearMonth.split('-')
  const year = Number(yStr)
  const month = Number(mStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return monthRangeFromYearMonth(getCurrentYearMonth())
  }
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

/** Genera los últimos `count` meses calendario como opciones `{ value: 'YYYY-MM', label: 'Noviembre 2026' }`. */
export function getRecentMonthOptions(count = 6): { value: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: count }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - idx, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${MESES_LARGO[d.getMonth()]} ${d.getFullYear()}`
    return { value, label }
  })
}

export interface RealDelta {
  pct: number
  direction: 'up' | 'down' | 'flat'
  label: string
}

/**
 * Calcula variación porcentual real entre dos valores consecutivos de una serie.
 * Devuelve null si el periodo anterior es 0 o negativo (no calculable).
 */
export function calcRealDelta(
  current: number,
  previous: number,
  previousLabel?: string,
): RealDelta | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null
  const raw = ((current - previous) / previous) * 100
  const pct = Number(Math.abs(raw).toFixed(1))
  const direction: RealDelta['direction'] = raw > 0.05 ? 'up' : raw < -0.05 ? 'down' : 'flat'
  const suffix = previousLabel ? ` vs. ${previousLabel}` : ' vs. mes anterior'
  return { pct, direction, label: `${pct}%${suffix}` }
}
