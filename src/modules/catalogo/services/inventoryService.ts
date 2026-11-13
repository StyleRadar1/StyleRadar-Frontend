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
    return apiClient.get<InventoryItemDto[]>('/api/v1/inventario/prenda', { params }).then((r) => r.data)
  },

  async getSummary(tiendaId?: string): Promise<InventorySummaryDto> {
    if (USE_MOCKS) {
      const list = tiendaId
        ? memoryInventory.filter((x) => x.tiendaId === tiendaId)
        : memoryInventory
      return mockDelay(computeSummary(list))
    }
    const params = tiendaId ? { tiendaId } : undefined
    return apiClient.get<InventorySummaryDto>('/api/v1/inventario/resumen', { params }).then((r) => r.data)
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
    return apiClient.patch<InventoryItemDto>(`/api/v1/inventario/prenda/${dto.prendaId}/stock`, dto).then((r) => r.data)
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
    return apiClient.patch<InventoryItemDto>(`/api/v1/inventario/prenda/${dto.prendaId}/precio`, dto).then((r) => r.data)
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
    return apiClient.post<InventoryItemDto>(`/api/v1/inventario/prenda/${prendaId}/toggle-estado`).then((r) => r.data)
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
    return apiClient.post<InventoryItemDto>('/api/v1/inventario/prenda', dto).then((r) => r.data)
  },

  async deleteItem(prendaId: string): Promise<void> {
    if (USE_MOCKS) {
      memoryInventory = memoryInventory.filter((x) => x.id !== prendaId)
      return mockDelay(undefined)
    }
    return apiClient.delete(`/api/v1/inventario/prenda/${prendaId}`).then(() => undefined)
  },
}

export function getStoreInventoryItemsSync(storeName: string): import('../types/item.dto').ItemResponseDto[] {
  const normStore = (storeName || '').toLowerCase()
  return memoryInventory
    .filter(
      (inv) =>
        (inv.tiendaNombre.toLowerCase() === normStore ||
          (normStore.includes('luna') && inv.tiendaId === 't-1')) &&
        inv.estado !== 'RETIRADO'
    )
    .map((inv) => ({
      id: inv.id,
      nombre: inv.nombre,
      tienda: inv.tiendaNombre || storeName,
      barrio: 'Chapinero',
      precio: inv.precio,
      estilo: (inv.estilo as import('../types/item.dto').Estilo) || 'Streetwear',
      tipo:
        inv.categoria === 'Pantalones'
          ? 'Pantalón'
          : inv.categoria === 'Chaquetas'
          ? 'Chaqueta'
          : inv.categoria === 'Buzos'
          ? 'Buzo'
          : inv.categoria === 'Vestidos'
          ? 'Vestido'
          : inv.categoria === 'Camisas'
          ? 'Camisa'
          : inv.categoria,
      color: 'Negro',
      tallas: inv.tallasDisponibles,
      imagen: inv.imagenUrl,
      distanciaKm: 1.2,
    }))
}

export function getInventoryItemByIdSync(id: string): import('../types/item.dto').ItemResponseDto | null {
  const inv = memoryInventory.find((x) => x.id === id)
  if (!inv) return null
  return {
    id: inv.id,
    nombre: inv.nombre,
    tienda: inv.tiendaNombre,
    barrio: 'Chapinero',
    precio: inv.precio,
    estilo: (inv.estilo as import('../types/item.dto').Estilo) || 'Streetwear',
    tipo:
      inv.categoria === 'Pantalones'
        ? 'Pantalón'
        : inv.categoria === 'Chaquetas'
        ? 'Chaqueta'
        : inv.categoria === 'Buzos'
        ? 'Buzo'
        : inv.categoria === 'Vestidos'
        ? 'Vestido'
        : inv.categoria,
    color: 'Negro',
    tallas: inv.tallasDisponibles,
    imagen: inv.imagenUrl,
    distanciaKm: 1.2,
  }
}
