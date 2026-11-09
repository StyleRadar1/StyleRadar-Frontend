import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { mapService } from '../services/mapService'
import type { MapPinDto } from '../types/map.dto'

/** Hook que carga los puntos del mapa. */
export function useMapData() {
  const loader = useCallback(() => mapService.getAll(), [])
  return useResource<MapPinDto[]>(loader, [])
}
