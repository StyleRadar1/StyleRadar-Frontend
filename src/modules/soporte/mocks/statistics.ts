import { ApiError } from '@/modules/core/api/apiClient'
import type {
  BuyerPlanCategoryCode,
  DistributionResponse,
  InventoryCategoryCode,
  MetricTotalResponse,
  StorePlanCategoryCode,
  TimeSeriesResponse,
} from '../types/statistics.dto'

export type MockStatsEstado = 'NORMAL' | 'VACIO' | 'ERROR' | '401' | '403'

export const MOCK_STORE_INVENTORY_BY_STATE: DistributionResponse<InventoryCategoryCode> = {
  metricCode: 'STORE_INVENTORY_BY_STATE',
  scopeType: 'STORE',
  scopeId: 'store-demo-1',
  entries: [
    { categoryCode: 'AVAILABLE', count: 45, percentage: 75.0 },
    { categoryCode: 'LOW_STOCK', count: 9, percentage: 15.0 },
    { categoryCode: 'OUT_OF_STOCK', count: 6, percentage: 10.0 },
  ],
}

export const MOCK_STORE_INVENTORY_BY_STATE_EMPTY: DistributionResponse<InventoryCategoryCode> = {
  metricCode: 'STORE_INVENTORY_BY_STATE',
  scopeType: 'STORE',
  scopeId: 'store-demo-1',
  entries: [
    { categoryCode: 'AVAILABLE', count: 0, percentage: 0.0 },
    { categoryCode: 'LOW_STOCK', count: 0, percentage: 0.0 },
    { categoryCode: 'OUT_OF_STOCK', count: 0, percentage: 0.0 },
  ],
}

export const MOCK_FOUNDATION_GARMENTS_RECEIVED: MetricTotalResponse = {
  metricCode: 'FOUNDATION_GARMENTS_RECEIVED',
  scopeType: 'FOUNDATION',
  scopeId: 'foundation-demo-1',
  period: null,
  total: 128,
}

export const MOCK_FOUNDATION_GARMENTS_RECEIVED_EMPTY: MetricTotalResponse = {
  metricCode: 'FOUNDATION_GARMENTS_RECEIVED',
  scopeType: 'FOUNDATION',
  scopeId: 'foundation-demo-1',
  period: null,
  total: 0,
}

export const MOCK_PLATFORM_BUYERS_BY_PLAN: DistributionResponse<BuyerPlanCategoryCode> = {
  metricCode: 'PLATFORM_BUYERS_BY_PLAN',
  scopeType: 'PLATFORM',
  scopeId: null,
  entries: [
    { categoryCode: 'PLAN_RADAR', count: 820, percentage: 89.13 },
    { categoryCode: 'PLAN_RADAR_PLUS', count: 100, percentage: 10.87 },
  ],
}

export const MOCK_PLATFORM_BUYERS_BY_PLAN_EMPTY: DistributionResponse<BuyerPlanCategoryCode> = {
  metricCode: 'PLATFORM_BUYERS_BY_PLAN',
  scopeType: 'PLATFORM',
  scopeId: null,
  entries: [
    { categoryCode: 'PLAN_RADAR', count: 0, percentage: 0.0 },
    { categoryCode: 'PLAN_RADAR_PLUS', count: 0, percentage: 0.0 },
  ],
}

export const MOCK_PLATFORM_STORES_BY_PLAN: DistributionResponse<StorePlanCategoryCode> = {
  metricCode: 'PLATFORM_STORES_BY_PLAN',
  scopeType: 'PLATFORM',
  scopeId: null,
  entries: [
    { categoryCode: 'PLAN_STORE_MONTHLY', count: 34, percentage: 85.0 },
    { categoryCode: 'SUSPENDED', count: 6, percentage: 15.0 },
  ],
}

export const MOCK_PLATFORM_STORES_BY_PLAN_EMPTY: DistributionResponse<StorePlanCategoryCode> = {
  metricCode: 'PLATFORM_STORES_BY_PLAN',
  scopeType: 'PLATFORM',
  scopeId: null,
  entries: [
    { categoryCode: 'PLAN_STORE_MONTHLY', count: 0, percentage: 0.0 },
    { categoryCode: 'SUSPENDED', count: 0, percentage: 0.0 },
  ],
}

export const MOCK_PLATFORM_SUBSCRIPTION_REVENUE: TimeSeriesResponse = {
  metricCode: 'PLATFORM_SUBSCRIPTION_REVENUE',
  scopeType: 'PLATFORM',
  scopeId: null,
  granularity: 'MONTH',
  period: { startDate: '2026-06-01', endDate: '2026-11-30' },
  points: [
    { date: '2026-06-01', value: 0 },
    { date: '2026-07-01', value: 149000 },
    { date: '2026-08-01', value: 298000 },
    { date: '2026-09-01', value: 447000 },
    { date: '2026-10-01', value: 512000 },
    { date: '2026-11-01', value: 689500 },
  ],
}

export const MOCK_PLATFORM_SUBSCRIPTION_REVENUE_EMPTY: TimeSeriesResponse = {
  metricCode: 'PLATFORM_SUBSCRIPTION_REVENUE',
  scopeType: 'PLATFORM',
  scopeId: null,
  granularity: 'MONTH',
  period: { startDate: '2026-06-01', endDate: '2026-11-30' },
  points: [
    { date: '2026-06-01', value: 0 },
    { date: '2026-07-01', value: 0 },
    { date: '2026-08-01', value: 0 },
    { date: '2026-09-01', value: 0 },
    { date: '2026-10-01', value: 0 },
    { date: '2026-11-01', value: 0 },
  ],
}

const DAILY_REGISTRATIONS_SAMPLE = [
  14, 18, 12, 9, 21, 24, 16, 19, 15, 22, 17, 28, 31, 20, 23,
  18, 25, 29, 34, 27, 19, 21, 26, 22, 18, 24,
]

export const MOCK_PLATFORM_USER_REGISTRATIONS: TimeSeriesResponse = {
  metricCode: 'PLATFORM_USER_REGISTRATIONS',
  scopeType: 'PLATFORM',
  scopeId: null,
  granularity: 'DAY',
  period: { startDate: '2026-11-01', endDate: '2026-11-30' },
  points: DAILY_REGISTRATIONS_SAMPLE.map((value, idx) => ({
    date: `2026-11-${String(idx + 1).padStart(2, '0')}`,
    value,
  })),
}

export const MOCK_PLATFORM_USER_REGISTRATIONS_EMPTY: TimeSeriesResponse = {
  metricCode: 'PLATFORM_USER_REGISTRATIONS',
  scopeType: 'PLATFORM',
  scopeId: null,
  granularity: 'DAY',
  period: { startDate: '2026-11-01', endDate: '2026-11-30' },
  points: DAILY_REGISTRATIONS_SAMPLE.map((_, idx) => ({
    date: `2026-11-${String(idx + 1).padStart(2, '0')}`,
    value: 0,
  })),
}

/**
 * Lee el parámetro de URL `?mockEstado=` en modo demostración (VITE_USE_MOCKS=true)
 * para probar estados VACIO, ERROR, 401 o 403.
 */
export function getMockStatsEstado(): MockStatsEstado {
  if (typeof window === 'undefined') return 'NORMAL'
  const raw = new URLSearchParams(window.location.search).get('mockEstado')?.trim().toUpperCase()
  if (raw === 'VACIO' || raw === 'ERROR' || raw === '401' || raw === '403') return raw
  return 'NORMAL'
}

export function throwIfMockStatsError(estado: MockStatsEstado): void {
  if (estado === '401') {
    throw new ApiError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.')
  }
  if (estado === '403') {
    throw new ApiError(403, 'No tienes permiso para ver estas estadísticas.', 'ACCESS_DENIED')
  }
  if (estado === 'ERROR') {
    const err = new ApiError(500, 'No pudimos cargar las estadísticas en este momento. Intenta de nuevo.')
    err.correlationId = 'mock-corr-500'
    throw err
  }
}
