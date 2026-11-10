import { mockDelay } from '@/modules/core/api/mock'
import { ALL_PINS } from '../mocks/mapData'
import type { MapPinDto } from '../types/map.dto'

/**
 * Servicio del mapa: en producción consultará el ms-catalogo (geolocation).
 * De momento devuelve los mocks con latencia simulada.
 */
export const mapService = {
  getAll(): Promise<MapPinDto[]> {
    return mockDelay(ALL_PINS, 300)
  },
}
