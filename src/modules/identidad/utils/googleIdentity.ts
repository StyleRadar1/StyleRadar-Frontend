/**
 * P14 · Obtiene el ID token de Google con Google Identity Services. El token se envía a ms-auth,
 * que es quien lo valida: el front nunca confía en él por su cuenta.
 * Requiere VITE_GOOGLE_CLIENT_ID (ID de cliente OAuth web, público por diseño; no es un secreto).
 */
const CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCRIPT = 'https://accounts.google.com/gsi/client'

interface GoogleApi {
  accounts: { id: {
    initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void; cancel_on_tap_outside?: boolean }) => void
    prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
  } }
}

let script: Promise<void> | null = null
const loadScript = () => (script ??= new Promise<void>((resolve, reject) => {
  const s = document.createElement('script')
  s.src = SCRIPT; s.async = true
  s.onload = () => resolve()
  s.onerror = () => { script = null; reject(new Error('No pudimos conectar con Google. Revisa tu conexión e intenta de nuevo.')) }
  document.head.appendChild(s)
}))

export async function googleIdToken(): Promise<string> {
  if (!CLIENT_ID) throw new Error('El ingreso con Google aún no está configurado en este ambiente.')
  await loadScript()
  const google = (window as unknown as { google?: GoogleApi }).google
  if (!google) throw new Error('No pudimos conectar con Google. Intenta de nuevo.')
  return new Promise<string>((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      cancel_on_tap_outside: true,
      callback: (r) => (r.credential ? resolve(r.credential) : reject(new Error('Google no entregó la cuenta. Intenta de nuevo.'))),
    })
    google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) reject(new Error('Se cerró la ventana de Google sin elegir una cuenta.'))
    })
  })
}
