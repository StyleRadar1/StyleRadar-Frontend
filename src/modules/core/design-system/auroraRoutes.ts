/**
 * Rutas excluidas de renderizar el fondo animado <AuroraBackground>.
 * Estas pantallas conservan su fondo propio en modo claro y modo oscuro.
 */
export const AURORA_EXCLUDED_ROUTES: readonly string[] = [
  '/probador',
  '/probador/avanzado',
] as const

/**
 * Determina si una ruta dada está excluida de renderizar <AuroraBackground>.
 */
export function isAuroraExcluded(pathname: string): boolean {
  if (!pathname) return false
  // Comprobación exacta o prefijo de ruta (ej. /probador/...)
  return AURORA_EXCLUDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}
