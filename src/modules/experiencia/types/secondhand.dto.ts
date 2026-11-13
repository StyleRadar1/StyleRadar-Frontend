/**
 * DTOs oficiales de ms-segunda-vida-donaciones.
 * Rutas base: /api/v1/segunda-mano y /api/v1/donaciones
 */

/** Enums oficiales del backend */
export type GarmentType = 'UPPER' | 'LOWER' | 'DRESS' | 'FOOTWEAR' | 'ACCESSORY'
export const GARMENT_TYPES: GarmentType[] = ['UPPER', 'LOWER', 'DRESS', 'FOOTWEAR', 'ACCESSORY']
export const GARMENT_TYPE_LABEL: Record<GarmentType, string> = {
  UPPER: 'Superior',
  LOWER: 'Inferior',
  DRESS: 'Vestido / Enterizo',
  FOOTWEAR: 'Calzado',
  ACCESSORY: 'Accesorio',
}

export type SizeEnum = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'ONE_SIZE'
export const SIZES_ENUM: SizeEnum[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE_SIZE']
export const SIZE_LABEL: Record<SizeEnum, string> = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
  ONE_SIZE: 'Talla única',
}

export type StyleEnum = 'CASUAL' | 'FORMAL' | 'SPORTY' | 'URBAN' | 'VINTAGE'
export const STYLES_ENUM: StyleEnum[] = ['CASUAL', 'FORMAL', 'SPORTY', 'URBAN', 'VINTAGE']
export const STYLE_LABEL: Record<StyleEnum, string> = {
  CASUAL: 'Casual',
  FORMAL: 'Formal',
  SPORTY: 'Deportivo',
  URBAN: 'Urbano',
  VINTAGE: 'Vintage',
}

export type ConservationStatus = 'NEW_WITH_TAGS' | 'LIKE_NEW' | 'GOOD_CONDITION' | 'ACCEPTABLE'
export const CONSERVATION_STATUSES: ConservationStatus[] = ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD_CONDITION', 'ACCEPTABLE']
export const CONSERVATION_STATUS_LABEL: Record<ConservationStatus, string> = {
  NEW_WITH_TAGS: 'Nuevo con etiquetas',
  LIKE_NEW: 'Como nuevo',
  GOOD_CONDITION: 'Buen estado',
  ACCEPTABLE: 'Aceptable',
}

/** 20 localidades oficiales de Bogotá */
export type LocalidadEnum =
  | 'USAQUEN'
  | 'CHAPINERO'
  | 'SANTA_FE'
  | 'SAN_CRISTOBAL'
  | 'USME'
  | 'TUNJUELITO'
  | 'BOSA'
  | 'KENNEDY'
  | 'FONTIBON'
  | 'ENGATIVA'
  | 'SUBA'
  | 'BARRIOS_UNIDOS'
  | 'TEUSAQUILLO'
  | 'LOS_MARTIRES'
  | 'ANTONIO_NARINO'
  | 'PUENTE_ARANDA'
  | 'LA_CANDELARIA'
  | 'RAFAEL_URIBE_URIBE'
  | 'CIUDAD_BOLIVAR'
  | 'SUMAPAZ'

export const LOCALIDADES_BOGOTA: { id: LocalidadEnum; nombre: string }[] = [
  { id: 'USAQUEN', nombre: 'Usaquén' },
  { id: 'CHAPINERO', nombre: 'Chapinero' },
  { id: 'SANTA_FE', nombre: 'Santa Fe' },
  { id: 'SAN_CRISTOBAL', nombre: 'San Cristóbal' },
  { id: 'USME', nombre: 'Usme' },
  { id: 'TUNJUELITO', nombre: 'Tunjuelito' },
  { id: 'BOSA', nombre: 'Bosa' },
  { id: 'KENNEDY', nombre: 'Kennedy' },
  { id: 'FONTIBON', nombre: 'Fontibón' },
  { id: 'ENGATIVA', nombre: 'Engativá' },
  { id: 'SUBA', nombre: 'Suba' },
  { id: 'BARRIOS_UNIDOS', nombre: 'Barrios Unidos' },
  { id: 'TEUSAQUILLO', nombre: 'Teusaquillo' },
  { id: 'LOS_MARTIRES', nombre: 'Los Mártires' },
  { id: 'ANTONIO_NARINO', nombre: 'Antonio Nariño' },
  { id: 'PUENTE_ARANDA', nombre: 'Puente Aranda' },
  { id: 'LA_CANDELARIA', nombre: 'La Candelaria' },
  { id: 'RAFAEL_URIBE_URIBE', nombre: 'Rafael Uribe Uribe' },
  { id: 'CIUDAD_BOLIVAR', nombre: 'Ciudad Bolívar' },
  { id: 'SUMAPAZ', nombre: 'Sumapaz' },
]

/** Alias de compatibilidad hacia atrás */
export type Conservacion = ConservationStatus | 'COMO_NUEVO' | 'MUY_BUENO' | 'BUENO'
export const CONSERVACIONES: Conservacion[] = ['COMO_NUEVO', 'MUY_BUENO', 'BUENO']
export const CONSERVACION_LABEL: Record<string, string> = {
  COMO_NUEVO: 'Como nuevo',
  MUY_BUENO: 'Muy bueno',
  BUENO: 'Bueno',
  NEW_WITH_TAGS: 'Nuevo con etiquetas',
  LIKE_NEW: 'Como nuevo',
  GOOD_CONDITION: 'Buen estado',
  ACCEPTABLE: 'Aceptable',
}

export type BackendPublicationStatus = 'AVAILABLE' | 'SOLD' | 'RETIRED' | 'IN_DONATION' | 'DONATED'
export type EstadoPublicacion = 'DISPONIBLE' | 'VENDIDA' | 'RETIRADA' | BackendPublicationStatus
export const ESTADO_PUBLICACION_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  AVAILABLE: 'Disponible',
  VENDIDA: 'Vendida',
  SOLD: 'Vendida',
  RETIRADA: 'Retirada',
  RETIRED: 'Retirada',
  IN_DONATION: 'En donación',
  DONATED: 'Donada',
}

export const CATEGORIAS = ['Camisas', 'Camisetas', 'Suéteres', 'Chaquetas', 'Pantalones', 'Faldas', 'Vestidos', 'Calzado', 'Accesorios'] as const
export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '37', '38', '39', '40', '41', '42', 'Única', 'ONE_SIZE'] as const

/** Mapeo de Categoría tradicional a garmentType de backend */
export function mapCategoriaToGarmentType(cat: string): GarmentType {
  const c = cat.toLowerCase()
  if (c.includes('vestid') || c.includes('enteriz')) return 'DRESS'
  if (c.includes('pantal') || c.includes('fald') || c.includes('jean') || c.includes('short')) return 'LOWER'
  if (c.includes('calzad') || c.includes('bota') || c.includes('tenis') || c.includes('zapato')) return 'FOOTWEAR'
  if (c.includes('accesorio') || c.includes('gorra') || c.includes('bolso')) return 'ACCESSORY'
  return 'UPPER'
}

/** DTO devuelto por GET /api/v1/segunda-mano */
export interface ListingDto {
  id: string
  garmentName?: string
  titulo: string
  description?: string
  descripcion: string
  brand?: string
  marca: string
  color?: string
  garmentType?: GarmentType
  categoria: string
  size?: string
  talla: string
  style?: StyleEnum
  conservationStatus?: ConservationStatus
  conservacion: Conservacion
  localidad?: LocalidadEnum
  barrio: string
  price?: number
  precio: number
  esDonacion: boolean
  photos?: string[]
  fotos: string[]
  status?: BackendPublicationStatus
  estado: EstadoPublicacion
  userId?: string
  vendedor: { id: string; nombre: string }
  creadaEn: string
}

/** Filtros para GET /api/v1/segunda-mano */
export interface ListingFiltersDto {
  searchTerm?: string
  texto?: string
  type?: GarmentType
  size?: string
  talla?: string
  conservationStatus?: ConservationStatus[]
  conservacion?: Conservacion[]
  style?: StyleEnum
  color?: string
  brand?: string
  localidad?: LocalidadEnum
  minPrice?: number
  precioMin?: number
  maxPrice?: number
  precioMax?: number
  status?: string
  esDonacion?: boolean
}

/** DTO enviado en POST /api/v1/segunda-mano y PUT /api/v1/segunda-mano/{id} */
export interface ListingRequestDto {
  garmentName?: string
  titulo: string
  description?: string
  descripcion: string
  brand?: string
  marca: string
  color?: string
  garmentType?: GarmentType
  categoria: string
  size?: string
  talla: string
  style?: StyleEnum
  conservationStatus?: ConservationStatus
  conservacion: Conservacion
  localidad?: LocalidadEnum
  price?: number
  precio: number
  esDonacion?: boolean
  photos?: string[]
  fotosConservadas?: string[]
}

/** PATCH /api/v1/segunda-mano/{id}/status */
export interface ListingStatusRequestDto {
  estado: 'VENDIDA' | 'RETIRADA' | 'SOLD' | 'RETIRED'
}

export const LISTING_RULES = {
  maxFotos: 4,
  precioMin: 1000,
  precioMax: 10_000_000,
  tituloMax: 120,
  descripcionMin: 15,
  descripcionMax: 1000,
}
