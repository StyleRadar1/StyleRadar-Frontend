import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { ITEMS } from '../mocks/items'
import { MOCK_PLAYLISTS } from '../mocks/playlists'
import { MAX_PLAYLIST_ITEMS, type CreatePlaylistDto, type PlaylistDto, type PlaylistItemDto } from '../types/playlist.dto'

export const playlistService = {
  getAll(): Promise<PlaylistDto[]> {
    if (env.useMocks) return mockDelay([...MOCK_PLAYLISTS])
    return apiClient.get<PlaylistDto[]>('/api/v1/playlists').then((r) => r.data)
  },

  getById(id: string): Promise<PlaylistDto> {
    if (env.useMocks) {
      const normalizedId = id.replace(/^p/, '')
      const pl = MOCK_PLAYLISTS.find(
        (p) =>
          p.id === id ||
          p.id.replace(/^p/, '') === normalizedId ||
          (id === 'pl-1' && p.id === 'u-weekend') ||
          (id === 'pl-2' && p.id === '3') ||
          (id === 'u-weekend' && p.id === 'u-weekend') ||
          (id === '3' && p.id === '3')
      )
      return pl ? mockDelay(pl) : Promise.reject(new ApiError(404, 'La playlist no existe.'))
    }
    return apiClient.get<PlaylistDto>(`/api/v1/playlists/${id}`).then((r) => r.data)
  },

  create(dto: CreatePlaylistDto): Promise<PlaylistDto> {
    if ((dto.prendaIds?.length ?? 0) > MAX_PLAYLIST_ITEMS) {
      return Promise.reject(
        new ApiError(400, `Una playlist no puede superar el límite de ${MAX_PLAYLIST_ITEMS} prendas (RNF-12).`)
      )
    }

    if (env.useMocks) {
      const user = mockSessionUser() ?? { id: 'u-1', name: 'Valentina R.', email: 'usuario@styleradar.co' }
      const prendas: PlaylistItemDto[] = (dto.prendaIds ?? [])
        .map((pid) => ITEMS.find((it) => it.id === pid))
        .filter(Boolean)
        .map((it) => ({
          ...it!,
          agregadaPor: user.name,
        }))

      const nueva: PlaylistDto = {
        id: `pl-${Date.now()}`,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() ?? '',
        creador: { id: user.id, nombre: user.name, email: 'email' in user ? (user as { email?: string }).email : undefined },
        visibilidad: dto.visibilidad,
        portadaUrl: dto.portadaUrl || prendas[0]?.imagen || '/img/productos/sueter-de-canale-crudo.jpg',
        prendas,
        likes: 0,
        guardados: 0,
        esGuardada: false,
        fechaCreacion: new Date().toISOString().split('T')[0],
        actualizada: 'ahora',
      }
      MOCK_PLAYLISTS.unshift(nueva)
      return mockDelay(nueva)
    }

    return apiClient.post<PlaylistDto>('/api/v1/playlists', dto).then((r) => r.data)
  },

  update(id: string, dto: Partial<CreatePlaylistDto>): Promise<PlaylistDto> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === id)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      if (dto.nombre) pl.nombre = dto.nombre.trim()
      if (dto.descripcion !== undefined) pl.descripcion = dto.descripcion.trim()
      if (dto.visibilidad) pl.visibilidad = dto.visibilidad
      pl.actualizada = 'ahora'
      return mockDelay(pl)
    }
    return apiClient.put<PlaylistDto>(`/api/v1/playlists/${id}`, dto).then((r) => r.data)
  },

  delete(id: string): Promise<boolean> {
    if (env.useMocks) {
      const idx = MOCK_PLAYLISTS.findIndex((p) => p.id === id)
      if (idx !== -1) {
        MOCK_PLAYLISTS.splice(idx, 1)
      }
      return mockDelay(true)
    }
    return apiClient.delete(`/api/v1/playlists/${id}`).then(() => true)
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

      pl.prendas.push({
        ...item,
        agregadaPor: pl.creador.nombre,
      })
      pl.actualizada = 'ahora'
      return mockDelay(pl)
    }

    return apiClient.post<PlaylistDto>(`/api/v1/playlists/${playlistId}/prendas`, { prendaId: itemId }).then((r) => r.data)
  },

  removeItem(playlistId: string, itemId: string): Promise<PlaylistDto> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.prendas = pl.prendas.filter((it) => it.id !== itemId)
      pl.actualizada = 'ahora'
      return mockDelay(pl)
    }

    return apiClient.delete<PlaylistDto>(`/api/v1/playlists/${playlistId}/prendas/${itemId}`).then((r) => r.data)
  },

  toggleLike(playlistId: string): Promise<{ likes: number }> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.likes += 1
      return mockDelay({ likes: pl.likes })
    }
    return apiClient.post<{ likes: number }>(`/api/v1/playlists/${playlistId}/like`).then((r) => r.data)
  },

  toggleSave(playlistId: string): Promise<{ esGuardada: boolean; guardados: number }> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.esGuardada = !pl.esGuardada
      pl.guardados += pl.esGuardada ? 1 : -1
      return mockDelay({ esGuardada: pl.esGuardada, guardados: pl.guardados })
    }
    return apiClient.post<{ esGuardada: boolean; guardados: number }>(`/api/v1/playlists/${playlistId}/guardar`).then((r) => r.data)
  },
}
