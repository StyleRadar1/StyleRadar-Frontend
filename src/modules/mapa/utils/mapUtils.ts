import type { LngLatBoundsLike } from 'mapbox-gl'
import type { MapFilter, MapPinDto } from '../types/map.dto'

/** Bogotá por defecto si no hay puntos */
const BOGOTA_FALLBACK: [[number, number], [number, number]] = [
  [-74.16, 4.53],
  [-74.0, 4.77],
]

/** Filtra los pines según el filtro activo y categoría opcional. */
export function filterPins(pins: MapPinDto[], filter: MapFilter, categoriaId?: string): MapPinDto[] {
  let result = pins
  if (filter === 'tiendas') result = result.filter((p) => p.tipo === 'tienda')
  else if (filter === 'fundaciones') result = result.filter((p) => p.tipo === 'fundacion')
  if (categoriaId) {
    result = result.filter((p) => p.tipo === 'tienda' && p.categoriaId === categoriaId)
  }
  return result
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

/** Ordena los pines por distancia ascendente (parsea "1,25 km" → 1.25). */
export function sortByDistance(pins: MapPinDto[]): MapPinDto[] {
  const parseKm = (s?: string): number => {
    if (!s) return 999
    const m = s.match(/([\d,.]+)/)
    return m ? parseFloat(m[1].replace(',', '.')) : 999
  }
  return [...pins].sort((a, b) => parseKm(a.d) - parseKm(b.d))
}

/** Formatea kilómetros con dos decimales y coma decimal (e.g. 1.25 → "1,25 km"). */
export function formatDistanciaKm(km: number): string {
  return `${km.toFixed(2).replace('.', ',')} km`
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

/** 20 localidades oficiales de Bogotá con sus coordenadas centrales de respaldo. */
export const LOCALIDADES_BOGOTA_MAPA: Record<string, Ubicacion> = {
  'Antonio Nariño': { lat: 4.5889, lng: -74.1017 },
  'Barrios Unidos': { lat: 4.6667, lng: -74.0764 },
  Bosa: { lat: 4.6167, lng: -74.1917 },
  Chapinero: { lat: 4.6433, lng: -74.0628 },
  'Ciudad Bolívar': { lat: 4.5681, lng: -74.1603 },
  Engativá: { lat: 4.7011, lng: -74.1131 },
  Fontibón: { lat: 4.6736, lng: -74.1426 },
  Kennedy: { lat: 4.62, lng: -74.1534 },
  'La Candelaria': { lat: 4.5967, lng: -74.0728 },
  'Los Mártires': { lat: 4.6072, lng: -74.0881 },
  'Puente Aranda': { lat: 4.6167, lng: -74.1167 },
  'Rafael Uribe Uribe': { lat: 4.5667, lng: -74.1167 },
  'San Cristóbal': { lat: 4.5667, lng: -74.0833 },
  'Santa Fe': { lat: 4.6067, lng: -74.0667 },
  Suba: { lat: 4.7431, lng: -74.0886 },
  Sumapaz: { lat: 4.2667, lng: -74.2667 },
  Teusaquillo: { lat: 4.6297, lng: -74.0725 },
  Tunjuelito: { lat: 4.575, lng: -74.1333 },
  Usaquén: { lat: 4.6974, lng: -74.0305 },
  Usme: { lat: 4.4833, lng: -74.1167 },
}

export const BARRIOS_BOGOTA: Record<string, Ubicacion> = LOCALIDADES_BOGOTA_MAPA

/** Centro de un barrio a partir de sus puntos o del catálogo de barrios de Bogotá. */
export function centroBarrio(pins: MapPinDto[], barrio: string): Ubicacion | null {
  const del = pins.filter((p) => p.barrio === barrio)
  if (del.length) {
    return {
      lng: del.reduce((s, p) => s + p.lngLat[0], 0) / del.length,
      lat: del.reduce((s, p) => s + p.lngLat[1], 0) / del.length,
    }
  }
  return BARRIOS_BOGOTA[barrio] ?? null
}
