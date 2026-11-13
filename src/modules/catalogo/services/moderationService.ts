import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { MOCK_MODERATION_ITEMS, MOCK_MODERATION_HISTORY } from '../mocks/moderation'
import type {
  ModerationItemDto,
  ModerationDecisionDto,
  ModerationHistoryItemDto,
} from '../types/moderation.dto'

export interface ModerationBatchDecisionDto {
  publicador: string
  aprobado: boolean
  motivo?: string
}

export const moderationService = {
  getPending(): Promise<ModerationItemDto[]> {
    if (env.useMocks) return mockDelay([...MOCK_MODERATION_ITEMS])
    return apiClient.get<ModerationItemDto[]>('/api/v1/prendas/pendientes').then((r) => r.data)
  },

  getHistory(): Promise<ModerationHistoryItemDto[]> {
    if (env.useMocks) return mockDelay([...MOCK_MODERATION_HISTORY])
    return apiClient.get<ModerationHistoryItemDto[]>('/api/v1/prendas/historial').then((r) => r.data)
  },

  decide(decision: ModerationDecisionDto): Promise<void> {
    if (env.useMocks) {
      const idx = MOCK_MODERATION_ITEMS.findIndex((it) => it.id === decision.itemId)
      if (idx >= 0) {
        const item = MOCK_MODERATION_ITEMS[idx]
        MOCK_MODERATION_ITEMS.splice(idx, 1)
        MOCK_MODERATION_HISTORY.unshift({
          id: `hist-${Date.now()}`,
          itemId: item.id,
          titulo: item.titulo,
          publicador: item.publicador,
          aprobado: decision.aprobado,
          motivo: decision.motivo,
          fecha: 'Hoy',
        })
      }
      return mockDelay(undefined, 250)
    }
    return apiClient.put(`/api/v1/prendas/${decision.itemId}/moderacion`, decision).then(() => undefined)
  },

  decidePublisherBatch(batch: ModerationBatchDecisionDto): Promise<void> {
    if (env.useMocks) {
      const matching = MOCK_MODERATION_ITEMS.filter((it) => it.publicador === batch.publicador)
      for (const item of matching) {
        const idx = MOCK_MODERATION_ITEMS.indexOf(item)
        if (idx >= 0) MOCK_MODERATION_ITEMS.splice(idx, 1)
        MOCK_MODERATION_HISTORY.unshift({
          id: `hist-${Date.now()}-${item.id}`,
          itemId: item.id,
          titulo: item.titulo,
          publicador: item.publicador,
          aprobado: batch.aprobado,
          motivo: batch.motivo,
          fecha: 'Hoy',
        })
      }
      return mockDelay(undefined, 350)
    }
    return apiClient.put(`/api/v1/prendas/pendientes/almacenes/${encodeURIComponent(batch.publicador)}/moderacion`, batch).then(() => undefined)
  },
}

