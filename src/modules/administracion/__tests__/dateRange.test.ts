import { describe, expect, it } from 'vitest'
import { formatDateRangeLabel, getShortcutRange, selectRangeDay } from '../utils/dateRange'

describe('dateRange utils', () => {
  it('invierte el rango si el segundo clic es anterior y formatea la etiqueta', () => {
    const first = selectRangeDay({}, '2026-11-25')
    expect(first).toEqual({ from: '2026-11-25', to: undefined })

    const second = selectRangeDay(first, '2026-11-16')
    expect(second).toEqual({ from: '2026-11-16', to: '2026-11-25' })
    expect(formatDateRangeLabel(second.from, second.to)).toBe('16 Nov – 25 Nov 2026')
    expect(formatDateRangeLabel()).toBe('Todas las fechas')
  })

  it('calcula atajos sin desfase UTC', () => {
    const ref = new Date(2026, 10, 26) // 26 de noviembre de 2026
    expect(getShortcutRange('today', ref)).toEqual({ from: '2026-11-26', to: '2026-11-26' })
    expect(getShortcutRange('last7', ref)).toEqual({ from: '2026-11-20', to: '2026-11-26' })
    expect(getShortcutRange('thisMonth', ref)).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(getShortcutRange('lastMonth', ref)).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(getShortcutRange('all', ref)).toEqual({})
  })
})
