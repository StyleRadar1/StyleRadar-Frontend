import { useEffect, useState } from 'react'
import { usuarioService } from '@/modules/identidad/services/usuarioService'
import type { AdminPlaylistDto } from '../types/admin.dto'

export type ResolvedCreator =
  | { kind: 'literal'; name: string }
  | { kind: 'loading'; id: string }
  | { kind: 'resolved'; id: string; name: string; email: string }
  | { kind: 'fallback'; id: string; label: string }

type CachedCreator =
  | { status: 'resolved'; name: string; email: string }
  | { status: 'failed' }

const NUMERIC_ID_RE = /^\d+$/
const LIST_ADMIN_PAGE_SIZE = 100

const creatorCache = new Map<string, CachedCreator>()
let nextPageToFetch = 0
let exhaustedListAdmin = false
let activeBatch: Promise<void> | null = null

export const isNumericCreatorId = (creador: string): boolean => NUMERIC_ID_RE.test(creador.trim())

/** Reinicia la caché en memoria (útil en pruebas). */
export function clearPlaylistCreatorCache() {
  creatorCache.clear()
  nextPageToFetch = 0
  exhaustedListAdmin = false
  activeBatch = null
}

async function fetchMissingCreators(ids: string[]): Promise<void> {
  const pending = new Set(ids.filter((id) => !creatorCache.has(id)))
  if (pending.size === 0) return

  if (!exhaustedListAdmin) {
    try {
      while (pending.size > 0 && !exhaustedListAdmin) {
        const res = await usuarioService.listAdmin({ page: nextPageToFetch, size: LIST_ADMIN_PAGE_SIZE })
        for (const u of res.content) {
          const uid = String(u.id)
          creatorCache.set(uid, { status: 'resolved', name: u.name, email: u.email })
          pending.delete(uid)
        }
        nextPageToFetch += 1
        if (res.last || nextPageToFetch >= res.totalPages || res.content.length === 0) {
          exhaustedListAdmin = true
        }
      }
    } catch {
      exhaustedListAdmin = true
    }
  }

  if (pending.size > 0) {
    const remaining = Array.from(pending)
    const results = await Promise.allSettled(remaining.map((id) => usuarioService.getAdmin(id)))
    results.forEach((result, index) => {
      const id = remaining[index]
      if (result.status === 'fulfilled' && result.value) {
        creatorCache.set(id, {
          status: 'resolved',
          name: result.value.name,
          email: result.value.email,
        })
      } else {
        creatorCache.set(id, { status: 'failed' })
      }
    })
  }
}

async function resolveMissingWithDedup(ids: string[]): Promise<void> {
  if (activeBatch) {
    await activeBatch
  }
  const stillMissing = ids.filter((id) => !creatorCache.has(id))
  if (stillMissing.length === 0) return

  const run = fetchMissingCreators(stillMissing).finally(() => {
    if (activeBatch === run) activeBatch = null
  })
  activeBatch = run
  await run
}

/**
 * Resuelve los creadores cuyo campo `creador` es un ID numérico usando `listAdmin` (paginado de a 100)
 * y `getAdmin(id)` como respaldo, con caché en memoria durante la sesión.
 */
export function usePlaylistCreators(playlists: AdminPlaylistDto[]) {
  const [, setVersion] = useState(0)

  const numericIds = Array.from(
    new Set(playlists.map((p) => p.creador.trim()).filter((id) => isNumericCreatorId(id))),
  )
  const missingKey = numericIds.filter((id) => !creatorCache.has(id)).join(',')

  useEffect(() => {
    if (!missingKey) return
    let cancelled = false
    const idsToLoad = missingKey.split(',')
    void resolveMissingWithDedup(idsToLoad).then(() => {
      if (!cancelled) setVersion((v) => v + 1)
    })
    return () => {
      cancelled = true
    }
  }, [missingKey])

  const getCreator = (creador: string): ResolvedCreator => {
    const trimmed = creador.trim()
    if (!isNumericCreatorId(trimmed)) {
      return { kind: 'literal', name: creador }
    }
    const cached = creatorCache.get(trimmed)
    if (!cached) {
      return { kind: 'loading', id: trimmed }
    }
    if (cached.status === 'resolved') {
      return { kind: 'resolved', id: trimmed, name: cached.name, email: cached.email }
    }
    return { kind: 'fallback', id: trimmed, label: `Usuario #${trimmed}` }
  }

  const getSortKey = (creador: string): string => {
    const info = getCreator(creador)
    switch (info.kind) {
      case 'literal':
      case 'resolved':
        return info.name.toLowerCase()
      case 'fallback':
        return info.label.toLowerCase()
      case 'loading':
        return `usuario #${info.id}`
    }
  }

  const getSearchText = (creador: string): string => {
    const info = getCreator(creador)
    switch (info.kind) {
      case 'literal':
        return info.name
      case 'resolved':
        return `${info.name} ${info.email}`
      case 'fallback':
        return info.label
      case 'loading':
        return info.id
    }
  }

  return { getCreator, getSortKey, getSearchText }
}
