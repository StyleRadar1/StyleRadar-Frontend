import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import {
  MOCK_STORE_STATS, MOCK_STORE_INVENTORY,
  MOCK_FOUNDATION_STATS, MOCK_FOUNDATION_MONTHS,
  MOCK_ADMIN_INDICATORS, MOCK_ADMIN_INCOME, MOCK_ADMIN_ACCOUNTS,
} from '../mocks/stats'
import type {
  StoreStatsDto, StoreInventoryDto,
  FoundationStatsDto, FoundationMonthDto,
  AdminIndicatorsDto, AdminIncomeDto, AdminAccountsByPlanDto,
  StatsPeriod,
} from '../types/stats.dto'

export const statsService = {
  /* ─── Tienda ─── */
  getStoreStats(periodo: StatsPeriod): Promise<StoreStatsDto> {
    if (env.useMocks) return mockDelay(MOCK_STORE_STATS[periodo])
    return apiClient.get<StoreStatsDto>('/api/estadisticas/tienda/resumen', { params: { periodo } }).then((r) => r.data)
  },
  getStoreInventory(): Promise<StoreInventoryDto> {
    if (env.useMocks) return mockDelay(MOCK_STORE_INVENTORY)
    return apiClient.get<StoreInventoryDto>('/api/estadisticas/tienda/inventario-estado').then((r) => r.data)
  },

  /* ─── Fundación ─── */
  getFoundationStats(): Promise<FoundationStatsDto> {
    if (env.useMocks) return mockDelay(MOCK_FOUNDATION_STATS)
    return apiClient.get<FoundationStatsDto>('/api/estadisticas/fundacion/resumen').then((r) => r.data)
  },
  getFoundationMonths(): Promise<FoundationMonthDto[]> {
    if (env.useMocks) return mockDelay(MOCK_FOUNDATION_MONTHS)
    return apiClient.get<FoundationMonthDto[]>('/api/estadisticas/fundacion/solicitudes-mensuales').then((r) => r.data)
  },

  /* ─── Admin ─── */
  getAdminIndicators(): Promise<AdminIndicatorsDto> {
    if (env.useMocks) return mockDelay(MOCK_ADMIN_INDICATORS)
    return apiClient.get<AdminIndicatorsDto>('/api/estadisticas/admin/indicadores').then((r) => r.data)
  },
  getAdminIncome(): Promise<AdminIncomeDto> {
    if (env.useMocks) return mockDelay(MOCK_ADMIN_INCOME)
    return apiClient.get<AdminIncomeDto>('/api/estadisticas/admin/ingresos').then((r) => r.data)
  },
  getAdminAccounts(): Promise<AdminAccountsByPlanDto> {
    if (env.useMocks) return mockDelay(MOCK_ADMIN_ACCOUNTS)
    return apiClient.get<AdminAccountsByPlanDto>('/api/estadisticas/admin/cuentas-por-plan').then((r) => r.data)
  },
}
