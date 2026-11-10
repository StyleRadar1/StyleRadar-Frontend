import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { FOUNDATION_PROFILES } from '../mocks/foundationProfile'
import type { FoundationProfileDto } from '../types/foundationProfile.dto'

/** En la demo, la cuenta de fundación (f-1) representa a Fundación Abrigo Bogotá. */
const MOCK_FOUNDATION_OF: Record<string, string> = { 'f-1': 'abrigo' }

export const foundationProfileService = {
  /** Página de la fundación del representante con sesión (el backend la toma del token). */
  async mine(): Promise<FoundationProfileDto> {
    if (env.useMocks) {
      failIfScenario()
      const p = FOUNDATION_PROFILES[MOCK_FOUNDATION_OF[mockSessionUser()?.id ?? ''] ?? '']
      if (!p) throw new ApiError(403, 'Tu cuenta no representa a ninguna fundación.')
      return mockDelay(p)
    }
    return apiClient.get<FoundationProfileDto>('/api/donations/foundations/me').then((r) => r.data)
  },
}
