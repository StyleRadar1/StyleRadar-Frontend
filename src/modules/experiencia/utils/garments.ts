import type { TryOnGarmentDto } from '../types/tryon.dto'

/** Por qué una prenda no se puede probar ('' si sí se puede). */
export const garmentProblem = (g: TryOnGarmentDto) =>
  !g.disponible ? 'Agotada' : g.zona === 'NO_COMPATIBLE' ? 'No se puede probar' : ''
