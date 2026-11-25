/** Configuración por ambiente. Nunca se guardan secretos en el front. */
export type AppEnvironment = 'local' | 'qa' | 'production'

export interface EnvSource {
  MODE?: string
  VITE_APP_ENV?: string
  VITE_USE_MOCKS?: string
  VITE_USE_MOCKS_PAGOS?: string
  VITE_API_URL?: string
}

export function resolveEnv(source: EnvSource) {
  const modeEnvironment: AppEnvironment = source.MODE === 'qa' ? 'qa'
    : source.MODE === 'production' ? 'production' : 'local'
  const rawEnvironment = source.VITE_APP_ENV ?? modeEnvironment
  if (!['local', 'qa', 'production'].includes(rawEnvironment)) {
    throw new Error(`VITE_APP_ENV debe ser local, qa o production; se recibió "${rawEnvironment}".`)
  }

  const appEnvironment = rawEnvironment as AppEnvironment
  const rawMocks = source.VITE_USE_MOCKS
  if (rawMocks !== undefined && rawMocks !== 'true' && rawMocks !== 'false') {
    throw new Error('VITE_USE_MOCKS debe ser true o false.')
  }
  const useMocks = rawMocks === 'true'

  const rawMocksPagos = source.VITE_USE_MOCKS_PAGOS
  if (rawMocksPagos !== undefined && rawMocksPagos !== '' && rawMocksPagos !== 'true' && rawMocksPagos !== 'false') {
    throw new Error('VITE_USE_MOCKS_PAGOS debe ser true o false.')
  }
  const useMocksPagos = rawMocksPagos === undefined || rawMocksPagos === '' ? useMocks : rawMocksPagos === 'true'

  const apiUrl = source.VITE_API_URL?.trim() || (appEnvironment === 'local' ? 'http://localhost:8080' : '')

  if ((!useMocks || !useMocksPagos) && !apiUrl) {
    throw new Error(`Falta VITE_API_URL para el ambiente ${appEnvironment}. Debe ser la URL del API Gateway.`)
  }
  if (appEnvironment === 'production' && (useMocks || useMocksPagos)) {
    throw new Error('VITE_USE_MOCKS debe ser false en producción.')
  }
  if (apiUrl && !/^https?:\/\//i.test(apiUrl)) {
    throw new Error('VITE_API_URL debe ser una URL HTTP(S) del API Gateway.')
  }

  return {
    appEnvironment,
    apiUrl,
    useMocks,
    useMocksPagos,
  }
}

export const env = resolveEnv(import.meta.env)
