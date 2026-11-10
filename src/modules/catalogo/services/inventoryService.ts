import { apiClient } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { INVENTORY_ITEMS } from '../mocks/inventory'
import type {
  InventoryItemDto,
  InventorySummaryDto,
  CreateInventoryItemDto,
  UpdateStockDto,
  UpdatePriceDto,
} from '../types/inventory.dto'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

// Copia mutable en memoria para persistencia local de la sesión de prueba
let memoryInventory: InventoryItemDto[] = structuredClone(INVENTORY_ITEMS)

function computeStatus(total: number, retired: boolean): InventoryItemDto['estado'] {
  if (retired) return 'RETIRADO'
  if (total === 0) return 'AGOTADO'
  if (total <= 3) return 'BAJO_STOCK'
  return 'DISPONIBLE'
}

function computeSummary(items: InventoryItemDto[]): InventorySummaryDto {
  const activas = items.filter((x) => x.estado !== 'RETIRADO')
  const totalUnidades = activas.reduce((acc, curr) => acc + curr.stockTotal, 0)
  const bajoStock = activas.filter((x) => x.estado === 'BAJO_STOCK').length
  const agotados = activas.filter((x) => x.estado === 'AGOTADO').length

  return {
    totalPrendas: items.length,
    totalUnidades,
    bajoStock,
    agotados,
    activas: activas.length,
  }
}

export const inventoryService = {
  async getStoreInventory(tiendaId?: string): Promise<InventoryItemDto[]> {
    if (USE_MOCKS) {
      const list = tiendaId
        ? memoryInventory.filter((x) => x.tiendaId === tiendaId)
        : memoryInventory
      return mockDelay(list)
    }
    const params = tiendaId ? { tiendaId } : undefined
    return apiClient.get<InventoryItemDto[]>('/tienda/inventario', { params }).then((r) => r.data)
  },

  async getSummary(tiendaId?: string): Promise<InventorySummaryDto> {
    if (USE_MOCKS) {
      const list = tiendaId
        ? memoryInventory.filter((x) => x.tiendaId === tiendaId)
        : memoryInventory
      return mockDelay(computeSummary(list))
    }
    const params = tiendaId ? { tiendaId } : undefined
    return apiClient.get<InventorySummaryDto>('/tienda/inventario/resumen', { params }).then((r) => r.data)
  },

  async updateStock(dto: UpdateStockDto): Promise<InventoryItemDto> {
    if (USE_MOCKS) {
      const idx = memoryInventory.findIndex((x) => x.id === dto.prendaId)
      if (idx === -1) throw new Error('Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      const newStock = { ...item.stockPorTalla, [dto.talla]: Math.max(0, dto.nuevoStock) }
      const total = Object.values(newStock).reduce((a, b) => a + b, 0)
      const retired = item.estado === 'RETIRADO'

      const updated: InventoryItemDto = {
        ...item,
        stockPorTalla: newStock,
        stockTotal: total,
        estado: computeStatus(total, retired),
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }
    return apiClient.patch<InventoryItemDto>(`/tienda/inventario/${dto.prendaId}/stock`, dto).then((r) => r.data)
  },

  async updatePrice(dto: UpdatePriceDto): Promise<InventoryItemDto> {
    if (USE_MOCKS) {
      const idx = memoryInventory.findIndex((x) => x.id === dto.prendaId)
      if (idx === -1) throw new Error('Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      const updated: InventoryItemDto = {
        ...item,
        precio: dto.nuevoPrecio,
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }
    return apiClient.patch<InventoryItemDto>(`/tienda/inventario/${dto.prendaId}/precio`, dto).then((r) => r.data)
  },

  async toggleActive(prendaId: string): Promise<InventoryItemDto> {
    if (USE_MOCKS) {
      const idx = memoryInventory.findIndex((x) => x.id === prendaId)
      if (idx === -1) throw new Error('Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      const willRetire = item.estado !== 'RETIRADO'
      const updated: InventoryItemDto = {
        ...item,
        estado: computeStatus(item.stockTotal, willRetire),
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }
    return apiClient.post<InventoryItemDto>(`/tienda/inventario/${prendaId}/toggle-estado`).then((r) => r.data)
  },

  async addItem(dto: CreateInventoryItemDto): Promise<InventoryItemDto> {
    if (USE_MOCKS) {
      const total = Object.values(dto.stockPorTalla).reduce((a, b) => a + b, 0)
      const newItem: InventoryItemDto = {
        id: `inv-${Date.now()}`,
        tiendaId: 't-1',
        tiendaNombre: 'Luna Store',
        nombre: dto.nombre,
        estilo: dto.estilo,
        categoria: dto.categoria,
        precio: dto.precio,
        imagenUrl: dto.imagenUrl || '/img/productos/chaqueta-denim-oversize.jpg',
        tallasDisponibles: Object.keys(dto.stockPorTalla),
        stockPorTalla: dto.stockPorTalla,
        stockTotal: total,
        estado: computeStatus(total, false),
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory = [newItem, ...memoryInventory]
      return mockDelay(newItem)
    }
    return apiClient.post<InventoryItemDto>('/tienda/inventario', dto).then((r) => r.data)
  },
}
