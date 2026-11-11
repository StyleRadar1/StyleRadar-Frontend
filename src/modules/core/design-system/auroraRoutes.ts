import type { AuroraTone } from './AuroraBackground'

/**
 * Rutas excluidas de renderizar el fondo animado <AuroraBackground>.
 * Estas pantallas conservan su fondo propio en modo claro y modo oscuro.
 */
export const AURORA_EXCLUDED_ROUTES: readonly string[] = [
  '/',
  '/probador',
  '/probador/avanzado',
] as const

/**
 * Determina si una ruta dada está excluida de renderizar <AuroraBackground>.
 */
export function isAuroraExcluded(pathname: string): boolean {
  if (!pathname || pathname === '/') return true
  // Comprobación exacta o prefijo de ruta (ej. /probador/...)
  return AURORA_EXCLUDED_ROUTES.some(
    (route) => route !== '/' && (pathname === route || pathname.startsWith(`${route}/`))
  )
}

/**
 * Mapeo central de tonos de Aurora por ruta.
 *
 * - Playlists: 'lila'
 * - Catálogo y detalle de producto: 'malva'
 * - Mapa de tiendas: 'salvia'
 * - Planes, pagos, suscripciones y tiendas: 'rosa'
 * - El resto: 'lila'
 */
export function getAuroraToneForPath(pathname: string): AuroraTone {
  const p = pathname.toLowerCase()

  if (p.startsWith('/catalogo')) return 'malva'
  if (p.startsWith('/mapa')) return 'salvia'
  if (
    p.startsWith('/planes') ||
    p.startsWith('/pago') ||
    p.startsWith('/suscripcion') ||
    p.startsWith('/tienda') ||
    p.startsWith('/mi-tienda')
  ) {
    return 'rosa'
  }
  if (p.startsWith('/playlist')) return 'lila'

  return 'lila'
}
