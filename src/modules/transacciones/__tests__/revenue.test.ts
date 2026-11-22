import { describe, it, expect } from 'vitest'
import { RADAR_PLUS_PRICE, STORE_SUBSCRIPTION_PRICE } from '../constants/plansByRole'
import { calcRevenue } from '../services/paymentService'
import type { PaymentDto } from '../types/payment.dto'

const base: Omit<PaymentDto, 'id' | 'amount' | 'status'> = {
  userId: 'u1', suscriptorId: 'u1', userRole: 'BUYER',
  planId: 'plus', planName: 'Radar+', method: 'Mercado Pago', date: '2026-09-01',
}

function pay(id: string, amount: number, status: PaymentDto['status']): PaymentDto {
  return { ...base, id, pagoId: id, valor: amount, amount, status }
}

describe('calcRevenue', () => {
  it('suma solo los aprobados', () => {
    const payments = [
      pay('1', RADAR_PLUS_PRICE, 'aprobado'),
      pay('2', RADAR_PLUS_PRICE, 'aprobado'),
      pay('3', RADAR_PLUS_PRICE, 'rechazado'),
    ]
    expect(calcRevenue(payments)).toBe(RADAR_PLUS_PRICE * 2)
  })

  it('ignora pendientes y rechazados', () => {
    const payments = [pay('1', STORE_SUBSCRIPTION_PRICE, 'pendiente'), pay('2', RADAR_PLUS_PRICE, 'rechazado')]
    expect(calcRevenue(payments)).toBe(0)
  })

  it('devuelve 0 con lista vacía', () => {
    expect(calcRevenue([])).toBe(0)
  })

  it('ingresos aprobados en caso mixto (usuarios y tiendas)', () => {
    const payments = [
      pay('1', RADAR_PLUS_PRICE, 'aprobado'),
      pay('2', STORE_SUBSCRIPTION_PRICE, 'aprobado'),
      pay('3', RADAR_PLUS_PRICE, 'pendiente'),
      pay('4', RADAR_PLUS_PRICE, 'rechazado'),
    ]
    expect(calcRevenue(payments)).toBe(RADAR_PLUS_PRICE + STORE_SUBSCRIPTION_PRICE)
  })
})
