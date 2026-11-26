const STORAGE_KEY = 'sr_recent_locations'
const MAX_RECENT = 5

export function getRecentLocationIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function recordRecentLocation(id: string | undefined | null): string[] {
  const clean = (id ?? '').trim()
  if (!clean) return getRecentLocationIds()
  const current = getRecentLocationIds().filter((item) => item !== clean)
  const next = [clean, ...current].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage quota / private mode errors
  }
  return next
}
