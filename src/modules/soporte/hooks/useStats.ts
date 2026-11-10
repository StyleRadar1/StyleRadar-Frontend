import { useCallback, useMemo } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { statsService } from '../services/statsService'
import type { StatsPeriod, StoreStatsDto, StoreInventoryDto, FoundationStatsDto, FoundationMonthDto, AdminIndicatorsDto, AdminIncomeDto, AdminAccountsByPlanDto } from '../types/stats.dto'

export function useStoreStats(periodo: StatsPeriod) {
  const loader = useCallback(() => statsService.getStoreStats(periodo), [periodo])
  return useResource<StoreStatsDto | null>(loader, null)
}

export function useStoreInventory() {
  const loader = useCallback(() => statsService.getStoreInventory(), [])
  return useResource<StoreInventoryDto | null>(loader, null)
}

export function useFoundationStats() {
  const loader = useCallback(() => statsService.getFoundationStats(), [])
  return useResource<FoundationStatsDto | null>(loader, null)
}

export function useFoundationMonths() {
  const loader = useCallback(() => statsService.getFoundationMonths(), [])
  return useResource<FoundationMonthDto[]>(loader, [])
}

export function useAdminIndicators() {
  const loader = useCallback(() => statsService.getAdminIndicators(), [])
  return useResource<AdminIndicatorsDto | null>(loader, null)
}

export function useAdminIncome() {
  const loader = useCallback(() => statsService.getAdminIncome(), [])
  return useResource<AdminIncomeDto | null>(loader, null)
}

export function useAdminAccounts() {
  const loader = useCallback(() => statsService.getAdminAccounts(), [])
  return useResource<AdminAccountsByPlanDto | null>(loader, null)
}

/** Devuelve la vista de stats según el rol del usuario logueado. */
export function useStatsRole() {
  const { user } = useAuth()
  return useMemo(() => {
    if (!user) return null
    if (user.role === 'ADMIN_ALMACEN') return 'store' as const
    if (user.role === 'REPRESENTANTE_FUNDACION') return 'foundation' as const
    if (user.role === 'ADMIN_STYLERADAR') return 'admin' as const
    return null
  }, [user])
}
