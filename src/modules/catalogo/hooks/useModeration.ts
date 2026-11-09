import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { moderationService } from '../services/moderationService'
import type { ModerationItemDto, ModerationHistoryItemDto } from '../types/moderation.dto'

interface ModerationState {
  items: ModerationItemDto[]
  history: ModerationHistoryItemDto[]
}

const INITIAL_STATE: ModerationState = {
  items: [],
  history: [],
}

export function useModeration() {
  const loader = useCallback(async (): Promise<ModerationState> => {
    const [items, history] = await Promise.all([
      moderationService.getPending(),
      moderationService.getHistory(),
    ])
    return { items, history }
  }, [])

  const { data, error, loading, reload, setData } = useResource<ModerationState>(loader, INITIAL_STATE)

  const approve = useCallback(
    async (itemId: string) => {
      await moderationService.decide({ itemId, aprobado: true })
      setData((prev) => {
        const item = prev.items.find((x) => x.id === itemId)
        if (!item) return prev
        return {
          items: prev.items.filter((x) => x.id !== itemId),
          history: [
            {
              id: `hist-${Date.now()}`,
              itemId: item.id,
              titulo: item.titulo,
              publicador: item.publicador,
              aprobado: true,
              fecha: 'Hoy',
            },
            ...prev.history,
          ],
        }
      })
    },
    [setData]
  )

  const reject = useCallback(
    async (itemId: string, motivo: string, comentario?: string) => {
      await moderationService.decide({ itemId, aprobado: false, motivo, comentario })
      setData((prev) => {
        const item = prev.items.find((x) => x.id === itemId)
        if (!item) return prev
        return {
          items: prev.items.filter((x) => x.id !== itemId),
          history: [
            {
              id: `hist-${Date.now()}`,
              itemId: item.id,
              titulo: item.titulo,
              publicador: item.publicador,
              aprobado: false,
              motivo,
              fecha: 'Hoy',
            },
            ...prev.history,
          ],
        }
      })
    },
    [setData]
  )

  const approvePublisher = useCallback(
    async (publicador: string) => {
      await moderationService.decidePublisherBatch({ publicador, aprobado: true })
      reload()
    },
    [reload]
  )

  const rejectPublisher = useCallback(
    async (publicador: string, motivo: string) => {
      await moderationService.decidePublisherBatch({ publicador, aprobado: false, motivo })
      reload()
    },
    [reload]
  )

  return {
    items: data.items,
    history: data.history,
    loading,
    error,
    reload,
    approve,
    reject,
    approvePublisher,
    rejectPublisher,
  }
}

