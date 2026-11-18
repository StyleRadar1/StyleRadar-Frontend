import type { TipoTalla } from './item.dto'

/** DTOs para ms-inventario y ms-item-catalogo - RF-50 a RF-58 */

export type InventoryItemStatus =
  | 'DISPONIBLE'
  | 'ULTIMAS_UNIDADES'
  | 'NUEVA_PRENDA'
  | 'AGOTADA'
  | 'SUSPENDIDO'
  | 'RETIRADO'

export type PublicationStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'RETIRADA'

export type TipoPrendaInventario = TipoTalla

export interface InventoryItemDto {
  id: string
  tiendaId: string
  tiendaNombre: string
  sedeId?: string
  nombre: string
  tipo?: string
  color?: string
  marca?: string
  estilo: string
  categoria: string
  tipoPrenda?: TipoPrendaInventario
  precio: number
  imagenUrl: string
  /** Galería de hasta 5 fotos (SR-RF-51; la primera es la portada) */
  imagenes?: string[]
  fotografias?: string[]
  tallasDisponibles: string[]
  stockPorTalla: Record<string, number>
  stockTotal: number
  estado: InventoryItemStatus
  estadoPublicacion?: PublicationStatus
  motivoRechazo?: string
  actualizadoEn: string
}

export interface InventorySummaryDto {
  totalPrendas: number
  totalUnidades: number
  bajoStock: number
  agotados: number
  activas: number
}

export interface PrendaRequestDto {
  almacenId: string
  nombre: string
  tipo: string
  color: string
  marca?: string
  estilo: string
  precio: number
  fotografias: string[]
}

export interface InventarioLoteTallaDto {
  talla: string
  cantidad: number
}

export interface InventarioLoteRequestDto {
  prendaId: string
  sedeId: string
  tipoPrenda: TipoPrendaInventario
  tallas: InventarioLoteTallaDto[]
}

export interface UpdateStockDto {
  prendaId: string
  sedeId?: string
  talla: string
  nuevoStock: number
}

export interface UpdatePriceDto {
  prendaId: string
  nuevoPrecio: number
}

export interface CreateInventoryItemDto {
  nombre: string
  tipo?: string
  color?: string
  estilo: string
  categoria: string
  tipoPrenda?: TipoPrendaInventario
  sedeId?: string
  precio: number
  imagenUrl?: string
  /** Galería de 1 a 5 fotos */
  imagenes?: string[]
  fotografias?: string[]
  stockPorTalla: Record<string, number>
}

export interface UpdateInventoryItemDto {
  prendaId: string
  nombre: string
  tipo: string
  color: string
  estilo: string
  precio: number
  fotografias: string[]
}

