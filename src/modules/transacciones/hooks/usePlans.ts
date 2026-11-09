import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { planService } from '../services/planService'
import type { PlanDto } from '../types/plan.dto'

export function usePlans() {
  const loader = useCallback(() => planService.getPlans(), [])
  return useResource<PlanDto[]>(loader, [])
}
