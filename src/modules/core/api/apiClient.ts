import axios, { AxiosError } from 'axios'
import { env } from '@/configs/env'
import { tokenStorage } from './tokenStorage'
import { camposDelError, kindFromStatus, MENSAJES, type CamposConError } from './mensajes'
import { guardarRetorno } from './retorno'
import { avisarSinConexion } from './conexion'

/**
 * Cliente HTTP único. Todas las peticiones van al API Gateway;
 * el front nunca llama directo a un microservicio.
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
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
  /** Código de negocio del backend (errorCode), p. ej. CONSENT_REQUIRED. Sirve para elegir el texto, nunca se muestra. */
  readonly code?: string
  constructor(status: number, message: string, fieldsOrCode: CamposConError | string = {}, code?: string) {
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
  }
}

/** Convierte la respuesta de error de axios en un ApiError con mensaje seguro. */
export function aApiError(error: AxiosError<unknown>): ApiError {
  const status = error.response?.status ?? 0
  const data = error.response?.data
  if (status === 401) {
    // Había sesión y venció: se guarda la página para volver a ella al iniciar sesión otra vez.
    if (tokenStorage.get()) guardarRetorno()
    tokenStorage.clear()
    window.dispatchEvent(new Event('sr:sesion-expirada'))
  }
  // La petición no llegó al servidor (sin internet o servidor caído sin respuesta): pantalla única de sin conexión.
  if (!error.response && error.code !== 'ERR_CANCELED') avisarSinConexion()
  // El detalle técnico solo se ve en la consola y solo en desarrollo.
  if (import.meta.env.DEV) {
    console.warn(`[api] ${status || 'sin respuesta'} ${error.config?.method?.toUpperCase() ?? ''} ${error.config?.url ?? ''}`, data ?? error.message)
  }
  const obj = typeof data === 'object' && data !== null ? (data as { errorCode?: unknown; code?: unknown }) : undefined
  const code = typeof obj?.errorCode === 'string' ? obj.errorCode : typeof obj?.code === 'string' ? obj.code : undefined
  return new ApiError(status, MENSAJES[kindFromStatus(status)], camposDelError(data), code)
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<unknown>) => Promise.reject(aApiError(error)),
)