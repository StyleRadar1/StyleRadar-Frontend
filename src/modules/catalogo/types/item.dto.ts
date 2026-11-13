/** DTOs de RST-ItemCatalog-Service y RST-Inventory-Service. */
export type Estilo =
  | 'Streetwear'
  | 'Elegante'
  | 'Casual'
  | 'Vintage'
  | 'Techwear'
  | 'Sastre'
  | 'Calle'
  | 'Futuro'
  | 'Rebelde'
  | 'Esencial'

export interface ItemResponseDto {
  id: string
  nombre: string
  tienda: string
  barrio: string
  precio: number
  estilo: Estilo
  tipo: string
  color: string
  tallas: string[]
  imagen: string
  distanciaKm: number
  recorte?: string
  tipoGancho?: 'hombros' | 'pinzas'
  anclaY?: number
  bajada?: number
  descripcion?: string
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
  orden?: string
}
