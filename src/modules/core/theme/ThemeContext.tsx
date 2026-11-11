import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export const THEMES = ['oscuro', 'claro', 'daltonico'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  oscuro: 'Oscuro',
  claro: 'Claro',
  daltonico: 'Daltónico',
}

const STORAGE_KEY = 'sr:tema'

export const isTheme = (value: unknown): value is Theme =>
  typeof value === 'string' && (THEMES as readonly string[]).includes(value)

/**
 * Lee el tema guardado en localStorage con respaldo seguro de try/catch
 * y fallback automático a la preferencia del sistema operativo.
 */
export function getSavedTheme(): Theme {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const q = new URLSearchParams(window.location.search)
      const param = q.get('theme') || q.get('tema')
      if (isTheme(param)) return param
    } catch {
      // Ignorar fallo al leer query params
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isTheme(saved)) return saved
  } catch {
    // Si localStorage está bloqueado o deshabilitado, seguimos con la detección
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'oscuro' : 'claro'
    } catch {
      // Entornos donde matchMedia no esté disponible
    }
  }

  return 'oscuro'
}

/**
 * Aplica el tema en el elemento raíz <html> inmediatamente
 * sincronizando tanto data-theme como data-tema.
 */
export function applyThemeToDom(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-tema', theme)
  root.style.colorScheme = theme === 'claro' ? 'light' : 'dark'
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getSavedTheme)

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    applyThemeToDom(nextTheme)
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // Ignorar fallos de escritura de almacenamiento privado
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr:tema', { detail: nextTheme }))
      window.dispatchEvent(new CustomEvent('sr:theme', { detail: nextTheme }))
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev: Theme) => {
      const next: Theme = prev === 'oscuro' ? 'claro' : prev === 'claro' ? 'daltonico' : 'oscuro'
      applyThemeToDom(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Ignorar fallos de escritura
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sr:tema', { detail: next }))
        window.dispatchEvent(new CustomEvent('sr:theme', { detail: next }))
      }
      return next
    })
  }, [])

  // Aplicar tema inicial al montar y sincronizar con eventos externos / pestañas
  useEffect(() => {
    applyThemeToDom(theme)

    const onCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<Theme>).detail
      if (isTheme(detail) && detail !== theme) {
        setThemeState(detail)
        applyThemeToDom(detail)
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isTheme(e.newValue) && e.newValue !== theme) {
        setThemeState(e.newValue)
        applyThemeToDom(e.newValue)
      }
    }

    window.addEventListener('sr:tema', onCustomEvent)
    window.addEventListener('sr:theme', onCustomEvent)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('sr:tema', onCustomEvent)
      window.removeEventListener('sr:theme', onCustomEvent)
      window.removeEventListener('storage', onStorage)
    }
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Hook para consumir el contexto de tema */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider')
  }
  return ctx
}
