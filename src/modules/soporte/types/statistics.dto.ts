/**
 * Contratos oficiales de integración para ms-estadisticas (vía API Gateway /api/v1/statistics/*).
 */

export type ScopeType = 'STORE' | 'FOUNDATION' | 'PLATFORM'

export type TimeGranularity = 'DAY' | 'WEEK' | 'MONTH'

export type TotalMetricCode =
  | 'FOUNDATION_GARMENTS_RECEIVED'
  | 'PLATFORM_GARMENT_PUBLICATIONS'
  | 'PLATFORM_PLAYLISTS_CREATED'
  | 'PLATFORM_MONTHLY_DONATIONS'

export type TimeSeriesMetricCode =
  | 'PLATFORM_USER_REGISTRATIONS'
  | 'PLATFORM_SUBSCRIPTION_REVENUE'

export type DistributionMetricCode =
  | 'STORE_INVENTORY_BY_STATE'
  | 'PLATFORM_BUYERS_BY_PLAN'
  | 'PLATFORM_STORES_BY_PLAN'

export type MetricCode =
  | TotalMetricCode
  | TimeSeriesMetricCode
  | DistributionMetricCode

export type InventoryCategoryCode = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export type BuyerPlanCategoryCode = 'PLAN_RADAR' | 'PLAN_RADAR_PLUS'

export type StorePlanCategoryCode = 'PLAN_STORE_MONTHLY' | 'SUSPENDED'

export type CategoryCode =
  | InventoryCategoryCode
  | BuyerPlanCategoryCode
  | StorePlanCategoryCode

export interface PeriodDto {
  startDate: string
  endDate: string
}

export interface MetricTotalResponse {
  metricCode: TotalMetricCode
  scopeType: ScopeType
  scopeId: string | null
  period: PeriodDto | null
  total: number
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface TimeSeriesResponse {
  metricCode: TimeSeriesMetricCode
  scopeType: ScopeType
  scopeId: string | null
  granularity: TimeGranularity
  period: PeriodDto | null
  points: TimeSeriesPoint[]
}

export interface DistributionEntry<C extends CategoryCode = CategoryCode> {
  categoryCode: C
  count: number
  percentage: number
}

export interface DistributionResponse<C extends CategoryCode = CategoryCode> {
  metricCode: DistributionMetricCode
  scopeType: ScopeType
  scopeId: string | null
  entries: DistributionEntry<C>[]
}

export interface TimeSeriesQueryParams {
  startDate?: string
  endDate?: string
  granularity?: TimeGranularity
}

export const CATEGORY_UI_LABELS: Record<CategoryCode, string> = {
  AVAILABLE: 'Disponible (4+ uds)',
  LOW_STOCK: 'Últimas unidades (1–3 uds)',
  OUT_OF_STOCK: 'Agotado (0 uds)',
  PLAN_RADAR: 'Plan Radar (Gratis)',
  PLAN_RADAR_PLUS: 'Plan Radar+',
  PLAN_STORE_MONTHLY: 'Suscripción Mensual Activa',
  SUSPENDED: 'Suscripción Suspendida',
}
