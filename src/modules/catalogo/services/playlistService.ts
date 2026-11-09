import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { ITEMS } from '../mocks/items'
import { MOCK_PLAYLISTS } from '../mocks/playlists'
import { MAX_PLAYLIST_ITEMS, type CreatePlaylistDto, type PlaylistDto } from '../types/playlist.dto'

export const playlistService = {
  getAll(): Promise<PlaylistDto[]> {
    if (env.useMocks) return mockDelay([...MOCK_PLAYLISTS])
    return apiClient.get<PlaylistDto[]>('/api/playlists').then((r) => r.data)
  },

  getById(id: string): Promise<PlaylistDto> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === id)
      return pl ? mockDelay(pl) : Promise.reject(new ApiError(404, 'La playlist no existe.'))
    }
    return apiClient.get<PlaylistDto>(`/api/playlists/${id}`).then((r) => r.data)
  },

  create(dto: CreatePlaylistDto): Promise<PlaylistDto> {
    if ((dto.prendaIds?.length ?? 0) > MAX_PLAYLIST_ITEMS) {
      return Promise.reject(
        new ApiError(400, `Una playlist no puede superar el límite de ${MAX_PLAYLIST_ITEMS} prendas (RNF-12).`)
      )
    }

    if (env.useMocks) {
      const user = mockSessionUser() ?? { id: 'u-1', name: 'Usuario StyleRadar' }
      const prendas = (dto.prendaIds ?? [])
        .map((pid) => ITEMS.find((it) => it.id === pid))
        .filter(Boolean) as typeof ITEMS

      const nueva: PlaylistDto = {
        id: `pl-${Date.now()}`,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() ?? '',
        creador: { id: user.id, nombre: user.name },
        visibilidad: dto.visibilidad,
        prendas,
        likes: 0,
        guardados: 0,
        fechaCreacion: new Date().toISOString().split('T')[0],
      }
      MOCK_PLAYLISTS.unshift(nueva)
      return mockDelay(nueva)
    }

    return apiClient.post<PlaylistDto>('/api/playlists', dto).then((r) => r.data)
  },

  addItem(playlistId: string, itemId: string): Promise<PlaylistDto> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      if (pl.prendas.length >= MAX_PLAYLIST_ITEMS) {
        return Promise.reject(
          new ApiError(400, `Límite alcanzado: no puedes agregar más de ${MAX_PLAYLIST_ITEMS} prendas a esta playlist (RNF-12).`)
        )
      }
      if (pl.prendas.some((it) => it.id === itemId)) {
        return Promise.reject(new ApiError(400, 'La prenda ya está en la playlist.'))
      }
      const item = ITEMS.find((it) => it.id === itemId)
      if (!item) return Promise.reject(new ApiError(404, 'Prenda no encontrada.'))

      pl.prendas.push(item)
      return mockDelay(pl)
    }

    return apiClient.post<PlaylistDto>(`/api/playlists/${playlistId}/items`, { itemId }).then((r) => r.data)
  },

  removeItem(playlistId: string, itemId: string): Promise<PlaylistDto> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.prendas = pl.prendas.filter((it) => it.id !== itemId)
      return mockDelay(pl)
    }

    return apiClient.delete<PlaylistDto>(`/api/playlists/${playlistId}/items/${itemId}`).then((r) => r.data)
  },

  toggleLike(playlistId: string): Promise<{ likes: number }> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.likes += 1
      return mockDelay({ likes: pl.likes })
    }
    return apiClient.post<{ likes: number }>(`/api/playlists/${playlistId}/like`).then((r) => r.data)
  },
}

