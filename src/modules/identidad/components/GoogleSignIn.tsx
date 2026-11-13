import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ApiError } from '@/modules/core/api/apiClient'
import { ROLE_LABEL } from '@/modules/core/types/roles'
import { env } from '@/configs/env'
import { useAuth } from '../hooks/useAuth'
import { DEMO_ACCOUNTS } from '../mocks/demoAccounts'
import { DEMO_GOOGLE_PREFIX } from '../services/authService'
import type { UserSessionDto } from '../types/auth.dto'
import { googleIdToken } from '../utils/googleIdentity'

/**
 * P14 · «Continuar con Google» en lugar del código OTP. Con servicios reales usa Google Identity Services;
 * en modo demostración muestra un selector con las cuentas de prueba (no se conecta con Google).
 */
export function GoogleSignIn({ onSignedIn }: { onSignedIn: (user: UserSessionDto) => void }) {
  const { loginWithGoogle } = useAuth()
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const enter = async (idToken: string) => {
    setBusy(true); setError('')
    try { onSignedIn(await loginWithGoogle(idToken)) }
    catch (e) { setError(e instanceof ApiError || e instanceof Error ? e.message : 'No pudimos iniciar sesión con Google.') }
    finally { setBusy(false) }
  }
  const start = async () => {
    if (env.useMocks) { setPicking(true); return }
    setError('')
    try { await enter(await googleIdToken()) } catch (e) { setError(e instanceof Error ? e.message : 'No pudimos conectar con Google.') }
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-lavanda bg-blanco px-5 py-3 text-sm font-semibold text-grafito transition hover:bg-arena focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-60"
      >
        <GoogleLogo />
        {busy ? 'Entrando…' : 'Continuar con Google'}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--color-danger-bg)] p-2 text-xs font-semibold text-[var(--color-danger-text)]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
      {/* El selector va fuera del formulario de login (portal) para no anidar formularios */}
      {picking &&
        createPortal(
          <AccountPicker
            onClose={() => setPicking(false)}
            onPick={(email) => {
              setPicking(false)
              enter(`${DEMO_GOOGLE_PREFIX}${email}`)
            }}
          />,
          document.body,
        )}
    </div>
  )
}

/** Selector de cuentas del modo demostración. Accesible: atrapa el foco en la primera opción y cierra con Escape. */
function AccountPicker({ onPick, onClose }: { onPick: (email: string) => void; onClose: () => void }) {
  const titleId = useId()
  const box = useRef<HTMLDivElement>(null)
  const [otra, setOtra] = useState('')

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [onClose])

  // En React los eventos del portal suben al formulario de login: se detienen aquí
  const submit = (e: FormEvent) => { e.preventDefault(); e.stopPropagation(); if (/^\S+@\S+\.\S+$/.test(otra.trim())) onPick(otra) }

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[var(--color-overlay,rgba(0,0,0,0.65))] p-4 backdrop-blur-md"
      style={{ zIndex: 200 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[430px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 text-[var(--color-text)] shadow-2xl backdrop-blur-xl"
      >
        <div className="pr-10">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--color-text-muted)]">
            Continuar con Google
          </p>
          <h2 id={titleId} className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            Elige una cuenta
          </h2>
        </div>

        <p className="mt-2 text-sm text-[var(--color-accent)] font-medium">para continuar a StyleRadar</p>

        <ul className="mt-4 space-y-2.5">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                onClick={() => onPick(a.email)}
                className="flex w-full items-center gap-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-left transition hover:border-[var(--color-focus-ring)] hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-[var(--color-text-on-accent)]"
                >
                  {a.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm font-bold text-[var(--color-text)]">{a.name}</b>
                  <span className="block truncate text-xs text-[var(--color-text-muted)]">
                    {a.email} · {ROLE_LABEL[a.role]}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="mt-4">
          <label
            htmlFor="g-otra"
            className="inline-flex items-center text-xs font-semibold text-[var(--color-text)] before:mr-1.5 before:text-[10px] before:content-['▸']"
          >
            Usar otra cuenta
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="g-otra"
              type="email"
              value={otra}
              onChange={(e) => setOtra(e.target.value)}
              placeholder="tucorreo@gmail.com"
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-focus-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]/20"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-on-accent)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              Seguir
            </button>
          </div>
        </form>

        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Simulación del prototipo: no se conecta con Google.
        </p>

        <div className="mt-4 flex justify-end border-t border-[var(--color-border)] pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            Cancelar
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar selector"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/** Logo oficial de Google: sus colores son obligatorios en los botones de ingreso. */
function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
