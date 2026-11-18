import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { ALL_PINS } from '../mocks/mapData'
import type { MapPinDto, MapProductDto } from '../types/map.dto'
import { distanciaKm, formatDistanciaKm, RADIO_KM, type Ubicacion } from '../utils/mapUtils'

/** Rutas del API Gateway hacia ms-geolocalización / ms-item-catalogo */
const BASE = '/api/v1'

export interface MapQueryParams {
  lat?: number
  lng?: number
  radioKm?: number
  categoriaId?: string
}

export interface CatalogSummaryDto {
  totalPrendas: number
  prendas: MapProductDto[]
}

function mapAlmacenToPin(item: Record<string, any>): MapPinDto {
  const id = String(item.id ?? item.almacenId ?? '')
  const lat = typeof item.latitud === 'number' ? item.latitud : typeof item.lat === 'number' ? item.lat : 4.6433
  const lng = typeof item.longitud === 'number' ? item.longitud : typeof item.lng === 'number' ? item.lng : -74.0628
  const km = typeof item.distanciaKm === 'number' ? item.distanciaKm : undefined
  return {
    id,
    tipo: item.tipo === 'fundacion' ? 'fundacion' : 'tienda',
    name: item.nombre || item.name || '',
    categoriaId: item.categoriaId ? String(item.categoriaId) : undefined,
    cat: item.categoria || '',
    barrio: item.barrio || undefined,
    dir: item.direccion || item.dir || undefined,
    d: km !== undefined ? formatDistanciaKm(km) : undefined,
    hours: item.horario || undefined,
    desc: item.descripcion || undefined,
    rating: item.rating != null ? String(item.rating) : undefined,
    reviews: typeof item.reviews === 'number' ? item.reviews : undefined,
    href: item.tipo === 'fundacion' ? '/donar' : `/tiendas/${encodeURIComponent(id)}`,
    photo: item.foto || item.photo || undefined,
    lngLat: [lng, lat],
  }
}

function mapFundacionToPin(item: Record<string, any>): MapPinDto {
  const id = String(item.id ?? '')
  const lat = typeof item.latitud === 'number' ? item.latitud : typeof item.lat === 'number' ? item.lat : 4.6322
  const lng = typeof item.longitud === 'number' ? item.longitud : typeof item.lng === 'number' ? item.lng : -74.0673
  const km = typeof item.distanciaKm === 'number' ? item.distanciaKm : undefined
  return {
    id,
    tipo: 'fundacion',
    name: item.nombre || item.name || '',
    cat: 'Fundación',
    barrio: item.barrio || undefined,
    dir: item.direccion || item.dir || undefined,
    d: km !== undefined ? formatDistanciaKm(km) : undefined,
    hours: item.horario || undefined,
    desc: item.descripcion || undefined,
    href: '/donar',
    photo: item.foto || item.photo || undefined,
    accepts: Array.isArray(item.categorias) ? item.categorias : Array.isArray(item.accepts) ? item.accepts : undefined,
    lngLat: [lng, lat],
  }
}

/**
 * Servicio del mapa: consume ms-geolocalización y el resumen de ms-item-catalogo.
 * Mantiene compatibilidad total con mocks para pruebas y desarrollo.
 */
export const mapService = {
  async getAll(params?: MapQueryParams): Promise<MapPinDto[]> {
    if (env.useMocks) {
      const filtrados = params?.categoriaId
        ? ALL_PINS.filter((p) => p.tipo === 'tienda' && p.categoriaId === params.categoriaId)
        : ALL_PINS
      return mockDelay(filtrados, 300)
    }
    const query: Record<string, string | number> = {}
    if (params?.lat !== undefined && params?.lng !== undefined) {
      query.lat = params.lat
      query.lng = params.lng
      query.radioKm = params.radioKm ?? RADIO_KM.inicial
    }
    if (params?.categoriaId) {
      query.categoriaId = params.categoriaId
    }

    const storesRes = await apiClient.get<any[]>(`${BASE}/almacenes`, {
      params: Object.keys(query).length ? query : undefined,
    })
    const storePins = (Array.isArray(storesRes.data) ? storesRes.data : []).map(mapAlmacenToPin)

    if (params?.categoriaId) {
      return storePins
    }

    const foundCoords =
      params?.lat !== undefined && params?.lng !== undefined
        ? { lat: params.lat, lng: params.lng }
        : { lat: 4.6533, lng: -74.0836 }
    const foundationPins = await this.nearbyFoundations(foundCoords, params?.radioKm ?? RADIO_KM.max).catch(() => [])
    return [...storePins, ...foundationPins]
  },

  /** Fundaciones aliadas cercanas desde ms-geolocalización. */
  async nearbyFoundations(u: Ubicacion, radioKm: number = RADIO_KM.inicial): Promise<MapPinDto[]> {
    if (env.useMocks) {
      return mockDelay(
        ALL_PINS.filter((p) => p.tipo === 'fundacion' && distanciaKm(u, p.lngLat) <= radioKm),
        200,
      )
    }
    const r = await apiClient.get<any[]>(`${BASE}/fundaciones/cercanas`, {
      params: { lat: u.lat, lng: u.lng, radioKm },
    })
    return (Array.isArray(r.data) ? r.data : []).map(mapFundacionToPin)
  },

  /** Ids de las tiendas y fundaciones a menos de `radioKm` de la persona. */
  async nearby(u: Ubicacion | null, radioKm: number, categoriaId?: string): Promise<string[]> {
    if (!u) throw new ApiError(400, 'Falta la ubicación.')
    if (radioKm < RADIO_KM.min || radioKm > RADIO_KM.max) throw new ApiError(422, 'Radio fuera de rango.')
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('ubicacion-requerida', 400)
      failWithScenario('radio-invalido', 422)
      return mockDelay(
        ALL_PINS.filter(
          (p) => distanciaKm(u, p.lngLat) <= radioKm && (!categoriaId || (p.tipo === 'tienda' && p.categoriaId === categoriaId)),
        ).map((p) => p.id),
        250,
      )
    }
    const [almacenesRes, fundacionesRes] = await Promise.all([
      apiClient.get<{ id: string }[]>(`${BASE}/almacenes`, {
        params: { lat: u.lat, lng: u.lng, radioKm, ...(categoriaId ? { categoriaId } : {}) },
      }),
      categoriaId
        ? Promise.resolve([] as MapPinDto[])
        : this.nearbyFoundations(u, radioKm).catch(() => [] as MapPinDto[]),
    ])
    const storeIds = (Array.isArray(almacenesRes.data) ? almacenesRes.data : []).map((a) => String(a.id))
    const foundationIds = fundacionesRes.map((f) => f.id)
    return [...storeIds, ...foundationIds]
  },

  /** Resumen del catálogo de una tienda desde el mapa (total y hasta 4 prendas). */
  async getCatalogSummary(almacenId: string): Promise<CatalogSummaryDto> {
    if (env.useMocks) {
      const pin = ALL_PINS.find((p) => p.id === almacenId)
      const productos = (pin?.products ?? []).slice(0, 4)
      return mockDelay({ totalPrendas: pin?.products?.length ?? 0, prendas: productos }, 150)
    }
    const r = await apiClient.get<{ totalPrendas?: number; prendas?: any[] }>(
      `${BASE}/almacenes/${encodeURIComponent(almacenId)}/catalogo/resumen`,
    )
    const rawPrendas = Array.isArray(r.data?.prendas) ? r.data.prendas : []
    const prendas: MapProductDto[] = rawPrendas.slice(0, 4).map((p) => ({
      id: String(p.id ?? ''),
      nombre: p.nombre || '',
      precio: Number(p.precio ?? 0),
      imagen: (Array.isArray(p.fotografias) && p.fotografias[0]) || p.imagenUrl || p.imagen || '',
    }))
    return {
      totalPrendas: typeof r.data?.totalPrendas === 'number' ? r.data.totalPrendas : prendas.length,
      prendas,
    }
  },

  /** Distancia en km a una tienda; 404 si la tienda ya no existe. */
  async distance(id: string, u: Ubicacion): Promise<number> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('tienda-retirada', 404)
      const pin = ALL_PINS.find((p) => p.id === id)
      if (!pin) throw new ApiError(404, 'No existe la tienda.')
      return mockDelay(Math.round(distanciaKm(u, pin.lngLat) * 100) / 100, 150)
    }
    const r = await apiClient.get<{ kilometros: number }>(`${BASE}/almacenes/${encodeURIComponent(id)}/distancia`, { params: { lat: u.lat, lng: u.lng } })
    return r.data.kilometros
  },
}
