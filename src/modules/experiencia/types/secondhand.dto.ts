/**
 * DTOs de ms-segunda-vida-donaciones (8093), parte C2C, vía API Gateway (8080).
 * Provisionales: se ajustan al Swagger del backend cuando esté publicado.
 */

/**
 * RF-34: estados de conservación. PENDIENTE DE ACORDAR con backend; mientras tanto se usan
 * los del prototipo. Si cambian, se ajustan solo aquí y en CONSERVACION_LABEL.
 */
export type Conservacion = 'COMO_NUEVO' | 'MUY_BUENO' | 'BUENO'
export const CONSERVACIONES: Conservacion[] = ['COMO_NUEVO', 'MUY_BUENO', 'BUENO']
export const CONSERVACION_LABEL: Record<Conservacion, string> = { COMO_NUEVO: 'Como nuevo', MUY_BUENO: 'Muy bueno', BUENO: 'Bueno' }

export type EstadoPublicacion = 'DISPONIBLE' | 'VENDIDA' | 'RETIRADA'
export const ESTADO_PUBLICACION_LABEL: Record<EstadoPublicacion, string> = { DISPONIBLE: 'Disponible', VENDIDA: 'Vendida', RETIRADA: 'Retirada' }

export const CATEGORIAS = ['Camisas', 'Camisetas', 'Suéteres', 'Chaquetas', 'Pantalones', 'Faldas', 'Vestidos', 'Calzado', 'Accesorios'] as const
export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '34', '36', '37', '38', '39', '40', '41', '42', 'Única'] as const

export interface ListingDto {
  id: string
  titulo: string
  categoria: string
  talla: string
  conservacion: Conservacion
  marca: string
  descripcion: string
  /** Pesos colombianos, entero positivo. */
  precio: number
  fotos: string[]
  estado: EstadoPublicacion
  vendedor: { id: string; nombre: string }
  barrio: string
  creadaEn: string
}

/** GET /api/second-hand/listings: solo publicaciones DISPONIBLES (RF-36). */
export interface ListingFiltersDto {
  texto?: string
  conservacion?: Conservacion[]
  talla?: string
  precioMin?: number
  precioMax?: number
}

/** POST /api/second-hand/listings (multipart: "data" en JSON y hasta 4 "files") y PUT /{id} (RF-33 a RF-35, RF-37). */
export interface ListingRequestDto {
  titulo: string
  categoria: string
  talla: string
  conservacion: Conservacion
  marca: string
  descripcion: string
  precio: number
  /** En edición: URLs de las fotos que se conservan. */
  fotosConservadas?: string[]
}

/** PATCH /api/second-hand/listings/{id}/status (RF-38 y RF-39). */
export interface ListingStatusRequestDto {
  estado: 'VENDIDA' | 'RETIRADA'
}

export const LISTING_RULES = { maxFotos: 4, precioMin: 1000, precioMax: 10_000_000, tituloMax: 60, descripcionMin: 15, descripcionMax: 500 }
