import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { isStoreSuspended } from '@/modules/transacciones/services/storeSubscriptionService'
import { ITEMS } from '../mocks/items'
import { getInventoryItemByIdSync } from './inventoryService'
import type { Estilo, ItemFiltersDto, ItemResponseDto, OrdenCatalogo, ReservaDto } from '../types/item.dto'
import {
  normalizeMeasurementsPayload,
  REFERENCE_GARMENT_MEASUREMENTS,
  type GarmentSizeMeasurementDto,
} from '../types/garmentMeasurements.dto'

const ALMACEN_NOMBRE_POR_ID: Record<string, string> = {
  luna: 'Luna Store',
  't-1': 'Luna Store',
  nomada: 'Nómada Studio',
  kicks: 'Kicks Local',
  lab: 'The Local Lab',
  ropero: 'Ropero 57',
  norte: 'Norte Denim',
  tweed: 'Casa Tweed',
  antonia: 'Sastrería Antonia',
  'calle-85': 'Calle 85 Store',
  nora: 'Nora Vintage',
}

function canonicalEstilo(est?: string): string {
  const s = (est || '').toLowerCase().trim()
  if (s === 'urbano' || s === 'streetwear' || s === 'calle' || s === 'urbana') return 'urbano'
  if (s === 'formal' || s === 'elegante' || s === 'sastre') return 'formal'
  if (s === 'deportivo' || s === 'techwear' || s === 'futuro' || s === 'sport') return 'deportivo'
  if (s === 'casual' || s === 'esencial' || s === 'confort') return 'casual'
  if (s === 'vintage' || s === 'rebelde' || s === 'leather') return 'vintage'
  return s
}

function displayEstilo(est?: string): Estilo {
  const c = canonicalEstilo(est)
  if (c === 'urbano') return 'Urbano'
  if (c === 'formal') return 'Formal'
  if (c === 'deportivo') return 'Deportivo'
  if (c === 'casual') return 'Casual'
  if (c === 'vintage') return 'Vintage'
  return (est as Estilo) || 'Casual'
}

function normalizeOrden(orden?: string): OrdenCatalogo {
  const o = (orden || '').toUpperCase().trim()
  if (o === 'DISTANCIA' || o === 'CERCA' || o === 'CERCANIA') return 'DISTANCIA'
  if (o === 'REPUTACION' || o === 'REP') return 'REPUTACION'
  return 'RECIENTES'
}

/** Normaliza una prenda recibida del backend (ms-item-catalogo) al DTO del front. */
export function normalizeBackendItem(raw: Record<string, unknown>): ItemResponseDto {
  const r = raw as Record<string, any>
  const fotos: string[] = Array.isArray(r.fotografias)
    ? r.fotografias.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
    : Array.isArray(r.imagenes)
      ? r.imagenes.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
      : []
  const imagen = (typeof r.imagen === 'string' && r.imagen) || fotos[0] || ''
  const imagenes = fotos.length > 0 ? fotos : (imagen ? [imagen] : [])
  const almacenId = typeof r.almacenId === 'string' ? r.almacenId : undefined
  const storeNit = [r.storeNit, r.nitAlmacen, r.nit].find((v): v is string => typeof v === 'string' && v.length > 0)
  const tienda =
    (typeof r.tienda === 'string' && r.tienda) ||
    (typeof r.marca === 'string' && r.marca) ||
    (almacenId ? ALMACEN_NOMBRE_POR_ID[almacenId.toLowerCase()] ?? almacenId : '') ||
    ''

  return {
    id: String(r.id ?? ''),
    almacenId,
    storeNit,
    nombre: String(r.nombre ?? ''),
    tienda,
    marca: typeof r.marca === 'string' ? r.marca : tienda,
    barrio: typeof r.barrio === 'string' ? r.barrio : '',
    precio: Number(r.precio ?? 0),
    precioAnterior: typeof r.precioAnterior === 'number' ? r.precioAnterior : undefined,
    descuento: typeof r.descuento === 'number' ? r.descuento : undefined,
    estilo: displayEstilo(typeof r.estilo === 'string' ? r.estilo : undefined),
    tipo: String(r.tipo ?? ''),
    color: String(r.color ?? ''),
    coloresDisponibles: Array.isArray(r.coloresDisponibles) ? r.coloresDisponibles : undefined,
    tallas: Array.isArray(r.tallas) ? r.tallas : [],
    imagen,
    imagenSecundaria: typeof r.imagenSecundaria === 'string' ? r.imagenSecundaria : undefined,
    imagenes,
    fotografias: fotos.length > 0 ? fotos : imagenes,
    estado: typeof r.estado === 'string' ? r.estado : undefined,
    disponible: typeof r.disponible === 'boolean' ? r.disponible : undefined,
    fechaPublicacion: typeof r.fechaPublicacion === 'string' ? r.fechaPublicacion : undefined,
    motivoRechazo:
      typeof r.motivoRechazo === 'string'
        ? r.motivoRechazo
        : typeof r.motivo === 'string'
          ? r.motivo
          : undefined,
    distanciaKm: typeof r.distanciaKm === 'number' ? r.distanciaKm : 0,
    recorte: typeof r.recorte === 'string' ? r.recorte : undefined,
    tipoGancho: r.tipoGancho === 'hombros' || r.tipoGancho === 'pinzas' ? r.tipoGancho : undefined,
    anclaY: typeof r.anclaY === 'number' ? r.anclaY : undefined,
    bajada: typeof r.bajada === 'number' ? r.bajada : undefined,
    descripcion: typeof r.descripcion === 'string' ? r.descripcion : undefined,
    esNuevo: typeof r.esNuevo === 'boolean' ? r.esNuevo : undefined,
    esSegundaMano: typeof r.esSegundaMano === 'boolean' ? r.esSegundaMano : undefined,
    tryOnEligible: typeof r.tryOnEligible === 'boolean' ? r.tryOnEligible : undefined,
    noDisponibleEnProbador:
      typeof r.noDisponibleEnProbador === 'boolean'
        ? r.noDisponibleEnProbador
        : r.tryOnEligible === false
          ? true
          : undefined,
  }
}

/**
 * Extrae `{ talla: stockDisponible }` desde `GET /api/v1/inventory/garments/{prendaId}`
 * soportando tanto el objeto desglosado (`sedes[].variantes[]`) como listas planas.
 */
export function extractStockMapFromInventory(inv: unknown): Record<string, number> {
  const map: Record<string, number> = {}
  if (!inv || typeof inv !== 'object') return map
  const obj = inv as Record<string, any>

  if (Array.isArray(obj.sedes)) {
    for (const sede of obj.sedes) {
      if (!sede || sede.activo === false) continue
      const variantes = Array.isArray(sede.variantes) ? sede.variantes : []
      for (const v of variantes) {
        if (!v?.talla) continue
        const key = String(v.talla)
        const qty = Number(v.stockDisponible ?? v.cantidad ?? v.unidades ?? 0)
        map[key] = (map[key] ?? 0) + (Number.isFinite(qty) ? Math.max(0, qty) : 0)
      }
    }
    return map
  }

  const list = Array.isArray(inv) ? inv : Array.isArray(obj.tallas) ? obj.tallas : []
  for (const entry of list) {
    if (typeof entry === 'string') {
      map[entry] = (map[entry] ?? 0) + 1
    } else if (entry?.talla) {
      const key = String(entry.talla)
      const qty = Number(entry.stockDisponible ?? entry.cantidad ?? entry.unidades ?? 0)
      map[key] = (map[key] ?? 0) + (Number.isFinite(qty) ? Math.max(0, qty) : 0)
    }
  }
  return map
}

/** Devuelve las tallas con stock disponible > 0 desde la respuesta de inventario por prenda. */
export function extractAvailableTallasFromInventory(inv: unknown): string[] {
  return Object.entries(extractStockMapFromInventory(inv))
    .filter(([, qty]) => qty > 0)
    .map(([talla]) => talla)
}

const matches = (it: ItemResponseDto, f: ItemFiltersDto) => {
  // RF-99: Las prendas de un almacén con suscripción SUSPENDIDA no se muestran en el catálogo público
  if (isStoreSuspended(it.tienda)) return false

  if (f.texto) {
    const q = f.texto.toLowerCase().trim()
    const content = `${it.nombre} ${it.tipo} ${it.color} ${it.tienda} ${it.barrio ?? ''} ${it.estilo}`.toLowerCase()
    if (!content.includes(q)) return false
  }

  // Filtro por Marca / Tienda
  if (f.marca && f.marca !== 'Todas') {
    const marcaItem = (it.marca || it.tienda).toLowerCase()
    if (marcaItem !== f.marca.toLowerCase() && it.tienda.toLowerCase() !== f.marca.toLowerCase()) return false
  }

  // Filtro por Estilo (los 5 estilos unificados: Casual, Formal, Deportivo, Urbano, Vintage)
  if (f.estilo && f.estilo !== 'Todos') {
    const wanted = canonicalEstilo(f.estilo)
    const itemEst = canonicalEstilo(it.estilo)
    if (wanted !== itemEst) return false
  }

  // Categorías del encabezado superior o enlace externo
  if (f.categoria && f.categoria !== 'Todas') {
    const cat = f.categoria.toLowerCase()
    if (cat === 'calzado') {
      if (it.tipo.toLowerCase() !== 'calzado') return false
    } else if (cat === 'accesorios' || cat === 'accesorio') {
      if (it.tipo.toLowerCase() !== 'accesorio') return false
    } else {
      const wantedCat = canonicalEstilo(cat)
      const itemEst = canonicalEstilo(it.estilo)
      if (wantedCat !== itemEst) return false
    }
  }

  if (f.tipo && f.tipo !== 'Todos' && it.tipo.toLowerCase() !== f.tipo.toLowerCase()) return false
  if (f.color && f.color !== 'Todos' && it.color.toLowerCase() !== f.color.toLowerCase()) return false
  if (f.talla && f.talla !== 'Todas') {
    const wanted = f.talla.toLowerCase()
    if (!it.tallas.some((t) => t.toLowerCase() === wanted)) return false
    if (f.tipoTalla) {
      const tipoItem = it.tipo.toLowerCase()
      if (f.tipoTalla === 'PANTALON' && tipoItem !== 'pantalón' && tipoItem !== 'pantalon') return false
      if (f.tipoTalla === 'CALZADO' && tipoItem !== 'calzado') return false
      if (f.tipoTalla === 'ROPA' && (tipoItem === 'calzado' || tipoItem === 'pantalón' || tipoItem === 'pantalon')) {
        return false
      }
    }
  }
  if (f.precioMin && it.precio < f.precioMin) return false
  if (f.precioMax && it.precio > f.precioMax) return false
  if (f.origen && f.origen !== 'Todos') {
    if (f.origen === 'tiendas' && it.tienda === 'Segunda mano') return false
    if (f.origen === 'segunda-mano' && it.tienda !== 'Segunda mano') return false
  }

  return true
}

const sortItems = (list: ItemResponseDto[], orden?: string) => {
  const copy = [...list]
  const norm = normalizeOrden(orden)
  if (norm === 'DISTANCIA') {
    return copy.sort((a, b) => a.distanciaKm - b.distanciaKm)
  }
  if (norm === 'REPUTACION') {
    return copy.sort((a, b) => (b.descuento ?? 0) - (a.descuento ?? 0))
  }
  return copy
}

export const itemService = {
  async search(filters: ItemFiltersDto): Promise<ItemResponseDto[]> {
    const ordenNorm = normalizeOrden(filters.orden)
    if (env.useMocks) {
      // Ordenar por cercanía sin ubicación: el catálogo responde 400 (no sabe desde dónde medir)
      if (ordenNorm === 'DISTANCIA' && (filters.lat === undefined || filters.lng === undefined) && !filters.cercaDe) {
        failWithScenario('ubicacion-requerida', 400)
      }
      const map = new Map<string, ItemResponseDto>()
      const imageToId = new Map<string, string>()
      for (const it of ITEMS) {
        if (it.imagen && imageToId.has(it.imagen)) {
          const originalId = imageToId.get(it.imagen)
          if (import.meta.env.DEV) {
            console.warn(
              `[StyleRadar Catálogo] Prenda descartada por imagen duplicada: ID "${it.id}" ("${it.nombre}") comparte imagen con ID "${originalId}" ("${it.imagen}").`
            )
          }
          continue
        }
        if (!map.has(it.id)) {
          map.set(it.id, it)
          if (it.imagen) imageToId.set(it.imagen, it.id)
        }
      }
      const filtered = Array.from(map.values()).filter((it) => matches(it, filters))
      return mockDelay(sortItems(filtered, ordenNorm))
    }

    const params: Record<string, unknown> = { orden: ordenNorm }
    if (filters.texto) params.texto = filters.texto
    if (filters.tipo && filters.tipo !== 'Todos') params.tipo = filters.tipo
    if (filters.color && filters.color !== 'Todos') params.color = filters.color
    if (filters.marca && filters.marca !== 'Todas') params.marca = filters.marca
    if (filters.estilo && filters.estilo !== 'Todos') params.estilo = displayEstilo(filters.estilo).toUpperCase()
    if (filters.talla && filters.talla !== 'Todas') params.talla = filters.talla
    if (filters.precioMin !== undefined) params.precioMin = filters.precioMin
    if (filters.precioMax !== undefined) params.precioMax = filters.precioMax
    if (filters.lat !== undefined) params.lat = filters.lat
    if (filters.lng !== undefined) params.lng = filters.lng

    return apiClient.get<Record<string, unknown>[]>('/api/v1/garments', { params }).then((r) => {
      const normalized = (Array.isArray(r.data) ? r.data : []).map(normalizeBackendItem)
      const map = new Map<string, ItemResponseDto>()
      const imageToId = new Map<string, string>()
      for (const it of normalized) {
        if (it.imagen && imageToId.has(it.imagen)) {
          continue
        }
        if (!map.has(it.id)) {
          map.set(it.id, it)
          if (it.imagen) imageToId.set(it.imagen, it.id)
        }
      }
      return Array.from(map.values())
    })
  },

  getById(id: string): Promise<ItemResponseDto> {
    if (env.useMocks) {
      let it = ITEMS.find((x) => x.id === id)
      if (!it) {
        it = getInventoryItemByIdSync(id) ?? undefined
      }
      return it ? mockDelay(it) : Promise.reject(new ApiError(404, 'La prenda no existe.'))
    }
    return apiClient.get<Record<string, unknown>>(`/api/v1/garments/${encodeURIComponent(id)}`).then((r) => normalizeBackendItem(r.data))
  },

  /** SR-RF-16: Prendas similares (hasta 10 por mismo tipo o estilo). */
  async getSimilar(id: string): Promise<ItemResponseDto[]> {
    if (env.useMocks) {
      const current = ITEMS.find((x) => x.id === id) ?? getInventoryItemByIdSync(id)
      if (!current) return mockDelay([])
      const similars = ITEMS.filter(
        (x) =>
          x.id !== id &&
          (x.tipo.toLowerCase() === current.tipo.toLowerCase() ||
            canonicalEstilo(x.estilo) === canonicalEstilo(current.estilo))
      ).slice(0, 10)
      return mockDelay(similars)
    }
    return apiClient
      .get<Record<string, unknown>[]>(`/api/v1/garments/${encodeURIComponent(id)}/similar`)
      .then((r) => (Array.isArray(r.data) ? r.data : []).map(normalizeBackendItem).slice(0, 10))
  },

  /**
   * Reserva una unidad de la talla en la tienda por 15 minutos (ms-inventario, POST /api/v1/inventory/reservations).
   * Responde 409 si ya no quedan unidades de esa talla.
   */
  async reserve(prendaId: string, talla: string, sedeId?: string): Promise<ReservaDto> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('sin-unidades', 409)
      return mockDelay({ prendaId, talla, expiracionReserva: new Date(Date.now() + 15 * 60 * 1000).toISOString() }, 300)
    }
    const payload: { prendaId: string; talla: string; sedeId?: string } = { prendaId, talla }
    if (sedeId) payload.sedeId = sedeId
    return apiClient.post<ReservaDto>('/api/v1/inventory/reservations', payload).then((r) => r.data)
  },

  /**
   * Obtiene la guía de medidas de una prenda en cm por talla (GET /api/v1/garments/{id}/size-guide).
   * Si la tienda no registró medidas, el backend (y el fallback local) devuelve la guía de referencia.
   */
  async getGarmentSizeGuide(garmentId: string, sizes: string[] = []): Promise<GarmentSizeMeasurementDto[]> {
    if (env.useMocks) {
      const targetSizes = sizes.length > 0 ? sizes : ['XS', 'S', 'M', 'L', 'XL']
      return mockDelay(
        targetSizes.map((size) => ({
          size,
          ...(REFERENCE_GARMENT_MEASUREMENTS[size] ?? REFERENCE_GARMENT_MEASUREMENTS.M),
        })),
        80,
      )
    }
    try {
      const res = await apiClient.get<unknown>(
        `/api/v1/garments/${encodeURIComponent(garmentId)}/size-guide`,
      )
      return normalizeMeasurementsPayload(res.data)
    } catch {
      return []
    }
  },
}
