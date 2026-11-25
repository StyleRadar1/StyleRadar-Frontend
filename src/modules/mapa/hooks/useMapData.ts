import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { mapService } from '../services/mapService'
import type { MapPinDto } from '../types/map.dto'

const BOGOTA_INITIAL_COORDS = { lat: 4.6533, lng: -74.0836 }

/** Hook que carga los puntos del mapa con coordenadas iniciales de Bogotá para calcular cercanía. */
export function useMapData() {
  const loader = useCallback(() => mapService.getAll(BOGOTA_INITIAL_COORDS), [])
  return useResource<MapPinDto[]>(loader, [])
}
