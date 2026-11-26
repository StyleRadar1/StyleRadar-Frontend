import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/modules/core/api/apiClient'
import { statisticsService } from '../services/statisticsService'
import type {
  BuyerPlanCategoryCode,
  DistributionResponse,
  InventoryCategoryCode,
  MetricTotalResponse,
  StorePlanCategoryCode,
  TimeSeriesResponse,
} from '../types/statistics.dto'

export interface StatisticState<T> {
  data: T | null
  loading: boolean
  empty: boolean
  error: string | null
  status: number | null
  retry: () => void
}

interface QueryResult<T> {
  attempt: number
  data: T | null
  error: string | null
  status: number | null
}

function mapStatisticError(err: unknown): { message: string; status: number } {
  const status = err instanceof ApiError ? err.status : 0

  if (import.meta.env.DEV && err instanceof ApiError && err.correlationId) {
    console.error(`[ms-estadisticas] X-Correlation-Id: ${err.correlationId} (status ${status})`)
  }

  if (status === 401) {
    return { status, message: 'Tu sesión expiró. Vuelve a iniciar sesión.' }
  }
  if (status === 403) {
    return { status, message: 'No tienes permiso para ver estas estadísticas.' }
  }
  return {
    status,
    message: 'No pudimos cargar las estadísticas en este momento. Intenta de nuevo.',
  }
}

function useMetricQuery<T>(
  fetcher: () => Promise<T>,
  isEmpty: (data: T) => boolean,
): StatisticState<T> {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<QueryResult<T>>({
    attempt: -1,
    data: null,
    error: null,
    status: null,
  })

  const retry = useCallback(() => {
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    let active = true

    fetcher()
      .then((res) => {
        if (!active) return
        setResult({ attempt, data: res, error: null, status: null })
      })
      .catch((err: unknown) => {
        if (!active) return
        const mapped = mapStatisticError(err)
        setResult({ attempt, data: null, error: mapped.message, status: mapped.status })
      })

    return () => {
      active = false
    }
  }, [fetcher, attempt])

  const loading = result.attempt !== attempt
  const data = loading ? null : result.data
  const error = loading ? null : result.error
  const status = loading ? null : result.status
  const empty = !loading && !error && data !== null && isEmpty(data)

  return { data, loading, empty, error, status, retry }
}

function currentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const mm = String(month + 1).padStart(2, '0')
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

const fetchStoreInventory = () => statisticsService.getStoreInventoryByState()
const isInventoryEmpty = (res: DistributionResponse<InventoryCategoryCode>) =>
  res.entries.reduce((sum, entry) => sum + entry.count, 0) === 0

export function useStoreInventoryByState(): StatisticState<
  DistributionResponse<InventoryCategoryCode>
> {
  return useMetricQuery(fetchStoreInventory, isInventoryEmpty)
}

const fetchFoundationGarments = () => statisticsService.getFoundationGarmentsReceived()
const isFoundationEmpty = (res: MetricTotalResponse) => res.total === 0

export function useFoundationGarmentsReceived(): StatisticState<MetricTotalResponse> {
  return useMetricQuery(fetchFoundationGarments, isFoundationEmpty)
}

const fetchPlatformBuyers = () => statisticsService.getPlatformBuyersByPlan()
const isBuyersEmpty = (res: DistributionResponse<BuyerPlanCategoryCode>) =>
  (res.entries ?? []).reduce((sum, entry) => sum + entry.count, 0) === 0

export function usePlatformBuyersByPlan(): StatisticState<
  DistributionResponse<BuyerPlanCategoryCode>
> {
  return useMetricQuery(fetchPlatformBuyers, isBuyersEmpty)
}

const fetchPlatformStores = () => statisticsService.getPlatformStoresByPlan()
const isStoresEmpty = (res: DistributionResponse<StorePlanCategoryCode>) =>
  (res.entries ?? []).reduce((sum, entry) => sum + entry.count, 0) === 0

export function usePlatformStoresByPlan(): StatisticState<
  DistributionResponse<StorePlanCategoryCode>
> {
  return useMetricQuery(fetchPlatformStores, isStoresEmpty)
}

const fetchPlatformRevenue = () =>
  statisticsService.getPlatformSubscriptionRevenue({ granularity: 'MONTH' })
const isRevenueEmpty = (res: TimeSeriesResponse) =>
  (res.points ?? []).every((point) => point.value === 0)

export function usePlatformSubscriptionRevenue(): StatisticState<TimeSeriesResponse> {
  return useMetricQuery(fetchPlatformRevenue, isRevenueEmpty)
}

const fetchPlatformRegistrations = () => {
  const { startDate, endDate } = currentMonthRange()
  return statisticsService.getPlatformUserRegistrations({
    startDate,
    endDate,
    granularity: 'DAY',
  })
}
const isRegistrationsEmpty = (res: TimeSeriesResponse) =>
  (res.points ?? []).every((point) => point.value === 0)

export function usePlatformUserRegistrations(): StatisticState<TimeSeriesResponse> {
  return useMetricQuery(fetchPlatformRegistrations, isRegistrationsEmpty)
}
