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
import { getCurrentYearMonth, monthRangeFromYearMonth } from '../utils/statsFormat'

export interface StatisticState<T> {
  data: T | null
  loading: boolean
  empty: boolean
  error: string | null
  status: number | null
  retry: () => void
}

interface QueryResult<T> {
  key: string
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
  depKey = 'default',
): StatisticState<T> {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${depKey}:${attempt}`
  const [result, setResult] = useState<QueryResult<T>>({
    key: '',
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
        setResult({ key: requestKey, data: res, error: null, status: null })
      })
      .catch((err: unknown) => {
        if (!active) return
        const mapped = mapStatisticError(err)
        setResult({ key: requestKey, data: null, error: mapped.message, status: mapped.status })
      })

    return () => {
      active = false
    }
  }, [fetcher, requestKey])

  const loading = result.key !== requestKey
  const data = loading ? null : result.data
  const error = loading ? null : result.error
  const status = loading ? null : result.status
  const empty = !loading && !error && data !== null && isEmpty(data)

  return { data, loading, empty, error, status, retry }
}

const isTotalEmpty = (res: MetricTotalResponse) => res.total === 0

const fetchStoreInventory = () => statisticsService.getStoreInventoryByState()
const isInventoryEmpty = (res: DistributionResponse<InventoryCategoryCode>) =>
  res.entries.reduce((sum, entry) => sum + entry.count, 0) === 0

export function useStoreInventoryByState(): StatisticState<
  DistributionResponse<InventoryCategoryCode>
> {
  return useMetricQuery(fetchStoreInventory, isInventoryEmpty)
}

const fetchFoundationGarments = () => statisticsService.getFoundationGarmentsReceived()

export function useFoundationGarmentsReceived(): StatisticState<MetricTotalResponse> {
  return useMetricQuery(fetchFoundationGarments, isTotalEmpty)
}

const fetchGarmentPublications = () => statisticsService.getPlatformGarmentPublications()

export function usePlatformGarmentPublications(): StatisticState<MetricTotalResponse> {
  return useMetricQuery(fetchGarmentPublications, isTotalEmpty)
}

const fetchPlaylistsCreated = () => statisticsService.getPlatformPlaylistsCreated()

export function usePlatformPlaylistsCreated(): StatisticState<MetricTotalResponse> {
  return useMetricQuery(fetchPlaylistsCreated, isTotalEmpty)
}

const fetchMonthlyDonations = () => statisticsService.getPlatformMonthlyDonations()

export function usePlatformMonthlyDonations(): StatisticState<MetricTotalResponse> {
  return useMetricQuery(fetchMonthlyDonations, isTotalEmpty)
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

const isRegistrationsEmpty = (res: TimeSeriesResponse) =>
  (res.points ?? []).every((point) => point.value === 0)

export function usePlatformUserRegistrations(
  yearMonth?: string,
): StatisticState<TimeSeriesResponse> {
  const targetMonth = yearMonth || getCurrentYearMonth()
  const fetcher = useCallback(() => {
    const { startDate, endDate } = monthRangeFromYearMonth(targetMonth)
    return statisticsService.getPlatformUserRegistrations({
      startDate,
      endDate,
      granularity: 'DAY',
    })
  }, [targetMonth])

  return useMetricQuery(fetcher, isRegistrationsEmpty, targetMonth)
}
