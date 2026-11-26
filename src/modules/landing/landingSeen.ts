export const LANDING_SEEN_KEY = 'styleradar_landing_seen'

export function hasSeenLanding(): boolean {
  try {
    return localStorage.getItem(LANDING_SEEN_KEY) === 'true'
  } catch {
    return false
  }
}

export function markLandingSeen(): void {
  try {
    localStorage.setItem(LANDING_SEEN_KEY, 'true')
  } catch {
    // sin almacenamiento disponible
  }
}
