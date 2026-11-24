import axios from 'axios'
import { env } from '@/configs/env'
import { tokenStorage } from './tokenStorage'

/** Se renueva cuando al token le quedan menos de 5 minutos (dura 12 h en QA y 8 h en PROD). */
export const MARGEN_RENOVACION_SEGUNDOS = 5 * 60
const RUTA_REFRESH = '/api/v1/auth/refresh'

/** Segundos que le quedan al JWT según su `exp`. null si no se puede leer. */
export function segundosRestantes(token: string, ahora = Date.now()): number | null {
  try {
    const parte = token.split('.')[1]
    if (!parte) return null
    const json = JSON.parse(atob(parte.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp - Math.floor(ahora / 1000) : null
  } catch { return null }
}

let enCurso: Promise<void> | null = null

/**
 * F-08: renueva la sesión con POST /api/v1/auth/refresh { refreshToken } antes de que venza.
 * ms-auth solo renueva un token que sigue vigente, por eso se hace antes y no después del 401.
 * Si la renovación falla no se hace nada: la petición sale con el token actual y,
 * si ya venció, el 401 abre el aviso de sesión vencida como siempre.
 */
export function renovarSiHaceFalta(url = ''): Promise<void> {
  if (env.useMocks || url.includes('/api/v1/auth/')) return Promise.resolve()
  const token = tokenStorage.get()
  if (!token) return Promise.resolve()
  const quedan = segundosRestantes(token)
  if (quedan === null || quedan <= 0 || quedan > MARGEN_RENOVACION_SEGUNDOS) return Promise.resolve()
  if (!enCurso) {
    // Cliente sin interceptores: así un 401 de la renovación no dispara el aviso de sesión vencida.
    enCurso = axios.post<{ accessToken?: string | null }>(`${env.apiUrl}${RUTA_REFRESH}`, { refreshToken: token }, { timeout: 15000 })
      .then((r) => {
        const nuevo = r.data?.accessToken
        if (nuevo && tokenStorage.get() === token) tokenStorage.set(nuevo)
      })
      .catch(() => {})
      .finally(() => { enCurso = null })
  }
  return enCurso
}
