import { useCallback, useEffect, useState } from 'react'
import { aplicarTema, leerTema, type Tema } from './tema'

/** Tema actual y función para cambiarlo. Todos los selectores de la página quedan sincronizados. */
export function useTema() {
  const [tema, setTemaState] = useState<Tema>(leerTema)

  useEffect(() => {
    const onCambio = (e: Event) => setTemaState((e as CustomEvent<Tema>).detail)
    window.addEventListener('sr:tema', onCambio)
    return () => window.removeEventListener('sr:tema', onCambio)
  }, [])

  const setTema = useCallback((t: Tema) => aplicarTema(t), [])
  return { tema, setTema }
}
