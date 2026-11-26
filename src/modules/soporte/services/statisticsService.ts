import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import {
  buildMockUserRegistrations,
  getMockStatsEstado,
  MOCK_FOUNDATION_GARMENTS_RECEIVED,
  MOCK_FOUNDATION_GARMENTS_RECEIVED_EMPTY,
  MOCK_PLATFORM_BUYERS_BY_PLAN,
  MOCK_PLATFORM_BUYERS_BY_PLAN_EMPTY,
  MOCK_PLATFORM_GARMENT_PUBLICATIONS,
  MOCK_PLATFORM_GARMENT_PUBLICATIONS_EMPTY,
  MOCK_PLATFORM_MONTHLY_DONATIONS,
  MOCK_PLATFORM_MONTHLY_DONATIONS_EMPTY,
  MOCK_PLATFORM_PLAYLISTS_CREATED,
  MOCK_PLATFORM_PLAYLISTS_CREATED_EMPTY,
  MOCK_PLATFORM_STORES_BY_PLAN,
  MOCK_PLATFORM_STORES_BY_PLAN_EMPTY,
  MOCK_PLATFORM_SUBSCRIPTION_REVENUE,
  MOCK_PLATFORM_SUBSCRIPTION_REVENUE_EMPTY,
  throwIfMockStatsError,
} from '../mocks/statistics'
import type {
  BuyerPlanCategoryCode,
  CategoryCode,
  DistributionMetricCode,
  DistributionResponse,
  MetricTotalResponse,
  StorePlanCategoryCode,
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
      const isEmpty = estado === 'VACIO'
      if (metricCode === 'FOUNDATION_GARMENTS_RECEIVED') {
        return mockDelay(
          isEmpty ? MOCK_FOUNDATION_GARMENTS_RECEIVED_EMPTY : MOCK_FOUNDATION_GARMENTS_RECEIVED,
        )
      }
      if (metricCode === 'PLATFORM_GARMENT_PUBLICATIONS') {
        return mockDelay(
          isEmpty ? MOCK_PLATFORM_GARMENT_PUBLICATIONS_EMPTY : MOCK_PLATFORM_GARMENT_PUBLICATIONS,
        )
      }
      if (metricCode === 'PLATFORM_PLAYLISTS_CREATED') {
        return mockDelay(
          isEmpty ? MOCK_PLATFORM_PLAYLISTS_CREATED_EMPTY : MOCK_PLATFORM_PLAYLISTS_CREATED,
        )
      }
      if (metricCode === 'PLATFORM_MONTHLY_DONATIONS') {
        return mockDelay(
          isEmpty ? MOCK_PLATFORM_MONTHLY_DONATIONS_EMPTY : MOCK_PLATFORM_MONTHLY_DONATIONS,
        )
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
      const isEmpty = estado === 'VACIO'
      if (metricCode === 'PLATFORM_SUBSCRIPTION_REVENUE') {
        return mockDelay(
          isEmpty ? MOCK_PLATFORM_SUBSCRIPTION_REVENUE_EMPTY : MOCK_PLATFORM_SUBSCRIPTION_REVENUE,
        )
      }
      if (metricCode === 'PLATFORM_USER_REGISTRATIONS') {
        const yearMonth = params?.startDate?.slice(0, 7) || '2026-11'
        return mockDelay(buildMockUserRegistrations(yearMonth, isEmpty))
      }
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
      const isEmpty = estado === 'VACIO'
      if (metricCode === 'PLATFORM_BUYERS_BY_PLAN') {
        return mockDelay(
          (isEmpty
            ? MOCK_PLATFORM_BUYERS_BY_PLAN_EMPTY
            : MOCK_PLATFORM_BUYERS_BY_PLAN) as DistributionResponse<C>,
        )
      }
      if (metricCode === 'PLATFORM_STORES_BY_PLAN') {
        return mockDelay(
          (isEmpty
            ? MOCK_PLATFORM_STORES_BY_PLAN_EMPTY
            : MOCK_PLATFORM_STORES_BY_PLAN) as DistributionResponse<C>,
        )
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

  /** Métrica de FUNDACIÓN (FOUNDATION_ADMIN): total de prendas recibidas confirmadas. */
  getFoundationGarmentsReceived(): Promise<MetricTotalResponse> {
    return this.getTotal('FOUNDATION_GARMENTS_RECEIVED')
  },

  /** Métrica de ADMIN: total acumulado de prendas publicadas en la plataforma. */
  getPlatformGarmentPublications(): Promise<MetricTotalResponse> {
    return this.getTotal('PLATFORM_GARMENT_PUBLICATIONS')
  },

  /** Métrica de ADMIN: total acumulado de playlists creadas en la plataforma. */
  getPlatformPlaylistsCreated(): Promise<MetricTotalResponse> {
    return this.getTotal('PLATFORM_PLAYLISTS_CREATED')
  },

  /** Métrica de ADMIN: total de donaciones del mes en curso. */
  getPlatformMonthlyDonations(): Promise<MetricTotalResponse> {
    return this.getTotal('PLATFORM_MONTHLY_DONATIONS')
  },

  /** Métrica de ADMIN: distribución de compradores por plan (devuelve entries completas). */
  getPlatformBuyersByPlan(): Promise<DistributionResponse<BuyerPlanCategoryCode>> {
    return this.getDistribution<BuyerPlanCategoryCode>('PLATFORM_BUYERS_BY_PLAN')
  },

  /** Métrica de ADMIN: distribución de almacenes aliados por estado/plan (devuelve entries completas). */
  getPlatformStoresByPlan(): Promise<DistributionResponse<StorePlanCategoryCode>> {
    return this.getDistribution<StorePlanCategoryCode>('PLATFORM_STORES_BY_PLAN')
  },

  /** Métrica de ADMIN: serie mensual de ingresos totales por suscripciones (COP). */
  getPlatformSubscriptionRevenue(params?: TimeSeriesQueryParams): Promise<TimeSeriesResponse> {
    return this.getTimeSeries('PLATFORM_SUBSCRIPTION_REVENUE', {
      granularity: 'MONTH',
      ...params,
    })
  },

  /** Métrica de ADMIN: serie diaria de usuarios registrados en un mes calendario. */
  getPlatformUserRegistrations(params?: TimeSeriesQueryParams): Promise<TimeSeriesResponse> {
    return this.getTimeSeries('PLATFORM_USER_REGISTRATIONS', {
      granularity: 'DAY',
      ...params,
    })
  },
}
