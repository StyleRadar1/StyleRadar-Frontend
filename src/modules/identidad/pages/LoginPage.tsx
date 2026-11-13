import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card } from '@/modules/core/design-system'
import { ROLE_HOME, ROLE_LABEL } from '@/modules/core/types/roles'
import { ApiError } from '@/modules/core/api/apiClient'
import { GoogleSignIn } from '../components/GoogleSignIn'
import { useAuth } from '../hooks/useAuth'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../mocks/demoAccounts'

/** RF-02 Iniciar sesión. Con ?jurado muestra primero las cuentas de prueba (kit de jurados). */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const jurado = params.has('jurado')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const enter = async (mail: string, pass: string) => {
    setError('')
    setLoading(true)
    try {
      const user = await login({ email: mail, password: pass })
      navigate(ROLE_HOME[user.role], { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || password.length < 4)
      return setError('Escribe tu correo y una contraseña de al menos 4 caracteres.')
    enter(email, password)
  }

  const selectDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      <img
        src="/img/representantes/S1.png"
        alt="Representante de StyleRadar probándose ropa"
        className="absolute inset-0 h-full w-full object-cover object-[50%_45%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)]/90 via-[var(--color-bg)]/40 to-[var(--color-bg)]/80" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
        <div className="hidden md:block">
          <Badge>{jurado ? 'Acceso para jurados' : 'Iniciar sesión'}</Badge>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-[var(--color-text,#ffffff)] drop-shadow-md">
            {jurado ? 'Elige un rol y explora' : 'Qué bueno verte otra vez'}
          </h1>
        </div>
        <Card className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 p-7 text-[var(--color-text)] shadow-2xl backdrop-blur-xl">
          {jurado && (
            <div className="mb-6">
              <p className="text-sm text-[var(--color-text-muted)]">
                Elige un rol para completar los datos. Luego oprime «Entrar» para ingresar:
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <Button
                    key={account.email}
                    variant="arena"
                    disabled={loading}
                    onClick={() => selectDemoAccount(account.email)}
                  >
                    {ROLE_LABEL[account.role]}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <h2 className="text-3xl font-extrabold text-[var(--color-text)]">Inicia sesión</h2>
            <p className="-mt-2 text-sm text-[var(--color-text-muted)]">
              ¿No tienes cuenta?{' '}
              <Link
                to="/registro"
                className="font-semibold text-[var(--color-accent)] underline underline-offset-4"
              >
                Crea una gratis
              </Link>
            </p>
            <GoogleSignIn onSignedIn={(u) => navigate(ROLE_HOME[u.role], { replace: true })} />
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)] before:h-px before:flex-1 before:bg-[var(--color-border)] after:h-px after:flex-1 after:bg-[var(--color-border)]">
              o con tu correo
            </p>
            <label className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)]">
              Correo
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm font-normal normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-focus-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]/20 transition-colors"
              />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)]">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Mínimo 4 caracteres"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm font-normal normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-focus-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]/20 transition-colors"
              />
            </label>
            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-[var(--color-danger-bg)] p-2.5 text-xs font-semibold text-[var(--color-danger-text)]"
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
            {!jurado && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)]">
                  Cuentas de prueba
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => selectDemoAccount(account.email)}
                      className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors"
                    >
                      {ROLE_LABEL[account.role]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
    </section>
  )
}
