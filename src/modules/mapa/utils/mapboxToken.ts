/**
 * Elige el token de Mapbox para el navegador. Solo sirven los públicos (pk.…):
 * si el de .env falta, está vacío o es uno secreto (sk.…), se usa el público del proyecto.
 */
export function resolveMapboxToken(fromEnv: string | undefined, fallback: string): string {
  const token = (fromEnv ?? '').trim()
  return token.startsWith('pk.') ? token : fallback
}
