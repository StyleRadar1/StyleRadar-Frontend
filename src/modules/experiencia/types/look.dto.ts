import type { ItemResponseDto } from '@/modules/catalogo/types/item.dto'

export type LookSlot = 'superior' | 'inferior' | 'abrigo' | 'calzado' | 'accesorios'

export const LOOK_SLOTS: readonly LookSlot[] = ['superior', 'inferior', 'abrigo', 'calzado', 'accesorios'] as const

export const SLOT_LABELS: Record<LookSlot, string> = {
  superior: 'Superior',
  inferior: 'Inferior',
  abrigo: 'Abrigo',
  calzado: 'Calzado',
  accesorios: 'Accesorios',
}

export interface WornItem {
  item: ItemResponseDto
  talla: string
  color: string
  veredicto: string
  slot: LookSlot
  layer: string
}

export type LookState = Partial<Record<LookSlot, WornItem>>

export interface FitEvaluation {
  apta: boolean
  veredicto: string
  motivo?: string
  tallaSugerida?: string
}

export interface UserMeasurements {
  superior: string
  inferior: string
  calzado: string
}

export interface FailedOutfitItem {
  item: ItemResponseDto
  motivo: string
  tallaSugerida?: string
  esRetirada?: boolean
}

export interface TryOnPlaylistResult {
  puestas: WornItem[]
  fallidas: FailedOutfitItem[]
  resumen: string
}
