import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { ITEMS } from '../mocks/items'
import type { ItemFiltersDto, ItemResponseDto } from '../types/item.dto'
import { API } from '@/modules/core/api/routes'

const matches = (it: ItemResponseDto, f: ItemFiltersDto) =>
  (!f.texto || `${it.nombre} ${it.tipo} ${it.color} ${it.tienda}`.toLowerCase().includes(f.texto.toLowerCase())) &&
  (!f.estilo || it.estilo === f.estilo) &&
  (!f.talla || it.tallas.includes(f.talla)) &&
  (!f.precioMax || it.precio <= f.precioMax)

/** Patrón para todos los servicios: misma firma con datos de prueba o con el API Gateway. */
export const itemService = {
  search(filters: ItemFiltersDto): Promise<ItemResponseDto[]> {
    if (env.useMocks) return mockDelay(ITEMS.filter((it) => matches(it, filters)))
    return apiClient.get<ItemResponseDto[]>(`${API.items}`, { params: filters }).then((r) => r.data)
  },
  getById(id: string): Promise<ItemResponseDto> {
    if (env.useMocks) {
      const it = ITEMS.find((x) => x.id === id)
      return it ? mockDelay(it) : Promise.reject(new ApiError(404, 'La prenda no existe.'))
    }
    return apiClient.get<ItemResponseDto>(`${API.items}/${id}`).then((r) => r.data)
  },
}
