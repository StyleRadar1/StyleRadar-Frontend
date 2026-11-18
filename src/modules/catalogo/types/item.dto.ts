/** DTOs de RST-ItemCatalog-Service y RST-Inventory-Service. */

export const TIPOS_PRENDA_UNIFICADOS = [
  'Saco',
  'Chaqueta',
  'Buzo',
  'Suéter',
  'Camisa',
  'Camiseta',
  'Pantalón',
  'Falda',
  'Vestido',
  'Conjunto',
  'Calzado',
  'Accesorio',
] as const

export const COLORES_UNIFICADOS = [
  'Negro',
  'Blanco',
  'Gris',
  'Azul',
  'Café',
  'Beige',
  'Crudo',
  'Plata',
] as const

export const ESTILOS_UNIFICADOS = [
  'Casual',
  'Formal',
  'Deportivo',
  'Urbano',
  'Vintage',
] as const

export const MARCAS_TIENDAS_UNIFICADAS = [
  'Kicks Local',
  'Luna Store',
  'Nómada Studio',
  'Segunda mano',
  'The Local Lab',
  'Ropero 57',
  'Norte Denim',
  'Casa Tweed',
  'Sastrería Antonia',
  'Calle 85 Store',
  'Nora Vintage',
] as const

export type TipoTalla = 'ROPA' | 'PANTALON' | 'CALZADO' | 'UNICA'

export const TALLAS_POR_TIPO: Record<TipoTalla, readonly string[]> = {
  ROPA: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  PANTALON: ['26', '28', '30', '32', '34', '36'],
  CALZADO: ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  UNICA: ['Única'],
}

export type OrdenCatalogo = 'RECIENTES' | 'REPUTACION' | 'DISTANCIA'

export const ORDENES_UNIFICADOS: readonly { id: OrdenCatalogo; label: string }[] = [
  { id: 'RECIENTES', label: 'Más recientes' },
  { id: 'REPUTACION', label: 'Mejor calificadas' },
  { id: 'DISTANCIA', label: 'Cercanía' },
]

export type Estilo =
  | 'Casual'
  | 'Formal'
  | 'Deportivo'
  | 'Urbano'
  | 'Vintage'
  | 'Streetwear'
  | 'Elegante'
  | 'Techwear'
  | 'Sastre'
  | 'Calle'
  | 'Futuro'
  | 'Rebelde'
  | 'Esencial'

export interface ItemResponseDto {
  id: string
  almacenId?: string
  nombre: string
  tienda: string
  marca?: string
  barrio?: string
  precio: number
  precioAnterior?: number
  descuento?: number
  estilo: Estilo
  tipo: string
  color: string
  coloresDisponibles?: string[]
  tallas: string[]
  imagen: string
  imagenSecundaria?: string
  /** Galería de fotos en distintos ángulos (Frontal, Detalle, Espalda, Look, etc. máx 5) */
  imagenes?: string[]
  fotografias?: string[]
  estado?: string
  disponible?: boolean
  fechaPublicacion?: string
  motivoRechazo?: string
  distanciaKm: number
  recorte?: string
  tipoGancho?: 'hombros' | 'pinzas'
  anclaY?: number
  bajada?: number
  descripcion?: string
  esNuevo?: boolean
  esSegundaMano?: boolean
}

export interface ItemFiltersDto {
  texto?: string
  estilo?: Estilo | string
  categoria?: string
  tipo?: string
  color?: string
  talla?: string
  precioMin?: number
  precioMax?: number
  origen?: string
  marca?: string
  cercaDe?: string
  lat?: number
  lng?: number
  orden?: string
}

/** Reserva de una talla en la tienda (ms-inventario). Vence a los 15 minutos. */
export interface ReservaDto {
  prendaId: string
  talla: string
  expiracionReserva: string
}
