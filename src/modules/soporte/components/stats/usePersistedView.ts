import { useState } from 'react'

export function usePersistedView<T extends string>(
  storageKey: string | undefined,
  defaultView: T,
  allowed: readonly T[],
): [T, (next: T) => void] {
  const [view, setView] = useState<T>(() => {
    if (!storageKey || typeof sessionStorage === 'undefined') return defaultView
    try {
      const saved = sessionStorage.getItem(storageKey) as T | null
      if (saved && allowed.includes(saved)) return saved
    } catch {
      /* sin almacenamiento */
    }
    return defaultView
  })

  const updateView = (next: T) => {
    setView(next)
    if (!storageKey || typeof sessionStorage === 'undefined') return
    try {
      sessionStorage.setItem(storageKey, next)
    } catch {
      /* sin almacenamiento */
    }
  }

  return [view, updateView]
}
