/** DTOs de RST-ItemCatalog-Service y RST-Inventory-Service. Ajustar a los del Swagger. */
export type Estilo = 'Sastre' | 'Calle' | 'Futuro' | 'Rebelde' | 'Esencial'

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
}

export interface ItemFiltersDto {
  texto?: string
  estilo?: Estilo
  talla?: string
  precioMax?: number
}
