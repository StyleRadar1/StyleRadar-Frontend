import axios, { AxiosError } from 'axios'
import { env } from '@/configs/env'
import { tokenStorage } from './tokenStorage'

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

/** Error con el formato que usan las pantallas. */
export class ApiError extends Error {
  readonly status: number
  /** Código de negocio del backend (errorCode), p. ej. CONSENT_REQUIRED. Sirve para elegir el texto, nunca se muestra. */
  readonly code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; errorCode?: string; code?: string }>) => {
    const status = error.response?.status ?? 0
    if (status === 401) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('sr:sesion-expirada'))
    }
    const message =
      error.response?.data?.message ??
      (status === 0 ? 'No hay conexión con el servidor. Intenta de nuevo.' : 'Ocurrió un error. Intenta de nuevo.')
    const data = error.response?.data
    return Promise.reject(new ApiError(status, message, data?.errorCode ?? data?.code))
  },
)
