import { resolveMapboxToken } from './utils/mapboxToken'

/** Token PÚBLICO de Mapbox del proyecto (restringido por URL en Mapbox). Es el mismo de .env.example. */
const PUBLIC_TOKEN = 'pk.eyJ1IjoicGlwZS1tb3JhbGVzejA3IiwiYSI6ImNtdzZreG8weDBsNGsyem9vMzR6ZmF5NHUifQ.V-DQc6fG9xtSM4XBOL93-A'

/** VITE_MAPBOX_TOKEN en .env.local tiene prioridad si es un token público; si no, se usa el del proyecto. */
export const MAPBOX_TOKEN = resolveMapboxToken(import.meta.env.VITE_MAPBOX_TOKEN as string | undefined, PUBLIC_TOKEN)
