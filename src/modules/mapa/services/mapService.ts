import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { ALL_PINS } from '../mocks/mapData'
import type { MapPinDto } from '../types/map.dto'
import { distanciaKm, RADIO_KM, type Ubicacion } from '../utils/mapUtils'

/** Rutas del API Gateway hacia ms-geolocalización. Provisionales hasta tener el Swagger. */
const BASE = '/api/geolocation'

/**
 * Servicio del mapa: en producción consultará ms-geolocalización.
 * Los puntos siguen siendo los del mock; las búsquedas por cercanía validan como el backend
 * (400 sin ubicación, 422 radio fuera de rango, 404 tienda que ya no existe).
 */
export const mapService = {
  getAll(): Promise<MapPinDto[]> {
    return mockDelay(ALL_PINS, 300)
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
