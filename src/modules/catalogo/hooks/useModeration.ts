import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { moderationService } from '../services/moderationService'
import { nuevaDecision } from '../services/moderationHistoryStore'
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
      const item = data.items.find((x) => x.id === itemId)
      await moderationService.decide({ itemId, aprobado: true })
      if (!item) return
      const entrada = nuevaDecision(item, true)
      moderationService.registrar(entrada) // queda guardado: sobrevive al cambio de pestaña y a la recarga (BUG-19)
      setData((prev) => ({
        items: prev.items.filter((x) => x.id !== itemId),
        history: [entrada, ...prev.history.filter((h) => h.itemId !== itemId)],
      }))
    },
    [data.items, setData]
  )

  const reject = useCallback(
    async (itemId: string, motivo: string, comentario?: string) => {
      const item = data.items.find((x) => x.id === itemId)
      await moderationService.decide({ itemId, aprobado: false, motivo, comentario })
      if (!item) return
      const entrada = nuevaDecision(item, false, motivo)
      moderationService.registrar(entrada)
      setData((prev) => ({
        items: prev.items.filter((x) => x.id !== itemId),
        history: [entrada, ...prev.history.filter((h) => h.itemId !== itemId)],
      }))
    },
    [data.items, setData]
  )

  const approvePublisher = useCallback(
    async (publicador: string, almacenId?: string) => {
      const resolvedId = almacenId ?? data.items.find((x) => x.publicador === publicador)?.almacenId
      const afectadas = data.items.filter((x) => x.publicador === publicador)
      await moderationService.decidePublisherBatch({ publicador, almacenId: resolvedId, aprobado: true })
      // La decisión en lote también queda en el historial, una entrada por prenda
      afectadas.forEach((it) => moderationService.registrar(nuevaDecision(it, true)))
      reload()
    },
    [data.items, reload]
  )

  const rejectPublisher = useCallback(
    async (publicador: string, motivo: string, almacenId?: string) => {
      const resolvedId = almacenId ?? data.items.find((x) => x.publicador === publicador)?.almacenId
      const afectadas = data.items.filter((x) => x.publicador === publicador)
      await moderationService.decidePublisherBatch({ publicador, almacenId: resolvedId, aprobado: false, motivo })
      afectadas.forEach((it) => moderationService.registrar(nuevaDecision(it, false, motivo)))
      reload()
    },
    [data.items, reload]
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

