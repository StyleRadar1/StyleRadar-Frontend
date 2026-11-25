/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly VITE_APP_ENV?: 'local' | 'qa' | 'production'
  readonly VITE_API_URL?: string
  readonly VITE_USE_MOCKS?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
