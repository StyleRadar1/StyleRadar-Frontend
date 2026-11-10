import { describe, it, expect } from 'vitest'
import { MOCK_PAYMENTS } from '../mocks/payments'
import type { PaymentDto, PaymentFiltersDto } from '../types/payment.dto'

/** Replica local de la lógica de filtros del servicio (para testear sin async). */
function applyFilters(payments: PaymentDto[], f: PaymentFiltersDto): PaymentDto[] {
  return payments.filter((p) => {
    if (f.status && p.status !== f.status) return false
    if (f.planId && p.planId !== f.planId) return false
    if (f.dateFrom && p.date < f.dateFrom) return false
    if (f.dateTo && p.date > f.dateTo) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!`${p.id} ${p.userName} ${p.userEmail}`.toLowerCase().includes(q)) return false
    }
    return true
  })
}

describe('filtros de pagos', () => {
  it('filtra por estado aprobado', () => {
    const result = applyFilters(MOCK_PAYMENTS, { status: 'aprobado' })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((p) => p.status === 'aprobado')).toBe(true)
  })

  it('filtra por plan plus', () => {
    const result = applyFilters(MOCK_PAYMENTS, { planId: 'plus' })
    expect(result.every((p) => p.planId === 'plus')).toBe(true)
  })

  it('filtra por búsqueda de nombre', () => {
    const first = MOCK_PAYMENTS[0]
    const result = applyFilters(MOCK_PAYMENTS, { search: first.userName })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((p) => p.userName === first.userName)).toBe(true)
  })

  it('filtra por rango de fechas', () => {
    const result = applyFilters(MOCK_PAYMENTS, { dateFrom: '2026-09-10', dateTo: '2026-09-20' })
    expect(result.every((p) => p.date >= '2026-09-10' && p.date <= '2026-09-20')).toBe(true)
  })

  it('sin filtros devuelve todo', () => {
    expect(applyFilters(MOCK_PAYMENTS, {}).length).toBe(MOCK_PAYMENTS.length)
  })
})
