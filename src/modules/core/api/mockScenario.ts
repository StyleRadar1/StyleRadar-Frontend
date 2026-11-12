import { ApiError } from './apiClient'

/**
 * Escenarios de prueba para los datos simulados. Se activan con ?mock=<escenario> en la URL
 * (por ejemplo /probador?mock=job-falla) y duran lo que dura la pestaña. Sirven para grabar
 * las evidencias de los casos negativos sin backend. No tienen efecto cuando VITE_USE_MOCKS=false.
 */
export const MOCK_SCENARIOS = {
  'sin-red': 'Todas las peticiones simuladas fallan sin conexión',
  'subida-falla': 'La subida de la foto responde 500',
  'sin-permiso': 'Las peticiones simuladas responden 403',
  'sesion-vencida': 'Las peticiones simuladas responden 401',
  'job-falla': 'El job del probador termina en FAILED',
  'job-expira': 'El job del probador termina en EXPIRED',
  'resultado-expirado': 'La URL temporal del resultado ya venció',
  'borrado-falla': 'La eliminación de fotos responde 500',
  'catalogo-vacio': 'El catálogo del probador y de segunda mano llega vacío',
  'conflicto': 'Los cambios de estado responden 409',
  'duplicado': 'Crear una solicitud de donación responde 409 por duplicado',
  'limite': 'Las peticiones simuladas responden 429',
  'regla': 'Las peticiones simuladas responden 422 por regla de negocio',
} as const

export type MockScenario = keyof typeof MOCK_SCENARIOS
const KEY = 'sr_mock'

function read(): MockScenario[] {
  let raw = ''
  try {
    const q = new URLSearchParams(window.location.search).get('mock')
    if (q !== null) sessionStorage.setItem(KEY, q)
    raw = sessionStorage.getItem(KEY) ?? ''
  } catch { /* sin almacenamiento */ }
  return raw.split(',').map((s) => s.trim()).filter((s): s is MockScenario => s in MOCK_SCENARIOS)
}

export const mockScenarios = (): MockScenario[] => read()
export const hasScenario = (s: MockScenario) => read().includes(s)

/** Lanza el error que corresponde a los escenarios globales (red, permisos, sesión). */
export function failIfScenario(...own: MockScenario[]) {
  const active = read()
  if (active.includes('sin-red')) throw new ApiError(0, 'No hay conexión con el servidor. Intenta de nuevo.')
  if (active.includes('sesion-vencida')) {
    window.dispatchEvent(new Event('sr:sesion-expirada'))
    throw new ApiError(401, 'Tu sesión venció. Inicia sesión otra vez.')
  }
  if (active.includes('sin-permiso')) throw new ApiError(403, 'No tienes permiso para hacer esto.')
  if (active.includes('limite')) throw new ApiError(429, 'Hiciste demasiados intentos. Espera un momento e intenta de nuevo.')
  for (const s of own) {
    if (active.includes(s)) {
      const status = s === 'conflicto' || s === 'duplicado' ? 409 : s === 'regla' ? 422 : 500
      throw new ApiError(status, MOCK_SCENARIOS[s])
    }
  }
}
