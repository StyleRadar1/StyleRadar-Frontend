/** Configuración por ambiente. Nunca se guardan secretos en el front. */
export type AppEnvironment = 'local' | 'qa' | 'production'

const modeEnvironment: AppEnvironment = import.meta.env.MODE === 'qa' ? 'qa'
  : import.meta.env.MODE === 'production' ? 'production' : 'local'
const rawEnvironment = import.meta.env.VITE_APP_ENV ?? modeEnvironment
if (!['local', 'qa', 'production'].includes(rawEnvironment)) {
  throw new Error(`VITE_APP_ENV debe ser local, qa o production; se recibió "${rawEnvironment}".`)
}

const appEnvironment = rawEnvironment as AppEnvironment
const rawMocks = import.meta.env.VITE_USE_MOCKS
if (rawMocks !== undefined && rawMocks !== 'true' && rawMocks !== 'false') {
  throw new Error('VITE_USE_MOCKS debe ser true o false.')
}
const useMocks = rawMocks === undefined ? appEnvironment === 'local' : rawMocks === 'true'
const apiUrl = import.meta.env.VITE_API_URL?.trim() || (appEnvironment === 'local' ? 'http://localhost:8080' : '')

if (!useMocks && !apiUrl) {
  throw new Error(`Falta VITE_API_URL para el ambiente ${appEnvironment}. Debe ser la URL del API Gateway.`)
}
if (appEnvironment === 'production' && useMocks) {
  throw new Error('VITE_USE_MOCKS debe ser false en producción.')
}
if (apiUrl && !/^https?:\/\//i.test(apiUrl)) {
  throw new Error('VITE_API_URL debe ser una URL HTTP(S) del API Gateway.')
}

export const env = {
  appEnvironment,
  apiUrl,
  useMocks,
}
