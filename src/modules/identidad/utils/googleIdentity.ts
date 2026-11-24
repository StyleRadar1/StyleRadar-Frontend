/**
 * P14 · Obtiene el ID token de Google con Google Identity Services. El token se envía a ms-auth,
 * que es quien lo valida: el front nunca confía en él por su cuenta.
 * Requiere VITE_GOOGLE_CLIENT_ID (ID de cliente OAuth web, público por diseño; no es un secreto).
 */
const CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCRIPT = 'https://accounts.google.com/gsi/client'

interface GoogleButtonConfig {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  width?: number
  locale?: string
}

interface GoogleApi {
  accounts: { id: {
    initialize: (o: {
      client_id: string
      callback: (r: { credential?: string }) => void
      cancel_on_tap_outside?: boolean
      use_fedcm_for_prompt?: boolean
    }) => void
    prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
    renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void
  } }
}

export const isGoogleConfigured = (): boolean => Boolean(CLIENT_ID)

let script: Promise<void> | null = null
const loadScript = () => (script ??= new Promise<void>((resolve, reject) => {
  const s = document.createElement('script')
  s.src = SCRIPT; s.async = true
  s.onload = () => resolve()
  s.onerror = () => { script = null; reject(new Error('No pudimos conectar con Google. Revisa tu conexión e intenta de nuevo.')) }
  document.head.appendChild(s)
}))

export async function renderGoogleSignInButton(
  container: HTMLElement,
  onCredential: (idToken: string) => void,
  onError: (err: Error) => void,
): Promise<void> {
  if (!CLIENT_ID) {
    onError(new Error('El ingreso con Google aún no está configurado en este ambiente.'))
    return
  }
  try {
    await loadScript()
    const google = (window as unknown as { google?: GoogleApi }).google
    if (!google) throw new Error('No pudimos conectar con Google. Intenta de nuevo.')
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      use_fedcm_for_prompt: true,
      callback: (r) => {
        if (r.credential) onCredential(r.credential)
        else onError(new Error('Google no entregó la cuenta. Intenta de nuevo.'))
      },
    })
    container.innerHTML = ''
    google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(Math.max(container.offsetWidth || 340, 240), 400),
      locale: 'es',
    })
  } catch (e) {
    onError(e instanceof Error ? e : new Error('No pudimos conectar con Google.'))
  }
}

export async function googleIdToken(): Promise<string> {
  if (!CLIENT_ID) throw new Error('El ingreso con Google aún no está configurado en este ambiente.')
  await loadScript()
  const google = (window as unknown as { google?: GoogleApi }).google
  if (!google) throw new Error('No pudimos conectar con Google. Intenta de nuevo.')
  return new Promise<string>((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      callback: (r) => (r.credential ? resolve(r.credential) : reject(new Error('Google no entregó la cuenta. Intenta de nuevo.'))),
    })
    google.accounts.id.prompt()
  })
}
