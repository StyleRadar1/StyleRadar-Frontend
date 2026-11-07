/** Configuración por ambiente. Nunca se guardan secretos en el front. */
export type AppEnv = 'local' | 'qa' | 'prod'

const AMBIENTES: readonly AppEnv[] = ['local', 'qa', 'prod']
const appEnvRaw = import.meta.env.VITE_APP_ENV ?? 'local'
const appEnv: AppEnv = AMBIENTES.includes(appEnvRaw as AppEnv) ? (appEnvRaw as AppEnv) : 'local'

/*
 * Cada ambiente consume solo su propio API Gateway (QA → Gateway de QA, PROD → Gateway de PROD).
 * localhost solo se usa en local: en QA o PROD, si falta la variable, se avisa en vez de
 * llamar a una URL equivocada.
 */
const rawUrl = import.meta.env.VITE_API_URL?.trim()
if (!rawUrl && appEnv !== 'local') {
  console.error(`[StyleRadar] Falta VITE_API_URL para el ambiente «${appEnv}». Configúrala en Vercel.`)
}

export const env = {
  appEnv,
  apiUrl: (rawUrl || (appEnv === 'local' ? 'http://localhost:8080' : '')).replace(/\/+$/, ''),
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true',
}
