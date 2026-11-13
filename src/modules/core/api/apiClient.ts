import axios, { AxiosError } from 'axios'
import { env } from '@/configs/env'
import { tokenStorage } from './tokenStorage'
import { camposDelError, kindFromStatus, MENSAJES, type CamposConError } from './mensajes'
import { guardarRetorno } from './retorno'

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
  constructor(status: number, message: string, fields: CamposConError = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
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
  // El detalle técnico solo se ve en la consola y solo en desarrollo.
  if (import.meta.env.DEV) {
    console.warn(`[api] ${status || 'sin respuesta'} ${error.config?.method?.toUpperCase() ?? ''} ${error.config?.url ?? ''}`, data ?? error.message)
  }
  return new ApiError(status, MENSAJES[kindFromStatus(status)], camposDelError(data))
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<unknown>) => Promise.reject(aApiError(error)),
)
