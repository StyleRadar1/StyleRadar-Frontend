import { ApiError } from '@/modules/core/api/apiClient'
import type {
  DistributionResponse,
  InventoryCategoryCode,
  MetricTotalResponse,
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
