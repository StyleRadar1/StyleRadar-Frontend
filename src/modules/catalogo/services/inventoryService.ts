import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
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
export const resetInventoryMock = () => {
  memoryInventory = structuredClone(INVENTORY_ITEMS)
}

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
      failIfScenario('sin-permiso')
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
      failIfScenario('sin-permiso')
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
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === dto.prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1') throw new ApiError(403, 'No existe o no tienes acceso.')
      if (item.estado === 'RETIRADO') throw new ApiError(422, 'Esta acción no está disponible por ahora.')
      if (!(dto.talla in item.stockPorTalla)) {
        throw new ApiError(400, 'La talla indicada no existe en esta prenda.', { talla: 'La talla indicada no existe en esta prenda.' })
      }
      if (!Number.isInteger(dto.nuevoStock) || dto.nuevoStock < 0) {
        throw new ApiError(400, 'La cantidad debe ser un entero mayor o igual a 0.', { nuevoStock: 'La cantidad debe ser 0 o mayor.' })
      }

      const newStock = { ...item.stockPorTalla, [dto.talla]: dto.nuevoStock }
      const total = Object.values(newStock).reduce((a, b) => a + b, 0)

      const updated: InventoryItemDto = {
        ...item,
        stockPorTalla: newStock,
        stockTotal: total,
        estado: computeStatus(total, false),
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }
    return apiClient.patch<InventoryItemDto>(`/tienda/inventario/${dto.prendaId}/stock`, dto).then((r) => r.data)
  },

  async removeSize(prendaId: string, talla: string): Promise<InventoryItemDto> {
    if (USE_MOCKS) {
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1') throw new ApiError(403, 'No existe o no tienes acceso.')
      if (item.estado === 'RETIRADO') throw new ApiError(422, 'Esta acción no está disponible por ahora.')
      if (!(talla in item.stockPorTalla)) {
        throw new ApiError(400, 'La talla indicada no existe en esta prenda.', { talla: 'La talla indicada no existe en esta prenda.' })
      }
      const current = item.stockPorTalla[talla] ?? 0
      if (current > 0) {
        const msg = `La talla ${talla} aún tiene ${current} ${current === 1 ? 'unidad' : 'unidades'}. Déjala en 0 para quitarla.`
        throw new ApiError(422, msg, { talla: msg })
      }
      if (Object.keys(item.stockPorTalla).length <= 1) {
        throw new ApiError(422, 'La prenda debe conservar al menos una talla.', { talla: 'La prenda debe conservar al menos una talla.' })
      }

      const nextStock = { ...item.stockPorTalla }
      delete nextStock[talla]
      const total = Object.values(nextStock).reduce((a, b) => a + b, 0)
      const updated: InventoryItemDto = {
        ...item,
        tallasDisponibles: Object.keys(nextStock),
        stockPorTalla: nextStock,
        stockTotal: total,
        estado: computeStatus(total, false),
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }
    return apiClient.delete<InventoryItemDto>(`/tienda/inventario/${prendaId}/tallas/${encodeURIComponent(talla)}`).then((r) => r.data)
  },

  async updatePrice(dto: UpdatePriceDto): Promise<InventoryItemDto> {
    if (USE_MOCKS) {
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === dto.prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1') throw new ApiError(403, 'No existe o no tienes acceso.')
      if (item.estado === 'RETIRADO') throw new ApiError(422, 'Esta acción no está disponible por ahora.')
      if (!Number.isFinite(dto.nuevoPrecio) || dto.nuevoPrecio <= 0) {
        throw new ApiError(400, 'El precio debe ser mayor a 0.', { precio: 'El precio debe ser mayor a 0.' })
      }

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
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1') throw new ApiError(403, 'No existe o no tienes acceso.')
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
      failIfScenario('sin-permiso', 'regla')
      const fields: Record<string, string> = {}
      if (!dto.nombre.trim()) fields.nombre = 'Indica el nombre de la prenda.'
      if (!Number.isFinite(dto.precio) || dto.precio <= 0) fields.precio = 'El precio debe ser mayor a 0.'
      if (Object.values(dto.stockPorTalla).some((v) => !Number.isInteger(v) || v < 0)) {
        fields.tallas = 'Las cantidades por talla deben ser enteros mayores o iguales a 0.'
      }
      if (Object.keys(fields).length) throw new ApiError(400, 'Revisa los datos de la prenda.', fields)

      const total = Object.values(dto.stockPorTalla).reduce((a, b) => a + b, 0)
      const newItem: InventoryItemDto = {
        id: `inv-${Date.now()}`,
        tiendaId: 't-1',
        tiendaNombre: 'Luna Store',
        nombre: dto.nombre.trim(),
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
