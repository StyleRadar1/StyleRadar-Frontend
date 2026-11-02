/** Configuración por ambiente. Nunca se guardan secretos en el front. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true',
}
