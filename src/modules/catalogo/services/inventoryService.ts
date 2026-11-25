import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { INVENTORY_ITEMS } from '../mocks/inventory'
import { extractStockMapFromInventory } from './itemService'
import type { Estilo, ItemResponseDto } from '../types/item.dto'
import type {
  InventoryItemDto,
  InventorySummaryDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  UpdateStockDto,
  UpdatePriceDto,
  PrendaRequestDto,
  InventarioLoteRequestDto,
  PublicationStatus,
} from '../types/inventory.dto'

const DEFAULT_STORE_ID = 'luna'
const DEFAULT_STORE_NAME = 'Luna Store'
const DEFAULT_SEDE_ID = 'sede-1'
const DEFAULT_PHOTO = '/img/productos/chaqueta-denim-oversize.jpg'
export const MAX_GARMENT_PRICE = 10_000_000
export const MAX_GARMENT_PHOTOS = 5
export const MAX_PHOTO_URL_LEN = 300

// Copia mutable en memoria para persistencia local de la sesión de prueba
let memoryInventory: InventoryItemDto[] = structuredClone(INVENTORY_ITEMS)
export const resetInventoryMock = () => {
  memoryInventory = structuredClone(INVENTORY_ITEMS)
}

function computeStatus(total: number, retired: boolean): InventoryItemDto['estado'] {
  if (retired) return 'RETIRADO'
  if (total === 0) return 'AGOTADA'
  if (total <= 3) return 'ULTIMAS_UNIDADES'
  return 'DISPONIBLE'
}

function computeSummary(items: InventoryItemDto[]): InventorySummaryDto {
  const activas = items.filter((x) => x.estado !== 'RETIRADO')
  const totalUnidades = activas.reduce((acc, curr) => acc + curr.stockTotal, 0)
  const bajoStock = activas.filter((x) => x.estado === 'ULTIMAS_UNIDADES').length
  const agotados = activas.filter((x) => x.estado === 'AGOTADA').length

  return {
    totalPrendas: items.length,
    totalUnidades,
    bajoStock,
    agotados,
    activas: activas.length,
  }
}

export function validatePrendaFields(data: {
  nombre: string
  tipo?: string
  color?: string
  estilo: string
  precio: number
  fotografias?: string[]
  requirePhoto?: boolean
}): Record<string, string> {
  const fields: Record<string, string> = {}
  const nom = (data.nombre ?? '').trim()
  if (!nom) {
    fields.nombre = 'Indica el nombre de la prenda.'
  } else if (nom.length < 3 || nom.length > 60) {
    fields.nombre = 'El nombre debe tener entre 3 y 60 caracteres.'
  }
  const tipo = (data.tipo ?? '').trim()
  if (!tipo || tipo.length > 20) {
    fields.tipo = 'Selecciona un tipo de prenda válido (máximo 20 caracteres).'
  }
  const color = (data.color ?? '').trim()
  if (!color || color.length > 20) {
    fields.color = 'Selecciona un color válido (máximo 20 caracteres).'
  }
  const estilo = (data.estilo ?? '').trim()
  if (!estilo || estilo.length > 20) {
    fields.estilo = 'Selecciona un estilo válido (máximo 20 caracteres).'
  }
  if (!Number.isFinite(data.precio) || data.precio <= 0 || data.precio > MAX_GARMENT_PRICE) {
    fields.precio = `El precio debe estar entre $1 y $${MAX_GARMENT_PRICE.toLocaleString('es-CO')}.`
  }
  const fotos = (data.fotografias ?? []).filter(Boolean)
  if (data.requirePhoto && fotos.length === 0) {
    fields.fotografias = 'Agrega al menos una fotografía (máximo 5).'
  } else if (fotos.length > MAX_GARMENT_PHOTOS) {
    fields.fotografias = `Máximo ${MAX_GARMENT_PHOTOS} fotografías por prenda.`
  } else if (fotos.some((u) => !u.startsWith('data:') && u.length > MAX_PHOTO_URL_LEN)) {
    fields.fotografias = `Cada URL de foto puede tener máximo ${MAX_PHOTO_URL_LEN} caracteres.`
  }
  return fields
}

function normalizeBackendInventoryItem(
  prenda: Record<string, any>,
  stockPorTalla: Record<string, number> = {},
  sedeId = DEFAULT_SEDE_ID
): InventoryItemDto {
  const fotos: string[] = Array.isArray(prenda.fotografias)
    ? prenda.fotografias
    : prenda.imagenUrl
      ? [prenda.imagenUrl]
      : [DEFAULT_PHOTO]
  const total = Object.values(stockPorTalla).reduce((a, b) => a + b, 0)
  const retired = prenda.estado === 'RETIRADA' || prenda.estado === 'RETIRADO'
  const statusFromBack =
    prenda.estadoInventario === 'SUSPENDIDO' || prenda.estado === 'SUSPENDIDO'
      ? 'SUSPENDIDO'
      : computeStatus(total, retired)

  return {
    id: String(prenda.id ?? ''),
    tiendaId: String(prenda.almacenId ?? prenda.tiendaId ?? DEFAULT_STORE_ID),
    tiendaNombre: String(prenda.marca ?? prenda.tiendaNombre ?? DEFAULT_STORE_NAME),
    sedeId,
    nombre: String(prenda.nombre ?? ''),
    tipo: String(prenda.tipo ?? prenda.categoria ?? 'Chaqueta'),
    color: String(prenda.color ?? 'Negro'),
    marca: String(prenda.marca ?? DEFAULT_STORE_NAME),
    estilo: String(prenda.estilo ?? 'Casual'),
    categoria: String(prenda.tipo ?? prenda.categoria ?? 'Chaqueta'),
    precio: Number(prenda.precio ?? 0),
    imagenUrl: fotos[0] || DEFAULT_PHOTO,
    imagenes: fotos.slice(0, MAX_GARMENT_PHOTOS),
    fotografias: fotos.slice(0, MAX_GARMENT_PHOTOS),
    tallasDisponibles: Object.keys(stockPorTalla),
    stockPorTalla,
    stockTotal: total,
    estado: statusFromBack,
    estadoPublicacion: (prenda.estado as PublicationStatus) || undefined,
    motivoRechazo:
      typeof prenda.motivoRechazo === 'string'
        ? prenda.motivoRechazo
        : typeof prenda.motivo === 'string'
          ? prenda.motivo
          : undefined,
    actualizadoEn: String(prenda.fechaPublicacion ?? prenda.actualizadoEn ?? new Date().toISOString()),
  }
}

export const inventoryService = {
  async getStoreInventory(tiendaId = DEFAULT_STORE_ID, sedeId = DEFAULT_SEDE_ID): Promise<InventoryItemDto[]> {
    if (env.useMocks) {
      failIfScenario('sin-permiso')
      const list = tiendaId && tiendaId !== DEFAULT_STORE_ID && tiendaId !== 't-1'
        ? memoryInventory.filter((x) => x.tiendaId === tiendaId)
        : memoryInventory
      return mockDelay(list)
    }
    const [catalogoRes, disponiblesRes] = await Promise.all([
      apiClient.get<Record<string, any>[]>(`/api/v1/stores/${encodeURIComponent(tiendaId)}/catalog`),
      apiClient.get<Record<string, any>[]>(`/api/v1/inventory/branches/${encodeURIComponent(sedeId)}/available`).catch(() => ({ data: [] as Record<string, any>[] })),
    ])
    const prendas = Array.isArray(catalogoRes.data) ? catalogoRes.data : []
    const disponiblesMap = new Map<string, Record<string, number>>()
    if (Array.isArray(disponiblesRes.data)) {
      for (const row of disponiblesRes.data) {
        const pid = String(row.prendaId ?? row.id ?? '')
        if (!pid) continue
        if (Array.isArray(row.tallas)) {
          const map: Record<string, number> = {}
          for (const t of row.tallas) map[String(t.talla)] = Number(t.cantidad ?? t.unidades ?? 0)
          disponiblesMap.set(pid, map)
        } else if (row.stockPorTalla) {
          disponiblesMap.set(pid, row.stockPorTalla)
        }
      }
    }
    const items = await Promise.all(
      prendas.map(async (p) => {
        const pid = String(p.id ?? '')
        let stock = disponiblesMap.get(pid)
        if (!stock) {
          try {
            const inv = await apiClient.get<any>(`/api/v1/inventory/garments/${encodeURIComponent(pid)}`).then((r) => r.data)
            stock = extractStockMapFromInventory(inv)
          } catch {
            stock = {}
          }
        }
        return normalizeBackendInventoryItem(p, stock, sedeId)
      })
    )
    return items
  },

  async getSummary(tiendaId?: string): Promise<InventorySummaryDto> {
    if (env.useMocks) {
      failIfScenario('sin-permiso')
      const list = tiendaId && tiendaId !== DEFAULT_STORE_ID && tiendaId !== 't-1'
        ? memoryInventory.filter((x) => x.tiendaId === tiendaId)
        : memoryInventory
      return mockDelay(computeSummary(list))
    }
    const items = await this.getStoreInventory(tiendaId || DEFAULT_STORE_ID)
    return computeSummary(items)
  },

  async updateStock(dto: UpdateStockDto): Promise<InventoryItemDto> {
    if (env.useMocks) {
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === dto.prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1' && item.tiendaId !== DEFAULT_STORE_ID) {
        throw new ApiError(403, 'No existe o no tienes acceso.')
      }
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

    const sedeId = dto.sedeId || DEFAULT_SEDE_ID
    const res = await apiClient
      .patch<Record<string, any>>(
        `/api/v1/inventory/garments/${encodeURIComponent(dto.prendaId)}/branches/${encodeURIComponent(sedeId)}/sizes/${encodeURIComponent(dto.talla)}`,
        { unidades: dto.nuevoStock }
      )
      .then((r) => r.data)
    if (res && res.id && res.stockPorTalla) return res as InventoryItemDto
    const prenda = await apiClient.get<Record<string, any>>(`/api/v1/garments/${encodeURIComponent(dto.prendaId)}`).then((r) => r.data)
    const inv = await apiClient.get<any>(`/api/v1/inventory/garments/${encodeURIComponent(dto.prendaId)}`).then((r) => r.data).catch(() => [])
    const stockMap: Record<string, number> = { [dto.talla]: dto.nuevoStock }
    const list = Array.isArray(inv) ? inv : Array.isArray(inv?.tallas) ? inv.tallas : []
    for (const entry of list) {
      if (entry?.talla) stockMap[String(entry.talla)] = Number(entry.cantidad ?? entry.unidades ?? 0)
    }
    return normalizeBackendInventoryItem(prenda, stockMap, sedeId)
  },

  async removeSize(prendaId: string, talla: string): Promise<InventoryItemDto> {
    if (env.useMocks) {
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1' && item.tiendaId !== DEFAULT_STORE_ID) {
        throw new ApiError(403, 'No existe o no tienes acceso.')
      }
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
    return this.updateStock({ prendaId, talla, nuevoStock: 0 })
  },

  /** SR-RF-53: Modificar precio de la prenda mediante PUT /api/v1/garments/{id}. */
  async updatePrice(dto: UpdatePriceDto): Promise<InventoryItemDto> {
    if (!Number.isFinite(dto.nuevoPrecio) || dto.nuevoPrecio <= 0 || dto.nuevoPrecio > MAX_GARMENT_PRICE) {
      throw new ApiError(400, 'El precio debe ser mayor a 0.', { precio: 'El precio debe ser mayor a 0.' })
    }
    if (env.useMocks) {
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === dto.prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1' && item.tiendaId !== DEFAULT_STORE_ID) {
        throw new ApiError(403, 'No existe o no tienes acceso.')
      }
      if (item.estado === 'RETIRADO') throw new ApiError(422, 'Esta acción no está disponible por ahora.')

      const updated: InventoryItemDto = {
        ...item,
        precio: dto.nuevoPrecio,
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }
    const current = await apiClient.get<Record<string, any>>(`/api/v1/garments/${encodeURIComponent(dto.prendaId)}`).then((r) => r.data)
    const body: PrendaRequestDto = {
      almacenId: String(current.almacenId ?? DEFAULT_STORE_ID),
      nombre: String(current.nombre ?? ''),
      tipo: String(current.tipo ?? 'Chaqueta'),
      color: String(current.color ?? 'Negro'),
      marca: String(current.marca ?? DEFAULT_STORE_NAME),
      estilo: String(current.estilo ?? 'Casual'),
      precio: dto.nuevoPrecio,
      fotografias: Array.isArray(current.fotografias) && current.fotografias.length ? current.fotografias : [DEFAULT_PHOTO],
    }
    const updatedPrenda = await apiClient.put<Record<string, any>>(`/api/v1/garments/${encodeURIComponent(dto.prendaId)}`, body).then((r) => r.data)
    return normalizeBackendInventoryItem(updatedPrenda)
  },

  /** SR-RF-55: Editar prenda del catálogo (PUT /api/v1/garments/{id}). Si estaba RECHAZADA vuelve a PENDIENTE. */
  async updateItem(dto: UpdateInventoryItemDto): Promise<InventoryItemDto> {
    const fields = validatePrendaFields({
      nombre: dto.nombre,
      tipo: dto.tipo,
      color: dto.color,
      estilo: dto.estilo,
      precio: dto.precio,
      fotografias: dto.fotografias,
      requirePhoto: !env.useMocks,
    })
    if (Object.keys(fields).length) {
      const firstMsg = Object.values(fields)[0]
      throw new ApiError(400, firstMsg, fields)
    }

    if (env.useMocks) {
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === dto.prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1' && item.tiendaId !== DEFAULT_STORE_ID) {
        throw new ApiError(403, 'No existe o no tienes acceso.')
      }
      if (item.estado === 'RETIRADO') throw new ApiError(422, 'Esta acción no está disponible por ahora.')

      const fotos = dto.fotografias.length ? dto.fotografias.slice(0, MAX_GARMENT_PHOTOS) : [item.imagenUrl]
      const nextPub: PublicationStatus | undefined =
        item.estadoPublicacion === 'RECHAZADA' ? 'PENDIENTE' : item.estadoPublicacion
      const updated: InventoryItemDto = {
        ...item,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo.trim(),
        categoria: dto.tipo.trim(),
        color: dto.color.trim(),
        marca: DEFAULT_STORE_NAME,
        estilo: dto.estilo.trim(),
        precio: dto.precio,
        imagenUrl: fotos[0],
        imagenes: fotos,
        fotografias: fotos,
        estadoPublicacion: nextPub,
        motivoRechazo: nextPub === 'PENDIENTE' ? undefined : item.motivoRechazo,
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }

    const body: PrendaRequestDto = {
      almacenId: DEFAULT_STORE_ID,
      nombre: dto.nombre.trim(),
      tipo: dto.tipo.trim(),
      color: dto.color.trim(),
      estilo: dto.estilo.trim(),
      precio: dto.precio,
      fotografias: dto.fotografias.slice(0, MAX_GARMENT_PHOTOS),
    }
    const updatedPrenda = await apiClient
      .put<Record<string, any>>(`/api/v1/garments/${encodeURIComponent(dto.prendaId)}`, body)
      .then((r) => r.data)
    return normalizeBackendInventoryItem(updatedPrenda)
  },

  /** SR-RF-58: Retirar prenda del catálogo con DELETE /api/v1/garments/{id}. */
  async toggleActive(prendaId: string): Promise<InventoryItemDto> {
    if (env.useMocks) {
      failIfScenario('sin-permiso', 'regla')
      const idx = memoryInventory.findIndex((x) => x.id === prendaId)
      if (idx === -1) throw new ApiError(404, 'Prenda no encontrada en el inventario.')

      const item = memoryInventory[idx]
      if (item.tiendaId && item.tiendaId !== 't-1' && item.tiendaId !== DEFAULT_STORE_ID) {
        throw new ApiError(403, 'No existe o no tienes acceso.')
      }
      const willRetire = item.estado !== 'RETIRADO'
      const updated: InventoryItemDto = {
        ...item,
        estado: computeStatus(item.stockTotal, willRetire),
        estadoPublicacion: willRetire ? 'RETIRADA' : 'APROBADA',
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory[idx] = updated
      return mockDelay(updated)
    }
    await apiClient.delete(`/api/v1/garments/${encodeURIComponent(prendaId)}`)
    const prenda = await apiClient.get<Record<string, any>>(`/api/v1/garments/${encodeURIComponent(prendaId)}`).then((r) => r.data).catch(() => ({ id: prendaId, estado: 'RETIRADA' }))
    return normalizeBackendInventoryItem(prenda)
  },

  /** SR-RF-50, SR-RF-51, SR-RF-52, SR-RF-54: Publicar prenda (POST /prendas + POST /inventario/lote). */
  async addItem(dto: CreateInventoryItemDto): Promise<InventoryItemDto> {
    const tipo = (dto.tipo || dto.categoria || 'Chaqueta').trim()
    const color = (dto.color || 'Negro').trim()
    const fotos = (dto.fotografias?.length ? dto.fotografias : dto.imagenes?.length ? dto.imagenes : dto.imagenUrl ? [dto.imagenUrl] : []).filter(Boolean)

    const fields = validatePrendaFields({
      nombre: dto.nombre,
      tipo,
      color,
      estilo: dto.estilo,
      precio: dto.precio,
      fotografias: fotos,
      requirePhoto: !env.useMocks,
    })
    if (Object.values(dto.stockPorTalla).some((v) => !Number.isInteger(v) || v < 0)) {
      fields.tallas = 'Las cantidades por talla deben ser enteros mayores o iguales a 0.'
    }
    if (Object.keys(fields).length) {
      const firstMsg = fields.nombre || Object.values(fields)[0]
      throw new ApiError(400, firstMsg, fields)
    }

    if (env.useMocks) {
      failIfScenario('sin-permiso', 'regla')
      const total = Object.values(dto.stockPorTalla).reduce((a, b) => a + b, 0)
      const finalFotos = fotos.length > 0 ? fotos.slice(0, MAX_GARMENT_PHOTOS) : [DEFAULT_PHOTO]
      const newItem: InventoryItemDto = {
        id: `inv-${Date.now()}`,
        tiendaId: 't-1',
        tiendaNombre: DEFAULT_STORE_NAME,
        sedeId: dto.sedeId ?? DEFAULT_SEDE_ID,
        nombre: dto.nombre.trim(),
        tipo,
        color,
        marca: DEFAULT_STORE_NAME,
        estilo: dto.estilo,
        categoria: tipo,
        tipoPrenda: dto.tipoPrenda ?? 'ROPA',
        precio: dto.precio,
        imagenUrl: finalFotos[0],
        imagenes: finalFotos,
        fotografias: finalFotos,
        tallasDisponibles: Object.keys(dto.stockPorTalla),
        stockPorTalla: dto.stockPorTalla,
        stockTotal: total,
        estado: computeStatus(total, false),
        estadoPublicacion: 'PENDIENTE',
        actualizadoEn: new Date().toISOString(),
      }
      memoryInventory = [newItem, ...memoryInventory]
      return mockDelay(newItem)
    }

    const prendaPayload: PrendaRequestDto = {
      almacenId: DEFAULT_STORE_ID,
      nombre: dto.nombre.trim(),
      tipo,
      color,
      estilo: dto.estilo.trim(),
      precio: dto.precio,
      fotografias: fotos.slice(0, MAX_GARMENT_PHOTOS),
    }
    const createdPrenda = await apiClient.post<Record<string, any>>('/api/v1/garments', prendaPayload).then((r) => r.data)

    const lotePayload: InventarioLoteRequestDto = {
      prendaId: String(createdPrenda.id),
      sedeId: dto.sedeId ?? DEFAULT_SEDE_ID,
      tipoPrenda: dto.tipoPrenda ?? 'ROPA',
      tallas: Object.entries(dto.stockPorTalla).map(([talla, cantidad]) => ({ talla, cantidad })),
      fechaPublicacion:
        typeof createdPrenda.fechaPublicacion === 'string'
          ? createdPrenda.fechaPublicacion
          : new Date().toISOString(),
    }
    await apiClient.post('/api/v1/inventory/batch', lotePayload)

    return normalizeBackendInventoryItem(createdPrenda, dto.stockPorTalla, lotePayload.sedeId)
  },

  async deleteItem(prendaId: string): Promise<void> {
    if (env.useMocks) {
      memoryInventory = memoryInventory.filter((x) => x.id !== prendaId)
      return mockDelay(undefined)
    }
    return apiClient.delete(`/api/v1/garments/${encodeURIComponent(prendaId)}`).then(() => undefined)
  },
}

function mapInvToItem(inv: InventoryItemDto, fallbackStore?: string): ItemResponseDto {
  const tipo =
    inv.tipo ||
    (inv.categoria === 'Pantalones'
      ? 'Pantalón'
      : inv.categoria === 'Chaquetas'
      ? 'Chaqueta'
      : inv.categoria === 'Buzos'
      ? 'Buzo'
      : inv.categoria === 'Vestidos'
      ? 'Vestido'
      : inv.categoria === 'Camisas'
      ? 'Camisa'
      : inv.categoria)

  return {
    id: inv.id,
    almacenId: inv.tiendaId,
    nombre: inv.nombre,
    tienda: inv.tiendaNombre || fallbackStore || DEFAULT_STORE_NAME,
    marca: inv.marca || inv.tiendaNombre || DEFAULT_STORE_NAME,
    barrio: 'Chapinero',
    precio: inv.precio,
    estilo: (inv.estilo as Estilo) || 'Casual',
    tipo,
    color: inv.color || 'Negro',
    tallas: inv.tallasDisponibles,
    imagen: inv.imagenUrl,
    imagenes: inv.fotografias?.length ? inv.fotografias : inv.imagenes?.length ? inv.imagenes : [inv.imagenUrl],
    fotografias: inv.fotografias?.length ? inv.fotografias : [inv.imagenUrl],
    estado: inv.estadoPublicacion,
    motivoRechazo: inv.motivoRechazo,
    distanciaKm: 1.2,
  }
}

export function getStoreInventoryItemsSync(storeName: string): ItemResponseDto[] {
  const normStore = (storeName || '').toLowerCase()
  return memoryInventory
    .filter(
      (inv) =>
        (inv.tiendaNombre.toLowerCase() === normStore ||
          (normStore.includes('luna') && inv.tiendaId === 't-1')) &&
        inv.estado !== 'RETIRADO'
    )
    .map((inv) => mapInvToItem(inv, storeName))
}

export function getInventoryItemByIdSync(id: string): ItemResponseDto | null {
  const inv = memoryInventory.find((x) => x.id === id)
  return inv ? mapInvToItem(inv) : null
}
