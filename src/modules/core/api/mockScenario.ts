import { ApiError } from './apiClient'
import { avisarSinConexion } from './conexion'

/**
 * Escenarios de prueba para los datos simulados. Se activan con ?mock=<escenario> en la URL
 * (por ejemplo /probador?mock=job-falla) mientras permanezca en la URL. Sirven para grabar
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
  // Flujo de errores · experiencia del comprador (Daniel)
  'ubicacion-requerida': 'Ordenar o buscar por cercanía responde 400 por falta de ubicación',
  'busqueda-pendiente': 'Activar la alerta de una búsqueda recién guardada responde 422',
  'alerta-duplicada': 'Crear una alerta responde 409 porque ya existe',
  'alerta-con-stock': 'Crear la alerta de una prenda responde 422 porque sí tiene unidades',
  'catalogo-caido': 'Crear la alerta de una prenda responde 503',
  'sin-unidades': 'Reservar una talla responde 409 por falta de unidades',
  'radio-invalido': 'Buscar tiendas cercanas responde 422 por radio fuera de rango',
  'tienda-retirada': 'Abrir una tienda del mapa responde 404',
  'consentimiento': 'Crear la prueba responde 400 CONSENT_REQUIRED',
  'foto-pesada': 'Subir la foto responde 413',
  'foto-dimensiones': 'Subir la foto responde 422 INVALID_PHOTO_DIMENSIONS',
  'foto-formato': 'Subir la foto responde 400 por formato',
  'cuota-agotada': 'Crear la prueba responde 429 QUOTA_EXCEEDED',
  'prenda-no-probable': 'Crear la prueba responde 400 INVALID_GARMENT',
  'ia-lenta': 'Crear la prueba responde 504 AI_TIMEOUT',
  'silueta': 'La prueba termina en FAILED porque no se reconoció la silueta',
  'prueba-no-existe': 'Consultar la prueba responde 404',
  'publicacion-propia': 'Abrir el chat responde 422 (publicación propia o no disponible)',
  'chat-cerrado': 'Enviar un mensaje responde 422 porque la publicación se vendió o retiró',
  'publicaciones-caido': 'Enviar un mensaje responde 503',
  'alerta-ajena': 'Cambiar o borrar una alerta responde 403',
  'alerta-borrada': 'Cambiar o borrar una alerta responde 404',
} as const

export type MockScenario = keyof typeof MOCK_SCENARIOS
const KEY = 'sr_mock'

function read(): MockScenario[] {
  let raw = ''
  try {
    const q = new URLSearchParams(window.location.search).get('mock')
    const prev = sessionStorage.getItem(KEY)
    if (q !== null) {
      sessionStorage.setItem(KEY, q)
      if (q !== prev) {
        queueMicrotask(() => window.dispatchEvent(new Event('sr:mock-changed')))
      }
    } else if (import.meta.env.MODE !== 'test' && prev !== null) {
      sessionStorage.removeItem(KEY)
      queueMicrotask(() => window.dispatchEvent(new Event('sr:mock-changed')))
    }
    raw = sessionStorage.getItem(KEY) ?? ''
  } catch { /* sin almacenamiento */ }
  return raw.split(',').map((s) => s.trim()).filter((s): s is MockScenario => s in MOCK_SCENARIOS)
}

export const mockScenarios = (): MockScenario[] => read()
export const hasScenario = (s: MockScenario) => read().includes(s)

/** Limpia la simulación ?mock activa en la pestaña y limpia la URL actual. */
export function clearMockScenarios() {
  try {
    sessionStorage.removeItem(KEY)
    const url = new URL(window.location.href)
    if (url.searchParams.has('mock')) {
      url.searchParams.delete('mock')
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    }
    window.dispatchEvent(new Event('sr:mock-changed'))
  } catch { /* sin almacenamiento */ }
}

/** Lanza el error que corresponde a los escenarios globales (red, permisos, sesión). */
export function failIfScenario(...own: MockScenario[]) {
  const active = read()
  if (active.includes('sin-red')) {
    avisarSinConexion()
    throw new ApiError(0, 'No hay conexión con el servidor. Intenta de nuevo.')
  }
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

/**
 * Escenario que responde con un error HTTP concreto (y su errorCode, si el backend lo manda).
 * El mensaje es solo descriptivo: las pantallas eligen su propio texto según status y code.
 */
export function failWithScenario(s: MockScenario, status: number, code?: string) {
  if (read().includes(s)) throw new ApiError(status, MOCK_SCENARIOS[s], code)
}