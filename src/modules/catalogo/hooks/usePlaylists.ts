import { useCallback } from 'react'
import { env } from '@/configs/env'
import { mockSessionUser } from '@/modules/core/api/mock'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { useResource } from '@/modules/core/hooks/useResource'
import { isOwnedPlaylist, isSavedPlaylist, playlistService } from '../services/playlistService'
import type { CreatePlaylistDto, PlaylistDto, UpdatePlaylistDto } from '../types/playlist.dto'

interface PlaylistsBundle {
  all: PlaylistDto[]
  mine: PlaylistDto[]
  saved: PlaylistDto[]
  featured: PlaylistDto[]
}

const INITIAL_BUNDLE: PlaylistsBundle = { all: [], mine: [], saved: [], featured: [] }

function mapInBundle(bundle: PlaylistsBundle, playlistId: string, updater: (p: PlaylistDto) => PlaylistDto): PlaylistsBundle {
  const mapList = (list: PlaylistDto[]) => list.map((p) => (p.id === playlistId ? updater(p) : p))
  return {
    all: mapList(bundle.all),
    mine: mapList(bundle.mine),
    saved: mapList(bundle.saved),
    featured: mapList(bundle.featured),
  }
}

export function usePlaylists(userId?: string) {
  const loader = useCallback(async (): Promise<PlaylistsBundle> => {
    if (env.useMocks) {
      const all = await playlistService.getAll()
      const user = mockSessionUser() ?? { id: userId ?? 'u-1', email: 'usuario@styleradar.co' }
      return {
        all,
        mine: all.filter((p) => isOwnedPlaylist(p, user)),
        saved: all.filter((p) => isSavedPlaylist(p, user)),
        featured: all.filter((p) => Boolean(p.destacada)),
      }
    }

    const hasToken = Boolean(tokenStorage.get())
    const resolvedUserId = userId || mockSessionUser()?.id
    const [all, mine, saved, featured] = await Promise.all([
      playlistService.getAll(),
      hasToken && resolvedUserId
        ? playlistService.getMine(resolvedUserId).catch(() => [] as PlaylistDto[])
        : Promise.resolve([] as PlaylistDto[]),
      hasToken && resolvedUserId
        ? playlistService.getSaved(resolvedUserId).catch(() => [] as PlaylistDto[])
        : Promise.resolve([] as PlaylistDto[]),
      playlistService.getFeatured().catch(() => [] as PlaylistDto[]),
    ])
    return { all, mine, saved, featured }
  }, [userId])

  const { data: bundle, error, loading, reload, setData } = useResource<PlaylistsBundle>(loader, INITIAL_BUNDLE)

  const createPlaylist = useCallback(
    async (dto: CreatePlaylistDto) => {
      const created = await playlistService.create(dto)
      setData((prev) => ({
        ...prev,
        all: [created, ...prev.all],
        mine: [created, ...prev.mine],
      }))
      return created
    },
    [setData]
  )

  const addItem = useCallback(
    async (playlistId: string, itemId: string, nombrePrenda?: string) => {
      const updated = await playlistService.addItem(playlistId, itemId, nombrePrenda)
      setData((prev) => mapInBundle(prev, playlistId, () => updated))
    },
    [setData]
  )

  const removeItem = useCallback(
    async (playlistId: string, itemId: string) => {
      const updated = await playlistService.removeItem(playlistId, itemId)
      setData((prev) => mapInBundle(prev, playlistId, () => updated))
    },
    [setData]
  )

  const like = useCallback(
    async (playlistId: string) => {
      const res = await playlistService.toggleLike(playlistId)
      setData((prev) => mapInBundle(prev, playlistId, (p) => ({ ...p, likes: res.likes })))
    },
    [setData]
  )

  const save = useCallback(
    async (playlistId: string) => {
      const res = await playlistService.toggleSave(playlistId)
      setData((prev) => {
        const next = mapInBundle(prev, playlistId, (p) => ({
          ...p,
          guardados: res.guardados,
          esGuardada: res.esGuardada,
        }))
        if (res.esGuardada) {
          const found =
            next.all.find((p) => p.id === playlistId) ??
            next.featured.find((p) => p.id === playlistId) ??
            next.mine.find((p) => p.id === playlistId)
          const saved = found && !next.saved.some((p) => p.id === playlistId) ? [found, ...next.saved] : next.saved
          return { ...next, saved }
        }
        return { ...next, saved: next.saved.filter((p) => p.id !== playlistId) }
      })
      return res
    },
    [setData]
  )

  const updatePlaylist = useCallback(
    async (id: string, dto: UpdatePlaylistDto) => {
      const updated = await playlistService.update(id, dto)
      setData((prev) => mapInBundle(prev, id, () => updated))
      return updated
    },
    [setData]
  )

  const deletePlaylist = useCallback(
    async (id: string) => {
      await playlistService.delete(id)
      setData((prev) => ({
        all: prev.all.filter((p) => p.id !== id),
        mine: prev.mine.filter((p) => p.id !== id),
        saved: prev.saved.filter((p) => p.id !== id),
        featured: prev.featured.filter((p) => p.id !== id),
      }))
    },
    [setData]
  )

  return {
    playlists: bundle.all,
    myPlaylists: bundle.mine,
    savedPlaylists: bundle.saved,
    featuredPlaylists: bundle.featured,
    loading,
    error,
    reload,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addItem,
    removeItem,
    like,
    save,
  }
}

