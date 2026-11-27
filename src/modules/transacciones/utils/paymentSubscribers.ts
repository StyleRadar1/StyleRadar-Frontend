import { useEffect, useState } from 'react'
import { adminStoreService, clavesDeNit } from '@/modules/administracion/services/adminService'
import { usuarioService } from '@/modules/identidad/services/usuarioService'
import type { PaymentDto } from '../types/payment.dto'

export type SubscriberTypeLabel = 'Tienda' | 'Usuario' | 'Fundación'

export type ResolvedSubscriber =
  | { kind: 'loading'; id: string; typeLabel: SubscriberTypeLabel }
  | { kind: 'resolved'; id: string; name: string; email: string; typeLabel: SubscriberTypeLabel }
  | { kind: 'fallback'; id: string; label: string; typeLabel: SubscriberTypeLabel }

type CachedSubscriber =
  | { status: 'resolved'; name: string; email: string }
  | { status: 'failed' }

const LIST_ADMIN_PAGE_SIZE = 100

const subscriberCache = new Map<string, CachedSubscriber>()
let nextPageToFetch = 0
let exhaustedListAdmin = false
let storesLoaded = false
const storeCache = new Map<string, { name: string; email: string }>()
let activeBatch: Promise<void> | null = null

export function clearPaymentSubscriberCache() {
  subscriberCache.clear()
  nextPageToFetch = 0
  exhaustedListAdmin = false
  storesLoaded = false
  storeCache.clear()
  activeBatch = null
}

export function getSubscriberTypeLabel(p: Pick<PaymentDto, 'subscriberType' | 'userRole' | 'subscriberRoleLabel'>): SubscriberTypeLabel {
  if (p.subscriberType === 'STORE' || p.userRole === 'STORE_ADMIN' || p.subscriberRoleLabel === 'Tienda') {
    return 'Tienda'
  }
  if (p.subscriberRoleLabel === 'Fundación') {
    return 'Fundación'
  }
  return 'Usuario'
}

function getRawSubscriberId(p: Pick<PaymentDto, 'suscriptorId' | 'userId'>): string {
  return (p.suscriptorId ?? p.userId ?? '').trim()
}

function isResolvableId(id: string): boolean {
  return Boolean(id) && id !== '—'
}

async function ensureStoresLoaded(): Promise<void> {
  if (storesLoaded) return
  storesLoaded = true
  try {
    const stores = await adminStoreService.list()
    for (const s of stores) {
      const entry = { name: s.nombre, email: s.correo }
      if (s.id) storeCache.set(s.id.trim(), entry)
      for (const k of clavesDeNit(s.nit)) {
        storeCache.set(k, entry)
      }
    }
  } catch {
    /* si falla el respaldo de tiendas, se mantiene el fallback */
  }
}

async function fetchMissingSubscribers(targets: Array<{ id: string; isStore: boolean }>): Promise<void> {
  const pending = new Map<string, boolean>()
  for (const t of targets) {
    if (!subscriberCache.has(t.id)) {
      pending.set(t.id, Boolean(pending.get(t.id) || t.isStore))
    }
  }
  if (pending.size === 0) return

  if (!exhaustedListAdmin) {
    try {
      while (pending.size > 0 && !exhaustedListAdmin) {
        const res = await usuarioService.listAdmin({ page: nextPageToFetch, size: LIST_ADMIN_PAGE_SIZE })
        for (const u of res.content) {
          const uid = String(u.id)
          subscriberCache.set(uid, { status: 'resolved', name: u.name, email: u.email })
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
    const remainingIds = Array.from(pending.keys())
    const results = await Promise.allSettled(remainingIds.map((id) => usuarioService.getAdmin(id)))
    results.forEach((result, index) => {
      const id = remainingIds[index]
      if (result.status === 'fulfilled' && result.value) {
        subscriberCache.set(id, {
          status: 'resolved',
          name: result.value.name,
          email: result.value.email,
        })
        pending.delete(id)
      }
    })
  }

  const remainingStores = Array.from(pending.entries()).filter(([, isStore]) => isStore).map(([id]) => id)
  if (remainingStores.length > 0) {
    await ensureStoresLoaded()
    for (const id of remainingStores) {
      const store = storeCache.get(id) ?? clavesDeNit(id).map((k) => storeCache.get(k)).find(Boolean)
      if (store && store.name) {
        subscriberCache.set(id, { status: 'resolved', name: store.name, email: store.email })
        pending.delete(id)
      }
    }
  }

  for (const id of pending.keys()) {
    subscriberCache.set(id, { status: 'failed' })
  }
}

async function resolveMissingWithDedup(targets: Array<{ id: string; isStore: boolean }>): Promise<void> {
  if (activeBatch) {
    await activeBatch
  }
  const stillMissing = targets.filter((t) => !subscriberCache.has(t.id))
  if (stillMissing.length === 0) return

  const run = fetchMissingSubscribers(stillMissing).finally(() => {
    if (activeBatch === run) activeBatch = null
  })
  activeBatch = run
  await run
}

/**
 * Resuelve nombres y correos de suscriptores (USER y STORE vía usuarioService, con respaldo de adminStoreService)
 * usando caché en memoria durante la sesión.
 */
export function usePaymentSubscribers(payments: PaymentDto[]) {
  const [, setVersion] = useState(0)

  const targetMap = new Map<string, boolean>()
  for (const p of payments) {
    if (p.userName?.trim()) continue
    const id = getRawSubscriberId(p)
    if (!isResolvableId(id)) continue
    const isStore = getSubscriberTypeLabel(p) === 'Tienda'
    targetMap.set(id, Boolean(targetMap.get(id) || isStore))
  }

  const missingTargets = Array.from(targetMap.entries())
    .filter(([id]) => !subscriberCache.has(id))
    .map(([id, isStore]) => ({ id, isStore }))
  const missingKey = missingTargets.map((t) => `${t.id}:${t.isStore ? 1 : 0}`).join(',')

  useEffect(() => {
    if (!missingKey) return
    let cancelled = false
    const targets = missingKey.split(',').map((entry) => {
      const [id, storeFlag] = entry.split(':')
      return { id, isStore: storeFlag === '1' }
    })
    void resolveMissingWithDedup(targets).then(() => {
      if (!cancelled) setVersion((v) => v + 1)
    })
    return () => {
      cancelled = true
    }
  }, [missingKey])

  const getSubscriber = (p: PaymentDto): ResolvedSubscriber => {
    const typeLabel = getSubscriberTypeLabel(p)
    const id = getRawSubscriberId(p)
    if (p.userName?.trim()) {
      return {
        kind: 'resolved',
        id,
        name: p.userName.trim(),
        email: p.userEmail?.trim() ?? '',
        typeLabel,
      }
    }
    if (!isResolvableId(id)) {
      return { kind: 'fallback', id: id || '—', label: 'Suscriptor sin ID', typeLabel }
    }
    const cached = subscriberCache.get(id)
    if (!cached) {
      return { kind: 'loading', id, typeLabel }
    }
    if (cached.status === 'resolved') {
      return { kind: 'resolved', id, name: cached.name, email: cached.email, typeLabel }
    }
    return { kind: 'fallback', id, label: `Suscriptor #${id}`, typeLabel }
  }

  const getSearchText = (p: PaymentDto): string => {
    const info = getSubscriber(p)
    if (info.kind === 'resolved') {
      return `${info.name} ${info.email} ${info.typeLabel} ${info.id}`
    }
    if (info.kind === 'fallback') {
      return `${info.label} ${info.typeLabel} ${info.id}`
    }
    return `${info.id} ${info.typeLabel}`
  }

  return { getSubscriber, getSearchText }
}
