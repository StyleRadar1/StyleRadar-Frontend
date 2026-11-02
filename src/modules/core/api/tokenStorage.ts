const KEY = 'sr_token'

export const tokenStorage = {
  get: (): string | null => {
    try { return localStorage.getItem(KEY) } catch { return null }
  },
  set: (token: string) => {
    try { localStorage.setItem(KEY, token) } catch { /* sin almacenamiento */ }
  },
  clear: () => {
    try { localStorage.removeItem(KEY) } catch { /* sin almacenamiento */ }
  },
}
