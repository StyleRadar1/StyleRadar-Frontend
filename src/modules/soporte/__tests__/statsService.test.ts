import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/configs/env'
import { apiClient } from '@/modules/core/api/apiClient'
import { statsService } from '../services/statsService'

describe('statsService sin mocks (contrato 9 métricas ms-estadisticas)', () => {
  let prevMocks: boolean

  beforeEach(() => {
    prevMocks = env.useMocks
    env.useMocks = false
  })

  afterEach(() => {
    env.useMocks = prevMocks
    vi.restoreAllMocks()
  })

  it('usa los endpoints canónicos de summary/totals, time-series, distributions y health', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} } as never)

    await statsService.getSummaryTotal('FOUNDATION_GARMENTS_RECEIVED')
    await statsService.getTimeSeries('PLATFORM_USER_REGISTRATIONS', { startDate: '2026-11-01', endDate: '2026-11-24', granularity: 'DAY' })
    await statsService.getDistribution('STORE_INVENTORY_BY_STATE')
    await statsService.getHealth()

    expect(getSpy).toHaveBeenCalledWith('/api/v1/statistics/summary/totals/FOUNDATION_GARMENTS_RECEIVED')
    expect(getSpy).toHaveBeenCalledWith('/api/v1/statistics/time-series/PLATFORM_USER_REGISTRATIONS', {
      params: { startDate: '2026-11-01', endDate: '2026-11-24', granularity: 'DAY' },
    })
    expect(getSpy).toHaveBeenCalledWith('/api/v1/statistics/distributions/STORE_INVENTORY_BY_STATE')
    expect(getSpy).toHaveBeenCalledWith('/api/v1/health')
  })

  it('getFoundationStats, getStoreInventory y getAdminAccounts consumen solo rutas vigentes', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/api/v1/statistics/summary/totals/FOUNDATION_GARMENTS_RECEIVED') {
        return { data: { total: 42 } } as never
      }
      if (url === '/api/v1/statistics/distributions/STORE_INVENTORY_BY_STATE') {
        return { data: { disponibles: 10, ultimasUnidades: 3, agotadas: 1, total: 14 } } as never
      }
      if (url === '/api/v1/statistics/distributions/PLATFORM_BUYERS_BY_PLAN') {
        return { data: { RADAR: 50, RADAR_PLUS: 12 } } as never
      }
      if (url === '/api/v1/statistics/distributions/PLATFORM_STORES_BY_PLAN') {
        return { data: { BASICO: 8, DESTACADO: 4 } } as never
      }
      return { data: {} } as never
    })

    const fStats = await statsService.getFoundationStats()
    const sInv = await statsService.getStoreInventory()
    const accounts = await statsService.getAdminAccounts()

    expect(fStats.totalPrendasRecibidas).toBe(42)
    expect(sInv).toMatchObject({ disponibles: 10, ultimasUnidades: 3, agotadas: 1, total: 14 })
    expect(accounts.compradores.radarPlus).toBe(12)
    expect(accounts.almacenes).toEqual({ basico: 8, destacado: 4 })

    const calledUrls = getSpy.mock.calls.map(([u]) => u)
    expect(calledUrls).not.toContain('/api/v1/statistics/summary/store')
    expect(calledUrls).not.toContain('/api/v1/statistics/summary/foundation')
    expect(calledUrls).not.toContain('/api/v1/statistics/summary/admin')
    expect(calledUrls).not.toContain('/api/v1/statistics/summary/income')
    expect(calledUrls).not.toContain('/api/v1/statistics/time-series/foundation-monthly')
    expect(calledUrls).not.toContain('/api/v1/statistics/realtime')
  })
})
