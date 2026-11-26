import { mockSessionUser } from '@/modules/core/api/mock'
import type { ModerationHistoryItemDto } from '../types/moderation.dto'

/**
 * Historial de decisiones de moderación (BUG-19). ms-item-catalogo no tiene un endpoint de historial
 * (solo la lista de pendientes y las dos decisiones), así que se guarda aquí, por administrador, para que
 * no se pierda al cambiar de pestaña ni al recargar la página.
 */
export const MAX_HISTORIAL = 100
const CLAVE = 'sr_moderation_history'

const clave = () => `${CLAVE}_${mockSessionUser()?.id ?? 'anon'}`

const esEntrada = (v: unknown): v is ModerationHistoryItemDto => {
  const e = v as Record<string, unknown> | null
  return !!e && typeof e.id === 'string' && typeof e.itemId === 'string' && typeof e.titulo === 'string'
    && typeof e.publicador === 'string' && typeof e.aprobado === 'boolean' && typeof e.fecha === 'string'
}

/** Decisiones guardadas, de la más reciente a la más antigua. Si no hay nada o el almacenamiento falla, queda vacío. */
export function leerHistorial(): ModerationHistoryItemDto[] {
  try {
    const crudo = JSON.parse(localStorage.getItem(clave()) ?? '[]')
    return Array.isArray(crudo) ? crudo.filter(esEntrada).slice(0, MAX_HISTORIAL) : []
  } catch {
    return []
  }
}

/** Agrega una decisión al principio. Si la misma prenda se decide otra vez, queda solo la última. */
export function guardarDecision(entrada: ModerationHistoryItemDto): void {
  try {
    const lista = [entrada, ...leerHistorial().filter((x) => x.id !== entrada.id && x.itemId !== entrada.itemId)].slice(0, MAX_HISTORIAL)
    localStorage.setItem(clave(), JSON.stringify(lista))
  } catch {
    // Sin almacenamiento (modo privado, lleno…): el historial queda solo en pantalla
  }
}

/** Arma la entrada de una decisión con la hora real (la pantalla la muestra con fecha y hora). */
export function nuevaDecision(
  item: { id: string; titulo: string; publicador: string; publicadorNit?: string },
  aprobado: boolean,
  motivo?: string,
): ModerationHistoryItemDto {
  return {
    id: `hist-${Date.now()}-${item.id}`,
    itemId: item.id,
    titulo: item.titulo,
    publicador: item.publicador,
    ...(item.publicadorNit ? { publicadorNit: item.publicadorNit } : {}),
    aprobado,
    ...(motivo ? { motivo } : {}),
    fecha: new Date().toISOString(),
  }
}
