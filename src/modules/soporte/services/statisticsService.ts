import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import {
  getMockStatsEstado,
  MOCK_FOUNDATION_GARMENTS_RECEIVED,
  MOCK_FOUNDATION_GARMENTS_RECEIVED_EMPTY,
  MOCK_STORE_INVENTORY_BY_STATE,
  MOCK_STORE_INVENTORY_BY_STATE_EMPTY,
  throwIfMockStatsError,
} from '../mocks/statistics'
import type {
  CategoryCode,
  DistributionMetricCode,
  DistributionResponse,
  InventoryCategoryCode,
  MetricTotalResponse,
  TimeSeriesMetricCode,
  TimeSeriesQueryParams,
  TimeSeriesResponse,
  TotalMetricCode,
} from '../types/statistics.dto'

/**
 * Cliente de integración con ms-estadisticas a través del API Gateway (VITE_API_URL).
 * Solo realiza peticiones GET bajo /api/v1/statistics/*; nunca envía storeId ni foundationId
 * porque el backend resuelve el alcance desde el JWT enviado por apiClient.
 */
export const statisticsService = {
  async getTotal(metricCode: TotalMetricCode): Promise<MetricTotalResponse> {
    if (env.useMocks) {
      const estado = getMockStatsEstado()
      throwIfMockStatsError(estado)
      if (metricCode === 'FOUNDATION_GARMENTS_RECEIVED') {
        const data =
          estado === 'VACIO'
            ? MOCK_FOUNDATION_GARMENTS_RECEIVED_EMPTY
            : MOCK_FOUNDATION_GARMENTS_RECEIVED
        return mockDelay(data)
      }
      return mockDelay({
        metricCode,
        scopeType: 'PLATFORM',
        scopeId: null,
        period: null,
        total: 0,
      })
    }

    return apiClient
      .get<MetricTotalResponse>(`/api/v1/statistics/summary/totals/${metricCode}`)
      .then((r) => r.data)
  },

  async getTimeSeries(
    metricCode: TimeSeriesMetricCode,
    params?: TimeSeriesQueryParams,
  ): Promise<TimeSeriesResponse> {
    if (env.useMocks) {
      const estado = getMockStatsEstado()
      throwIfMockStatsError(estado)
      return mockDelay({
        metricCode,
        scopeType: 'PLATFORM',
        scopeId: null,
        granularity: params?.granularity ?? 'DAY',
        period:
          params?.startDate && params?.endDate
            ? { startDate: params.startDate, endDate: params.endDate }
            : null,
        points: [],
      })
    }

    return apiClient
      .get<TimeSeriesResponse>(`/api/v1/statistics/time-series/${metricCode}`, { params })
      .then((r) => r.data)
  },

  async getDistribution<C extends CategoryCode = CategoryCode>(
    metricCode: DistributionMetricCode,
  ): Promise<DistributionResponse<C>> {
    if (env.useMocks) {
      const estado = getMockStatsEstado()
      throwIfMockStatsError(estado)
      if (metricCode === 'STORE_INVENTORY_BY_STATE') {
        const data =
          estado === 'VACIO'
            ? MOCK_STORE_INVENTORY_BY_STATE_EMPTY
            : MOCK_STORE_INVENTORY_BY_STATE
        return mockDelay(data as DistributionResponse<C>)
      }
      return mockDelay({
        metricCode,
        scopeType: 'PLATFORM',
        scopeId: null,
        entries: [],
      })
    }

    return apiClient
      .get<DistributionResponse<C>>(`/api/v1/statistics/distributions/${metricCode}`)
      .then((r) => r.data)
  },

  /** Métrica de TIENDA (STORE_ADMIN): distribución de inventario por estado. */
  getStoreInventoryByState(): Promise<DistributionResponse<InventoryCategoryCode>> {
    return this.getDistribution<InventoryCategoryCode>('STORE_INVENTORY_BY_STATE')
  },

  /** Métrica de FUNDACIÓN (FOUNDATION_ADMIN): total de prendas recibidas confirmadas. */
  getFoundationGarmentsReceived(): Promise<MetricTotalResponse> {
    return this.getTotal('FOUNDATION_GARMENTS_RECEIVED')
  },
}
