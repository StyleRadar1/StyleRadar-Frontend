import axios, { AxiosError } from 'axios'
import { env } from '@/configs/env'
import { tokenStorage } from './tokenStorage'
import { camposDelError, kindFromStatus, MENSAJES, mensajePorCodigo, type CamposConError } from './mensajes'
import { guardarRetorno } from './retorno'
import { avisarSinConexion } from './conexion'
import { renovarSiHaceFalta } from './renovarSesion'

/**
 * Cliente HTTP único. Todas las peticiones van al API Gateway;
 * el front nunca llama directo a un microservicio.
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use(async (config) => {
  await renovarSiHaceFalta(config.url)
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }
  return config
})

/**
 * Error con el formato que usan las pantallas.
 * `message` es siempre un texto escrito por el React; `fields` trae los errores por campo
 * del servidor, que son lo único del servidor que se muestra.
 */
export class ApiError extends Error {
  readonly status: number
  readonly fields: CamposConError
  /** Código de negocio del backend (`code` / `errorCode`), p. ej. PRENDA_NO_ENCONTRADA. Sirve para elegir el texto, nunca se muestra crudo. */
  readonly code?: string
  /** Marca temporal ISO-8601 devuelta por ProblemDetail. */
  readonly timestamp?: string
  /** Intentos que le quedan a la persona (ProblemDetail.attemptsRemaining, p. ej. en OTP_INCORRECT). */
  attemptsRemaining?: number
  /** Segundos de espera antes de reintentar (ProblemDetail.retryAfterSeconds o cabecera Retry-After en los 429). */
  retryAfterSeconds?: number
  constructor(status: number, message: string, fieldsOrCode: CamposConError | string = {}, code?: string, timestamp?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    if (typeof fieldsOrCode === 'string') {
      this.fields = {}
      this.code = fieldsOrCode
    } else {
      this.fields = fieldsOrCode
      this.code = code
    }
    this.timestamp = timestamp
  }
}

/** Convierte la respuesta de error de axios en un ApiError con mensaje seguro (priorizando `code` sobre HTTP status). */
export function aApiError(error: AxiosError<unknown>): ApiError {
  const status = error.response?.status ?? 0
  const data = error.response?.data
  if (status === 401 && tokenStorage.get()) {
    // Había sesión y venció: se guarda la página para volver a ella al iniciar sesión otra vez.
    // Sin token (contraseña mala, código OTP equivocado, logout ya limpio) no hay sesión que vencer:
    // avisar aquí abría el aviso de sesión vencida y repetía el logout sin fin.
    guardarRetorno()
    tokenStorage.clear()
    window.dispatchEvent(new Event('sr:sesion-expirada'))
  }
  // La petición no llegó al servidor (sin internet o servidor caído sin respuesta): pantalla única de sin conexión.
  if (!error.response && error.code !== 'ERR_CANCELED') avisarSinConexion()
  // El detalle técnico solo se ve en la consola y solo en desarrollo.
  if (import.meta.env.DEV) {
    console.warn(`[api] ${status || 'sin respuesta'} ${error.config?.method?.toUpperCase() ?? ''} ${error.config?.url ?? ''}`, data ?? error.message)
  }
  const obj = typeof data === 'object' && data !== null
    ? (data as { errorCode?: unknown; code?: unknown; timestamp?: unknown; attemptsRemaining?: unknown; retryAfterSeconds?: unknown })
    : undefined
  const code = typeof obj?.code === 'string' ? obj.code : typeof obj?.errorCode === 'string' ? obj.errorCode : undefined
  const timestamp = typeof obj?.timestamp === 'string' ? obj.timestamp : undefined
  const message = mensajePorCodigo(code) ?? MENSAJES[kindFromStatus(status)]
  const apiError = new ApiError(status, message, camposDelError(data), code, timestamp)
  const intentos = numeroNoNegativo(obj?.attemptsRemaining)
  if (intentos !== undefined) apiError.attemptsRemaining = intentos
  const espera = numeroNoNegativo(obj?.retryAfterSeconds) ?? numeroNoNegativo(cabecera(error, 'retry-after'))
  if (espera !== undefined) apiError.retryAfterSeconds = espera
  return apiError
}

/** Número entero mayor o igual a 0 (acepta "60" como texto, como llega en la cabecera Retry-After). */
function numeroNoNegativo(x: unknown): number | undefined {
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
}

function cabecera(error: AxiosError<unknown>, nombre: string): unknown {
  const headers = error.response?.headers as Record<string, unknown> | { get?: (n: string) => unknown } | undefined
  if (!headers) return undefined
  if (typeof (headers as { get?: unknown }).get === 'function') {
    const v = (headers as { get: (n: string) => unknown }).get(nombre)
    if (v !== undefined && v !== null) return v
  }
  return (headers as Record<string, unknown>)[nombre]
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<unknown>) => Promise.reject(aApiError(error)),
)