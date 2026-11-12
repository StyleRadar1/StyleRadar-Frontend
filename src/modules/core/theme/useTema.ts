import { useCallback, useContext, useEffect, useState } from 'react'
import { ThemeContext } from './ThemeContext'
import { aplicarTema, leerTema, type Tema } from './tema'

/**
 * Hook para temas legacy. Funciona dentro o fuera de ThemeProvider para
 * total compatibilidad con pruebas unitarias y componentes antiguos.
 */
export function useTema() {
  const ctx = useContext(ThemeContext)
  const [temaFallback, setTemaFallback] = useState<Tema>(leerTema)

  useEffect(() => {
    if (ctx) return
    const onCambio = (e: Event) => setTemaFallback((e as CustomEvent<Tema>).detail)
    window.addEventListener('sr:tema', onCambio)
    return () => window.removeEventListener('sr:tema', onCambio)
  }, [ctx])

  const setTema = useCallback(
    (t: Tema) => {
      if (ctx) {
        ctx.setTheme(t)
      } else {
        aplicarTema(t)
      }
    },
    [ctx],
  )

  if (ctx) {
    return {
      tema: ctx.theme as Tema,
      setTema,
    }
  }

  return {
    tema: temaFallback,
    setTema,
  }
}
