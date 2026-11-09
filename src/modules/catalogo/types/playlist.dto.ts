import type { ItemResponseDto } from './item.dto'

/**
 * Límite estricto no funcional RNF-12:
 * Cada playlist puede contener un máximo de 15 prendas.
 */
export const MAX_PLAYLIST_ITEMS = 15

export type PlaylistVisibility = 'PUBLICA' | 'PRIVADA'

export interface PlaylistDto {
  id: string
  nombre: string
  descripcion: string
  creador: {
    id: string
    nombre: string
  }
  visibilidad: PlaylistVisibility
  prendas: ItemResponseDto[]
  likes: number
  guardados: number
  destacada?: boolean
  fechaCreacion: string
}

export interface CreatePlaylistDto {
  nombre: string
  descripcion?: string
  visibilidad: PlaylistVisibility
  prendaIds?: string[]
}

