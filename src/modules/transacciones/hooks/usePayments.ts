import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { paymentService } from '../services/paymentService'
import type { PaymentDto, PaymentFiltersDto } from '../types/payment.dto'

export function usePayments(filters: PaymentFiltersDto) {
  const loader = useCallback(() => paymentService.list(filters), [filters])
  return useResource<PaymentDto[]>(loader, [])
}
