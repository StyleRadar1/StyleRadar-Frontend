import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
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
    return apiClient.get<ModerationItemDto[]>('/api/moderacion/pendientes').then((r) => r.data)
  },

  getHistory(): Promise<ModerationHistoryItemDto[]> {
    if (env.useMocks) return mockDelay([...MOCK_MODERATION_HISTORY])
    return apiClient.get<ModerationHistoryItemDto[]>('/api/moderacion/historial').then((r) => r.data)
  },

  decide(decision: ModerationDecisionDto): Promise<void> {
    if (!decision.aprobado && !(decision.motivo ?? '').trim()) {
      throw new ApiError(400, 'Selecciona el motivo de rechazo (obligatorio según RF-61).', {
        motivo: 'Selecciona el motivo de rechazo (obligatorio según RF-61).',
      })
    }
    if (env.useMocks) {
      failIfScenario('regla', 'conflicto')
      const idx = MOCK_MODERATION_ITEMS.findIndex((it) => it.id === decision.itemId)
      if (idx === -1) throw new ApiError(422, 'Ya fue moderado — actualizamos la lista.')
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
      return mockDelay(undefined, 250)
    }
    return apiClient.post('/api/moderacion/decidir', decision).then(() => undefined)
  },

  decidePublisherBatch(batch: ModerationBatchDecisionDto): Promise<void> {
    if (!batch.aprobado && !(batch.motivo ?? '').trim()) {
      throw new ApiError(400, 'Selecciona el motivo de rechazo en lote.', {
        motivo: 'Selecciona el motivo de rechazo en lote.',
      })
    }
    if (env.useMocks) {
      failIfScenario('regla', 'conflicto')
      const matching = MOCK_MODERATION_ITEMS.filter((it) => it.publicador === batch.publicador)
      if (!matching.length) throw new ApiError(422, 'Ya fue moderado — actualizamos la lista.')
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
    return apiClient.post('/api/moderacion/decidir-lote', batch).then(() => undefined)
  },
}

