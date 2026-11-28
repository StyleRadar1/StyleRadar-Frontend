/**
 * Construye el kicker de ubicación del hero público sin duplicar la ciudad
 * (ej. evita «TIENDA LOCAL · BOGOTÁ · BOGOTÁ» cuando falta el barrio o coincide con Bogotá).
 */
export function formatHeroLocationKicker(prefix: string, city: string, barrio?: string | null): string {
  const cityClean = city.trim()
  const barrioClean = (barrio ?? '').trim()
  if (!barrioClean || barrioClean.localeCompare(cityClean, 'es', { sensitivity: 'base' }) === 0) {
    return `${prefix} · ${cityClean.toUpperCase()}`
  }
  return `${prefix} · ${cityClean.toUpperCase()} · ${barrioClean.toUpperCase()}`
}
