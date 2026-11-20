import { describe, it, expect } from 'vitest'
import { calcRevenue } from '../services/paymentService'
import type { PaymentDto } from '../types/payment.dto'

const base: Omit<PaymentDto, 'id' | 'amount' | 'status'> = {
  userId: 'u1', suscriptorId: 'u1', userRole: 'COMPRADOR',
  planId: 'plus', planName: 'Radar+', method: 'Mercado Pago', date: '2026-09-01',
}

function pay(id: string, amount: number, status: PaymentDto['status']): PaymentDto {
  return { ...base, id, pagoId: id, valor: amount, amount, status }
}

describe('calcRevenue', () => {
  it('suma solo los aprobados', () => {
    const payments = [pay('1', 14_900, 'aprobado'), pay('2', 14_900, 'aprobado'), pay('3', 14_900, 'rechazado')]
    expect(calcRevenue(payments)).toBe(29_800)
  })

  it('ignora pendientes y rechazados', () => {
    const payments = [pay('1', 89_000, 'pendiente'), pay('2', 14_900, 'rechazado')]
    expect(calcRevenue(payments)).toBe(0)
  })

  it('devuelve 0 con lista vacía', () => {
    expect(calcRevenue([])).toBe(0)
  })

  it('ingresos aprobados en caso mixto (usuarios y tiendas)', () => {
    const payments = [
      pay('1', 14_900, 'aprobado'),
      pay('2', 89_000, 'aprobado'),
      pay('3', 14_900, 'pendiente'),
      pay('4', 14_900, 'rechazado'),
    ]
    expect(calcRevenue(payments)).toBe(14_900 + 89_000)
  })
})
