import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Al entrar a otra página se empieza desde arriba (los enlaces del pie abrían la página nueva al final).
 * Se respetan los enlaces a una sección (#id) y el botón atrás del navegador.
 */
export function ScrollAlInicio() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (!hash && navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, hash, navigationType])

  return null
}
