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
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? 0
    if (status === 401) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('sr:sesion-expirada'))
    }
    const message =
      error.response?.data?.message ??
      (status === 0 ? 'No hay conexión con el servidor. Intenta de nuevo.' : 'Ocurrió un error. Intenta de nuevo.')
    return Promise.reject(new ApiError(status, message))
  },
)
