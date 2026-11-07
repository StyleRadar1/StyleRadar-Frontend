/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_USE_MOCKS?: string
  /** local, qa o prod */
  readonly VITE_APP_ENV?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
