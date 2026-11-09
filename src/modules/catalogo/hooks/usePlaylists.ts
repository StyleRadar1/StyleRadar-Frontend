import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { playlistService } from '../services/playlistService'
import type { CreatePlaylistDto, PlaylistDto } from '../types/playlist.dto'

export function usePlaylists() {
  const loader = useCallback(() => playlistService.getAll(), [])
  const { data: playlists, error, loading, reload, setData } = useResource<PlaylistDto[]>(loader, [])

  const createPlaylist = useCallback(
    async (dto: CreatePlaylistDto) => {
      const created = await playlistService.create(dto)
      setData((prev) => [created, ...prev])
      return created
    },
    [setData]
  )

  const addItem = useCallback(
    async (playlistId: string, itemId: string) => {
      const updated = await playlistService.addItem(playlistId, itemId)
      setData((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
    },
    [setData]
  )

  const removeItem = useCallback(
    async (playlistId: string, itemId: string) => {
      const updated = await playlistService.removeItem(playlistId, itemId)
      setData((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
    },
    [setData]
  )

  const like = useCallback(
    async (playlistId: string) => {
      const res = await playlistService.toggleLike(playlistId)
      setData((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, likes: res.likes } : p))
      )
    },
    [setData]
  )

  return {
    playlists,
    loading,
    error,
    reload,
    createPlaylist,
    addItem,
    removeItem,
    like,
  }
}

