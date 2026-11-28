import { useCallback, useEffect, useState } from 'react'
import { aplicarCvdSim, leerCvdSim, type ModoCvd } from './cvdSim'

/** Modo del simulador de visión de color y cómo cambiarlo (se sincroniza entre componentes). */
export function useCvdSim() {
  const [modo, setModoLocal] = useState<ModoCvd>(leerCvdSim)

  useEffect(() => {
    const alCambiar = (e: Event) => setModoLocal((e as CustomEvent<ModoCvd>).detail)
    window.addEventListener('sr:cvd-sim', alCambiar)
    return () => window.removeEventListener('sr:cvd-sim', alCambiar)
  }, [])

  const setModo = useCallback((m: ModoCvd) => aplicarCvdSim(m), [])
  return { modo, setModo }
}
