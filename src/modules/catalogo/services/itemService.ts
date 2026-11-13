import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { ITEMS } from '../mocks/items'
import type { ItemFiltersDto, ItemResponseDto } from '../types/item.dto'

const matches = (it: ItemResponseDto, f: ItemFiltersDto) => {
  if (f.texto) {
    const q = f.texto.toLowerCase().trim()
    const content = `${it.nombre} ${it.tipo} ${it.color} ${it.tienda} ${it.barrio} ${it.estilo}`.toLowerCase()
    if (!content.includes(q)) return false
  }

  // Filtro por Marca / Tienda
  if (f.marca && f.marca !== 'Todas') {
    if (it.tienda.toLowerCase() !== f.marca.toLowerCase()) return false
  }

  // Filtro por Estilo (los 5 estilos del prototipo: Streetwear, Elegante, Casual, Vintage, Techwear)
  if (f.estilo && f.estilo !== 'Todos') {
    const est = f.estilo.toLowerCase()
    const itemEst = it.estilo.toLowerCase()
    if (est === 'streetwear') {
      if (itemEst !== 'streetwear' && itemEst !== 'calle' && it.tipo !== 'Buzo' && it.tipo !== 'Pantalón') return false
    } else if (est === 'elegante') {
      if (itemEst !== 'elegante' && itemEst !== 'sastre' && it.tipo !== 'Saco') return false
    } else if (est === 'casual') {
      if (itemEst !== 'casual' && itemEst !== 'esencial' && it.tipo !== 'Suéter') return false
    } else if (est === 'vintage') {
      if (itemEst !== 'vintage' && itemEst !== 'rebelde' && !it.nombre.toLowerCase().includes('cuero') && !it.nombre.toLowerCase().includes('vintage')) return false
    } else if (est === 'techwear') {
      if (itemEst !== 'techwear' && itemEst !== 'futuro' && !it.nombre.toLowerCase().includes('nylon') && !it.nombre.toLowerCase().includes('técnico')) return false
    } else if (itemEst !== est) {
      return false
    }
  }

  // Categorías del encabezado superior
  if (f.categoria && f.categoria !== 'Todas') {
    const cat = f.categoria.toLowerCase()
    const itemEst = it.estilo.toLowerCase()
    if (cat === 'formal' && itemEst !== 'elegante' && itemEst !== 'sastre' && it.tipo !== 'Saco') return false
    if (cat === 'casual' && itemEst !== 'casual' && itemEst !== 'esencial' && it.tipo !== 'Suéter') return false
    if (cat === 'urbana' && itemEst !== 'streetwear' && itemEst !== 'calle' && it.tipo !== 'Buzo' && it.tipo !== 'Conjunto') return false
    if (cat === 'sport' && itemEst !== 'techwear' && itemEst !== 'futuro') return false
    if (cat === 'leather' && itemEst !== 'vintage' && itemEst !== 'rebelde' && !it.nombre.toLowerCase().includes('cuero')) return false
    if (cat === 'calzado' && it.tipo !== 'Calzado') return false
  }

  if (f.tipo && f.tipo !== 'Todos' && it.tipo.toLowerCase() !== f.tipo.toLowerCase()) return false
  if (f.color && f.color !== 'Todos' && it.color.toLowerCase() !== f.color.toLowerCase()) return false
  if (f.talla && f.talla !== 'Todas' && !it.tallas.includes(f.talla)) return false
  if (f.precioMin && it.precio < f.precioMin) return false
  if (f.precioMax && it.precio > f.precioMax) return false
  if (f.origen && f.origen !== 'Todos') {
    if (f.origen === 'tiendas' && it.tienda === 'Segunda mano') return false
    if (f.origen === 'segunda-mano' && it.tienda !== 'Segunda mano') return false
  }

  // Filtro por Cerca de (localidades o barrios de Bogotá)
  if (f.cercaDe && f.cercaDe !== 'No especificar') {
    if (f.cercaDe === 'Cerca de mí' || f.cercaDe === 'Mí') {
      if (it.distanciaKm > 3.5) return false
    } else if (it.barrio.toLowerCase() !== f.cercaDe.toLowerCase()) {
      return false
    }
  }
  return true
}

const sortItems = (list: ItemResponseDto[], orden?: string) => {
  const copy = [...list]
  if (orden === 'cerca' || orden === 'cercania') {
    return copy.sort((a, b) => a.distanciaKm - b.distanciaKm)
  }
  if (orden === 'asc') {
    return copy.sort((a, b) => a.precio - b.precio)
  }
  if (orden === 'desc') {
    return copy.sort((a, b) => b.precio - a.precio)
  }
  if (orden === 'new') {
    return copy.reverse()
  }
  return copy
}

export const itemService = {
  search(filters: ItemFiltersDto): Promise<ItemResponseDto[]> {
    if (env.useMocks) {
      const map = new Map<string, ItemResponseDto>()
      for (const it of ITEMS) {
        if (!map.has(it.id)) {
          map.set(it.id, it)
        }
      }
      const filtered = Array.from(map.values()).filter((it) => matches(it, filters))
      return mockDelay(sortItems(filtered, filters.orden))
    }
    return apiClient.get<ItemResponseDto[]>('/api/items', { params: filters }).then((r) => r.data)
  },
  getById(id: string): Promise<ItemResponseDto> {
    if (env.useMocks) {
      const it = ITEMS.find((x) => x.id === id)
      return it ? mockDelay(it) : Promise.reject(new ApiError(404, 'La prenda no existe.'))
    }
    return apiClient.get<ItemResponseDto>(`/api/items/${id}`).then((r) => r.data)
  },
}
