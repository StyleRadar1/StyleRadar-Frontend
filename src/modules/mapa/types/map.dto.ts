/** Tipos del módulo Mapa */

export type PinTipo = 'tienda' | 'fundacion'

export interface MapPinDto {
  id: string
  tipo: PinTipo
  name: string
  /** Categoría (e.g. 'Sport', 'Leather') o 'Fundación' */
  cat: string
  barrio: string
  dir: string
  /** Distancia aproximada en texto */
  d: string
  /** Horario */
  hours: string
  /** Coordenadas [lng, lat] */
  lngLat: [number, number]
  /** Ruta en la app (e.g. '/tiendas/luna') */
  href: string
  /** Color del punto (solo fundaciones) */
  color?: string
  /** Descripción breve */
  desc?: string
  /** Calificación (tiendas) */
  rating?: string
  /** Número de reseñas (tiendas) */
  reviews?: number
  /** Qué acepta (fundaciones) */
  accepts?: string[]
  /** Estadísticas [prendas, donaciones, voluntarios] (fundaciones) */
  stats?: [number, number, number]
  /** Foto del punto (archivo en public/img/mapa) */
  photo?: string
}

export type MapFilter = 'todos' | 'tiendas' | 'fundaciones'
