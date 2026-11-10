import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { storeSubscriptionService } from '../services/storeSubscriptionService'
import type { StoreSubscriptionStateDto } from '../types/storeSubscription.dto'

export function useStoreSubscription() {
  const loader = useCallback(() => storeSubscriptionService.get(), [])
  return useResource<StoreSubscriptionStateDto | null>(loader, null)
}
