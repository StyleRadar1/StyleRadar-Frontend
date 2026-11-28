import { NavLink } from 'react-router-dom'
import './ProbadorSecciones.css'

export const SECCIONES_PROBADOR = [
  { to: '/probador', etiqueta: 'Arma tu look' },
  { to: '/probador/avanzado', etiqueta: 'Probar con tu foto IA' },
] as const

/**
 * Botones para cambiar de sección dentro del probador. Reemplazan al «Volver» y a la miga de pan: la persona
 * siempre tiene el encabezado de la app arriba para salir, y aquí solo elige qué parte del probador quiere usar.
 */
export function ProbadorSecciones({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Secciones del probador" className={`sr-prob-secciones ${className}`}>
      {SECCIONES_PROBADOR.map((s) => (
        <NavLink key={s.to} to={s.to} end className="sr-prob-seccion">
          {s.etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}
