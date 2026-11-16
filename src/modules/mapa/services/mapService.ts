import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { ALL_PINS } from '../mocks/mapData'
import type { MapPinDto } from '../types/map.dto'
import { distanciaKm, RADIO_KM, type Ubicacion } from '../utils/mapUtils'

/** Rutas del API Gateway hacia ms-geolocalización / ms-tiendas */
const BASE = '/api/v1'

/**
 * Servicio del mapa: en producción consultará ms-geolocalización y almacenes.
 * Mantiene compatibilidad total con mocks para pruebas y desarrollo.
 */
export const mapService = {
  async getAll(): Promise<MapPinDto[]> {
    if (env.useMocks) {
      return mockDelay(ALL_PINS, 300)
    }
    try {
      const r = await apiClient.get<any[]>(`${BASE}/almacenes`)
      if (Array.isArray(r.data) && r.data.length > 0) {
        return r.data.map((item, idx) => {
          const isFundacion = item.tipo === 'fundacion'
          const id = item.id || item.nit || `almacen-${idx}`
          return {
            id,
            tipo: (isFundacion ? 'fundacion' : 'tienda') as 'tienda' | 'fundacion',
            name: item.nombre || item.name || 'Almacén Aliado',
            cat: item.categoria || (isFundacion ? 'Fundación' : 'Moda local'),
            barrio: item.barrio || 'Bogotá',
            dir: item.direccion || item.dir || 'Bogotá, Colombia',
            d: item.distanciaKm ? `${item.distanciaKm} km` : '1.2 km',
            hours: item.horario || 'Lun a sáb · 10:00 a 20:00',
            desc: item.descripcion || 'Punto físico en Bogotá.',
            rating: item.rating ? String(item.rating) : '4.8',
            reviews: item.reviews || 40,
            href: isFundacion ? '/donar' : `/tiendas/${id}`,
            photo: item.foto || item.photo || ALL_PINS[idx % ALL_PINS.length]?.photo || '/img/mapa/luna.jpg',
            lngLat: [
              typeof item.lng === 'number' ? item.lng : (item.longitud ?? -74.0628),
              typeof item.lat === 'number' ? item.lat : (item.latitud ?? 4.6433),
            ] as [number, number],
            phone: item.telefono,
            email: item.correo || item.email,
          }
        })
      }
      return ALL_PINS
    } catch {
      return ALL_PINS
    }
  },

  /** Ids de las tiendas y fundaciones a menos de `radioKm` de la persona. */
  async nearby(u: Ubicacion | null, radioKm: number): Promise<string[]> {
    if (!u) throw new ApiError(400, 'Falta la ubicación.')
    if (radioKm < RADIO_KM.min || radioKm > RADIO_KM.max) throw new ApiError(422, 'Radio fuera de rango.')
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('ubicacion-requerida', 400)
      failWithScenario('radio-invalido', 422)
      return mockDelay(ALL_PINS.filter((p) => distanciaKm(u, p.lngLat) <= radioKm).map((p) => p.id), 250)
    }
    const r = await apiClient.get<{ id: string }[]>(`${BASE}/almacenes`, { params: { lat: u.lat, lng: u.lng, radioKm } })
    return r.data.map((a) => a.id)
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
