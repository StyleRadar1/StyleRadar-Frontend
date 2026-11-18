import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { env } from '@/configs/env'
import { MENSAJES } from '@/modules/core/api/mensajes'
import { fallarSiDemoPlaylist } from '../mocks/demoPlaylist'
import { ITEMS } from '../mocks/items'
import { MOCK_PLAYLISTS } from '../mocks/playlists'
import {
  MAX_PLAYLIST_ITEMS,
  type CreatePlaylistDto,
  type PlaylistDto,
  type PlaylistEstilo,
  type PlaylistItemDto,
  type UpdatePlaylistDto,
} from '../types/playlist.dto'

function normalizePlaylist(raw: any): PlaylistDto {
  const uid = raw?.usuarioId != null ? String(raw.usuarioId) : raw?.creador?.id ? String(raw.creador.id) : ''
  const creadorNombre = raw?.creador?.nombre || uid || 'Curador'
  const prendasRaw: any[] = Array.isArray(raw?.prendas) ? raw.prendas : []
  const prendas: PlaylistItemDto[] = prendasRaw.map((item) => ({
    ...item,
    id: String(item?.id ?? ''),
    nombre: item?.nombre ?? '',
    precio: Number(item?.precio ?? 0),
    imagen: item?.imagen || (Array.isArray(item?.fotografias) && item.fotografias[0]) || item?.imagenUrl || '',
  }))
  return {
    id: String(raw?.id ?? ''),
    nombre: raw?.nombre ?? '',
    descripcion: raw?.descripcion ?? '',
    usuarioId: uid || undefined,
    creador: {
      id: uid,
      nombre: creadorNombre,
      email: raw?.creador?.email,
    },
    visibilidad: raw?.visibilidad ?? 'PUBLICA',
    estilo: raw?.estilo as PlaylistEstilo | undefined,
    portadaUrl: raw?.portadaUrl || prendas[0]?.imagen,
    prendas,
    likes: Number(raw?.likes ?? 0),
    guardados: Number(raw?.guardados ?? 0),
    destacada: Boolean(raw?.destacada),
    esGuardada: Boolean(raw?.esGuardada),
    fechaCreacion: raw?.fechaCreacion ?? '',
    actualizada: raw?.actualizada,
  }
}

export const playlistService = {
  getAll(): Promise<PlaylistDto[]> {
    if (env.useMocks) return mockDelay([...MOCK_PLAYLISTS])
    return apiClient.get<any[]>('/api/v1/playlists').then((r) => (Array.isArray(r.data) ? r.data.map(normalizePlaylist) : []))
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
    return apiClient.get<any>(`/api/v1/playlists/${id}`).then((r) => normalizePlaylist(r.data))
  },

  create(dto: CreatePlaylistDto): Promise<PlaylistDto> {
    const count = dto.prendaIds?.length ?? 0
    if (count < 1) {
      return Promise.reject(new ApiError(422, 'Debes incluir al menos una prenda al crear la playlist.'))
    }
    if (count > MAX_PLAYLIST_ITEMS) {
      return Promise.reject(
        new ApiError(422, MENSAJES.datos)
      )
    }

    const estilo: PlaylistEstilo = dto.estilo ?? 'CASUAL'

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
        usuarioId: user.id,
        creador: { id: user.id, nombre: user.name, email: 'email' in user ? (user as { email?: string }).email : undefined },
        visibilidad: dto.visibilidad,
        estilo,
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

    return apiClient
      .post<any>('/api/v1/playlists', {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() ?? '',
        visibilidad: dto.visibilidad,
        estilo,
        prendaIds: dto.prendaIds ?? [],
      })
      .then((r) => normalizePlaylist(r.data))
  },

  update(id: string, dto: UpdatePlaylistDto): Promise<PlaylistDto> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === id)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      if (dto.nombre) pl.nombre = dto.nombre.trim()
      if (dto.descripcion !== undefined) pl.descripcion = dto.descripcion.trim()
      if (dto.visibilidad) pl.visibilidad = dto.visibilidad
      if (dto.estilo) pl.estilo = dto.estilo
      pl.actualizada = 'ahora'
      return mockDelay(pl)
    }
    return apiClient.put<any>(`/api/v1/playlists/${id}`, dto).then((r) => normalizePlaylist(r.data))
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
      // Plan de errores: más de 15 prendas o prenda repetida responden 422.
      try { fallarSiDemoPlaylist() } catch (e) { return Promise.reject(e) }
      if (pl.prendas.length >= MAX_PLAYLIST_ITEMS || pl.prendas.some((it) => it.id === itemId)) {
        return Promise.reject(new ApiError(422, MENSAJES.datos))
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

    return apiClient.post<any>(`/api/v1/playlists/${playlistId}/prendas`, { prendaId: itemId }).then((r) => normalizePlaylist(r.data))
  },

  removeItem(playlistId: string, itemId: string): Promise<PlaylistDto> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.prendas = pl.prendas.filter((it) => it.id !== itemId)
      pl.actualizada = 'ahora'
      return mockDelay(pl)
    }

    return apiClient.delete<any>(`/api/v1/playlists/${playlistId}/prendas/${itemId}`).then((r) => normalizePlaylist(r.data))
  },

  toggleLike(playlistId: string): Promise<{ likes: number }> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.likes += 1
      return mockDelay({ likes: pl.likes })
    }
    return apiClient.post<any>(`/api/v1/playlists/${playlistId}/like`).then((r) => ({
      likes: Number(r.data?.likes ?? 0),
    }))
  },

  toggleSave(playlistId: string): Promise<{ esGuardada: boolean; guardados: number }> {
    if (env.useMocks) {
      const pl = MOCK_PLAYLISTS.find((p) => p.id === playlistId)
      if (!pl) return Promise.reject(new ApiError(404, 'Playlist no encontrada.'))
      pl.esGuardada = !pl.esGuardada
      pl.guardados += pl.esGuardada ? 1 : -1
      return mockDelay({ esGuardada: pl.esGuardada, guardados: pl.guardados })
    }
    return apiClient.post<any>(`/api/v1/playlists/${playlistId}/guardar`).then((r) => ({
      esGuardada: typeof r.data?.esGuardada === 'boolean' ? r.data.esGuardada : true,
      guardados: Number(r.data?.guardados ?? 0),
    }))
  },
}
