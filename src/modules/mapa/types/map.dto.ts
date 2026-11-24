/** Tipos del módulo Mapa */

export type PinTipo = 'tienda' | 'fundacion'

/** Producto que ofrece una tienda (vista previa en la tarjeta del mapa). */
export interface MapProductDto {
  id: string
  nombre: string
  precio: number
  imagen: string
}

/** Categorías de almacén unificadas (SR-RF-18) */
export const CATEGORIAS_ALMACEN = [
  { id: 'cat-casual', nombre: 'Casual' },
  { id: 'cat-formal', nombre: 'Formal' },
  { id: 'cat-deportivo', nombre: 'Deportivo' },
  { id: 'cat-urbano', nombre: 'Urbano' },
  { id: 'cat-vintage', nombre: 'Vintage' },
  { id: 'cat-accesorios', nombre: 'Accesorios' },
  { id: 'cat-calzado', nombre: 'Calzado' },
] as const

export interface MapPinDto {
  id: string
  tipo: PinTipo
  name: string
  /** Identificador de categoría del almacén (UUID en back) */
  categoriaId?: string
  /** Categoría (e.g. 'Deportivo', 'Urbano', 'Calzado') o 'Fundación' */
  cat: string
  barrio?: string
  dir?: string
  /** Distancia aproximada en texto con coma decimal (e.g. '1,25 km') */
  d?: string
  /** Horario */
  hours?: string
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
  /** Total de prendas reportadas en el resumen del catálogo */
  totalPrendas?: number
  /** Productos destacados (solo tiendas, hasta 4 desde /catalog/summary) */
  products?: MapProductDto[]
}

export type MapFilter = 'todos' | 'tiendas' | 'fundaciones'
