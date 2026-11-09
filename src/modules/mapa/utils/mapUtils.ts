import type { LngLatBoundsLike } from 'mapbox-gl'
import type { MapFilter, MapPinDto } from '../types/map.dto'

/** Bogotá por defecto si no hay puntos */
const BOGOTA_FALLBACK: [[number, number], [number, number]] = [
  [-74.16, 4.53],
  [-74.0, 4.77],
]

/** Filtra los pines según el filtro activo. */
export function filterPins(pins: MapPinDto[], filter: MapFilter): MapPinDto[] {
  if (filter === 'tiendas') return pins.filter((p) => p.tipo === 'tienda')
  if (filter === 'fundaciones') return pins.filter((p) => p.tipo === 'fundacion')
  return pins
}

/** Calcula los límites geográficos que encuadran todos los puntos. */
export function calcBounds(pins: MapPinDto[]): LngLatBoundsLike {
  if (!pins.length) return BOGOTA_FALLBACK
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const p of pins) {
    const [lng, lat] = p.lngLat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  if (minLng === Infinity) return BOGOTA_FALLBACK
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

/** Selecciona un pin por id. */
export function findPin(pins: MapPinDto[], id: string): MapPinDto | undefined {
  return pins.find((p) => p.id === id)
}

/** Ordena los pines por distancia ascendente (parsea "1,2 km" → 1.2). */
export function sortByDistance(pins: MapPinDto[]): MapPinDto[] {
  const parseKm = (s: string): number => {
    const m = s.match(/([\d,.]+)/)
    return m ? parseFloat(m[1].replace(',', '.')) : 999
  }
  return [...pins].sort((a, b) => parseKm(a.d) - parseKm(b.d))
}
