/** DTOs para ms-inventario (Puerto 8200) - RF-50 a RF-60 */

export type InventoryItemStatus = 'DISPONIBLE' | 'BAJO_STOCK' | 'AGOTADO' | 'RETIRADO'

export interface InventoryItemDto {
  id: string
  tiendaId: string
  tiendaNombre: string
  nombre: string
  estilo: string
  categoria: string
  precio: number
  imagenUrl: string
  tallasDisponibles: string[]
  stockPorTalla: Record<string, number>
  stockTotal: number
  estado: InventoryItemStatus
  actualizadoEn: string
}

export interface InventorySummaryDto {
  totalPrendas: number
  totalUnidades: number
  bajoStock: number
  agotados: number
  activas: number
}

export interface UpdateStockDto {
  prendaId: string
  talla: string
  nuevoStock: number
}

export interface UpdatePriceDto {
  prendaId: string
  nuevoPrecio: number
}

export interface CreateInventoryItemDto {
  nombre: string
  estilo: string
  categoria: string
  precio: number
  imagenUrl?: string
  stockPorTalla: Record<string, number>
}

