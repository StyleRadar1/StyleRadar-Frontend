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

/** Ubicación de la persona (del navegador o del centro de un barrio). */
export interface Ubicacion { lat: number; lng: number }

/** Radio de búsqueda permitido por ms-geolocalización; fuera de él responde 422. */
export const RADIO_KM = { min: 1, max: 10, inicial: 5 } as const

/** Distancia en km (Haversine), igual que la calcula ms-geolocalización. */
export function distanciaKm(u: Ubicacion, [lng, lat]: [number, number]): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(lat - u.lat)
  const dLng = rad(lng - u.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(u.lat)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Centro de un barrio a partir de sus puntos, para quien no comparte su ubicación. */
export function centroBarrio(pins: MapPinDto[], barrio: string): Ubicacion | null {
  const del = pins.filter((p) => p.barrio === barrio)
  if (!del.length) return null
  return {
    lng: del.reduce((s, p) => s + p.lngLat[0], 0) / del.length,
    lat: del.reduce((s, p) => s + p.lngLat[1], 0) / del.length,
  }
}
