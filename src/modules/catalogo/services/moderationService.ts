import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { MOCK_MODERATION_ITEMS, MOCK_MODERATION_HISTORY } from '../mocks/moderation'
import { guardarDecision, leerHistorial } from './moderationHistoryStore'
import type {
  BackendModerationRequestDto,
  ModerationDecisionDto,
  ModerationHistoryItemDto,
  ModerationItemDto,
  ModerationPendingGroupDto,
  ModerationPendingResponseDto,
} from '../types/moderation.dto'

export interface ModerationBatchDecisionDto {
  publicador: string
  almacenId?: string
  aprobado: boolean
  motivo?: string
  moderadorId?: string
}


/** NIT de la tienda, venga como venga (`storeNit`, `nitAlmacen` o `nit`); undefined si no hay. */
const nitDe = (r: Record<string, any> | ModerationPendingGroupDto): string | undefined => {
  const g = r as Record<string, unknown>
  const v = [g.storeNit, g.nitAlmacen, g.nit].find((x): x is string => typeof x === 'string' && x.trim().length > 0)
  return v?.trim()
}

function mapPendingGroups(data: ModerationPendingResponseDto | ModerationItemDto[]): ModerationItemDto[] {
  if (Array.isArray(data)) return data
  const grupos: ModerationPendingGroupDto[] = Array.isArray(data?.grupos) ? data.grupos : []
  const tipoGrupo = data?.tipoPublicador?.toUpperCase() === 'SEGUNDA_MANO' ? 'Segunda mano' : 'Catálogo'
  const flat: ModerationItemDto[] = []

  for (const grupo of grupos) {
    const almacenId = grupo.almacenId ? String(grupo.almacenId) : undefined
    const tipoPubRaw = grupo.tipoPublicador ?? data?.tipoPublicador ?? ''
    const isPersona = String(tipoPubRaw).toUpperCase().includes('PERSONA') || String(tipoPubRaw).toUpperCase().includes('SEGUNDA')
    const publicaciones = grupo.prendas ?? grupo.publicaciones ?? []
    // ms-item-catalogo manda el nombre de la tienda en `almacen` y el NIT en cada prenda (`storeNit`); el id (UUID) no sirve para mostrarlo
    const nitDelGrupo = nitDe(grupo) ?? publicaciones.map(nitDe).find(Boolean)
    const marcaDelGrupo = typeof publicaciones[0]?.marca === 'string' ? publicaciones[0].marca : undefined
    const publicador = grupo.almacen || grupo.nombreAlmacen || grupo.publicador || marcaDelGrupo || (nitDelGrupo ? `NIT ${nitDelGrupo}` : 'Tienda sin nombre')

    for (const p of publicaciones) {
      flat.push({
        id: String(p.id ?? ''),
        almacenId: p.almacenId ? String(p.almacenId) : almacenId,
        titulo: p.titulo || p.nombre || '',
        publicador: p.publicador || publicador,
        publicadorNit: isPersona ? undefined : nitDe(p) ?? nitDelGrupo,
        tipoPublicador: p.tipoPublicador === 'Persona' || isPersona ? 'Persona' : 'Tienda',
        tipo: p.tipo === 'Segunda mano' || isPersona ? 'Segunda mano' : tipoGrupo,
        precio: Number(p.precio ?? 0),
        fecha: p.fecha || p.fechaPublicacion || 'Hoy',
        imagen: p.imagen || (Array.isArray(p.fotografias) && p.fotografias[0]) || '',
        categoria: p.categoria || p.tipo || '',
        tallas: Array.isArray(p.tallas) ? p.tallas : [],
        nota: p.nota || p.estilo || undefined,
      })
    }
  }
  return flat
}

export const moderationService = {
  getPending(): Promise<ModerationItemDto[]> {
    if (env.useMocks) return mockDelay([...MOCK_MODERATION_ITEMS])
    return apiClient
      .get<ModerationPendingResponseDto | ModerationItemDto[]>('/api/v1/garments/pending')
      .then((r) => mapPendingGroups(r.data))
  },

  /** Decisiones recientes. Se guardan en este navegador (el back no tiene historial), así que sobreviven al recargar. */
  getHistory(): Promise<ModerationHistoryItemDto[]> {
    const guardado = leerHistorial()
    if (env.useMocks) {
      const ids = new Set(guardado.map((h) => h.itemId))
      return mockDelay([...guardado, ...MOCK_MODERATION_HISTORY.filter((h) => !ids.has(h.itemId))])
    }
    return Promise.resolve(guardado)
  },

  /** Guarda una decisión ya tomada en el historial. */
  registrar(entrada: ModerationHistoryItemDto): void {
    guardarDecision(entrada)
  },

  decide(decision: ModerationDecisionDto): Promise<void> {
    if (!decision.aprobado && !(decision.motivo ?? '').trim()) {
      throw new ApiError(400, 'Selecciona el motivo de rechazo.', {
        motivo: 'Selecciona el motivo de rechazo.',
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
    const payload: BackendModerationRequestDto = {
      decision: decision.aprobado ? 'APROBADA' : 'RECHAZADA',
      ...(decision.aprobado ? {} : { motivo: decision.motivo || decision.comentario }),
    }
    return apiClient.put(`/api/v1/garments/${encodeURIComponent(decision.itemId)}/moderation`, payload).then(() => undefined)
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
    const targetId = batch.almacenId || batch.publicador
    const payload: BackendModerationRequestDto = {
      decision: batch.aprobado ? 'APROBADA' : 'RECHAZADA',
      ...(batch.aprobado ? {} : { motivo: batch.motivo }),
    }
    return apiClient
      .put(`/api/v1/garments/pending/stores/${encodeURIComponent(targetId)}/moderation`, payload)
      .then(() => undefined)
  },
}

