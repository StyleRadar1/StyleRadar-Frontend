import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

// Aliases y retrocompatibilidad
export const THEMES = ['light', 'dark', 'system', 'oscuro', 'claro', 'daltonico'] as const
export type Theme = ThemeMode | 'oscuro' | 'claro' | 'daltonico'

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Automático',
}

export const STORAGE_MODE_KEY = 'sr:theme-mode'
export const STORAGE_CVD_KEY = 'sr:cvd'
export const LEGACY_STORAGE_KEY = 'sr:tema'

export function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      // Ignorar fallo de matchMedia
    }
  }
  return 'dark'
}

export function getSavedMode(): ThemeMode {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const q = new URLSearchParams(window.location.search)
      const param = q.get('theme') || q.get('tema')
      if (param === 'claro' || param === 'light') return 'light'
      if (param === 'oscuro' || param === 'dark') return 'dark'
      if (param === 'system' || param === 'auto') return 'system'
    } catch {
      // Ignorar fallo al leer query params
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_MODE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === 'claro') return 'light'
    if (legacy === 'oscuro') return 'dark'
  } catch {
    // Si localStorage está bloqueado
  }

  return 'system'
}

export function getSavedColorblind(): boolean {
  try {
    const cvd = localStorage.getItem(STORAGE_CVD_KEY)
    if (cvd === 'true') return true
    if (cvd === 'false') return false
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === 'daltonico') return true
  } catch {
    // Si localStorage está bloqueado
  }
  return false
}

// Función getSavedTheme para compatibilidad previa
export function getSavedTheme(): 'claro' | 'oscuro' | 'daltonico' {
  if (getSavedColorblind()) return 'daltonico'
  const mode = getSavedMode()
  if (mode === 'light') return 'claro'
  if (mode === 'dark') return 'oscuro'
  return getSystemTheme() === 'light' ? 'claro' : 'oscuro'
}

/**
 * Aplica el tema y estado de daltonismo en el DOM inmediatamente
 */
export function applyThemeToDom(
  themeOrMode: Theme | ResolvedTheme,
  colorblindParam?: boolean,
): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  let resolved: ResolvedTheme = 'dark'
  let cvd: boolean = typeof colorblindParam === 'boolean' ? colorblindParam : getSavedColorblind()

  if (themeOrMode === 'claro' || themeOrMode === 'light') {
    resolved = 'light'
  } else if (themeOrMode === 'oscuro' || themeOrMode === 'dark') {
    resolved = 'dark'
  } else if (themeOrMode === 'daltonico') {
    resolved = getSystemTheme()
    cvd = true
  } else if (themeOrMode === 'system') {
    resolved = getSystemTheme()
  }

  // Sincronizar data-theme, data-tema, data-cvd y data-contrast
  root.setAttribute('data-theme', cvd ? 'colorblind' : resolved)
  root.setAttribute(
    'data-tema',
    themeOrMode === 'daltonico' ? 'daltonico' : (resolved === 'light' ? 'claro' : 'oscuro'),
  )
  root.setAttribute('data-cvd', cvd ? 'on' : 'off')
  root.setAttribute('data-contrast', cvd ? 'on' : 'off')
  root.style.colorScheme = resolved
}

export interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  colorblind: boolean
  setColorblind: (enabled: boolean) => void
  toggleColorblind: () => void
  resolvedTheme: ResolvedTheme
  // Retrocompatibilidad
  theme: 'claro' | 'oscuro' | 'daltonico'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getSavedMode)
  const [colorblind, setColorblindState] = useState<boolean>(getSavedColorblind)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  // Escuchar cambios de preferencia del sistema si mode === 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    try {
      media.addEventListener('change', listener)
    } catch {
      media.addListener(listener)
    }
    return () => {
      try {
        media.removeEventListener('change', listener)
      } catch {
        media.removeListener(listener)
      }
    }
  }, [])

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    return mode === 'system' ? systemTheme : mode
  }, [mode, systemTheme])

  // Aplicar atributos al DOM y persistir en localStorage de forma segura
  useEffect(() => {
    applyThemeToDom(resolvedTheme, colorblind)

    try {
      localStorage.setItem(STORAGE_MODE_KEY, mode)
      localStorage.setItem(STORAGE_CVD_KEY, String(colorblind))
      // Sincronizar legacy sr:tema
      const legacyVal = colorblind ? 'daltonico' : (resolvedTheme === 'light' ? 'claro' : 'oscuro')
      localStorage.setItem(LEGACY_STORAGE_KEY, legacyVal)
    } catch {
      // Ignorar fallos de escritura
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr:theme-mode', { detail: mode }))
      window.dispatchEvent(new CustomEvent('sr:cvd', { detail: colorblind }))
      window.dispatchEvent(
        new CustomEvent('sr:tema', {
          detail: colorblind ? 'daltonico' : resolvedTheme === 'light' ? 'claro' : 'oscuro',
        }),
      )
      window.dispatchEvent(new CustomEvent('sr:theme', { detail: resolvedTheme }))
    }
  }, [mode, resolvedTheme, colorblind])

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode)
  }, [])

  const setColorblind = useCallback((enabled: boolean) => {
    setColorblindState(enabled)
  }, [])

  const toggleColorblind = useCallback(() => {
    setColorblindState((prev) => !prev)
  }, [])

  // Métodos de retrocompatibilidad
  const theme: 'claro' | 'oscuro' | 'daltonico' = useMemo(() => {
    if (colorblind) return 'daltonico'
    return resolvedTheme === 'light' ? 'claro' : 'oscuro'
  }, [colorblind, resolvedTheme])

  const setTheme = useCallback((nextTheme: Theme) => {
    if (nextTheme === 'daltonico') {
      setColorblindState(true)
    } else if (nextTheme === 'claro' || nextTheme === 'light') {
      setColorblindState(false)
      setModeState('light')
    } else if (nextTheme === 'oscuro' || nextTheme === 'dark') {
      setColorblindState(false)
      setModeState('dark')
    } else if (nextTheme === 'system') {
      setModeState('system')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    if (colorblind) {
      setColorblindState(false)
      setModeState('dark')
    } else if (mode === 'dark') {
      setModeState('light')
    } else if (mode === 'light') {
      setColorblindState(true)
    } else {
      setModeState(resolvedTheme === 'dark' ? 'light' : 'dark')
    }
  }, [colorblind, mode, resolvedTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      colorblind,
      setColorblind,
      toggleColorblind,
      resolvedTheme,
      theme,
      setTheme,
      toggleTheme,
    }),
    [
      mode,
      setMode,
      colorblind,
      setColorblind,
      toggleColorblind,
      resolvedTheme,
      theme,
      setTheme,
      toggleTheme,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider')
  }
  return ctx
}
