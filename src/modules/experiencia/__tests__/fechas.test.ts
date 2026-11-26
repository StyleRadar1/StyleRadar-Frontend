import { describe, expect, it } from 'vitest'
import { formatDay } from '../utils/dates'

describe('formatDay', () => {
  it('formatea una fecha AAAA-MM-DD sin correrla por la zona horaria', () => {
    expect(formatDay('2026-11-26')).toBe(new Date(2026, 10, 26).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }))
  })

  it('acepta la fecha con hora que envía el back para el comprobante', () => {
    const texto = formatDay('2026-11-26T15:42:10.123')
    expect(texto).not.toMatch(/invalid/i)
    expect(texto).toBe(new Date('2026-11-26T15:42:10.123').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }))
  })

  it('no muestra Invalid Date cuando la fecha falta o no se puede leer', () => {
    expect(formatDay(undefined)).toBe('sin fecha')
    expect(formatDay('')).toBe('sin fecha')
    expect(formatDay('no-es-fecha')).toBe('sin fecha')
  })
})
