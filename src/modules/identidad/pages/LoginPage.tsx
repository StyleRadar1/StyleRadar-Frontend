import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card } from '@/modules/core/design-system'
import { ROLE_HOME, ROLE_LABEL } from '@/modules/core/types/roles'
import { ApiError } from '@/modules/core/api/apiClient'
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
    setError(''); setLoading(true)
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
    if (!email || password.length < 4) return setError('Escribe tu correo y una contraseña de al menos 4 caracteres.')
    enter(email, password)
  }

  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      <img src="/img/iniciar-sesion.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_45%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#140e20]/80 via-[#140e20]/30 to-[#140e20]/60" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
        <div className="hidden md:block">
          <Badge>{jurado ? 'Acceso para jurados' : 'Iniciar sesión'}</Badge>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight">{jurado ? 'Elige un rol y explora' : 'Qué bueno verte otra vez'}</h1>
        </div>
        <Card className="bg-grafito/60 p-7">
          {jurado && (
            <div className="mb-6">
              <p className="text-sm text-white/80">Entra con un clic como cualquiera de los cuatro roles:</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <Button key={a.email} variant="arena" disabled={loading} onClick={() => enter(a.email, DEMO_PASSWORD)}>{ROLE_LABEL[a.role]}</Button>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <h2 className="text-3xl font-extrabold">Inicia sesión</h2>
            <p className="-mt-2 text-sm text-white/75">¿No tienes cuenta? <Link to="/registro" className="font-semibold text-arena underline underline-offset-4">Crea una gratis</Link></p>
            <label className="text-[11px] font-bold uppercase tracking-[.14em] text-white/70">Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tucorreo@ejemplo.com"
                className="mt-1 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-3 text-sm font-normal normal-case tracking-normal text-blanco outline-none focus:border-violeta-claro" />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-[.14em] text-white/70">Contraseña
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Mínimo 4 caracteres"
                className="mt-1 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-3 text-sm font-normal normal-case tracking-normal text-blanco outline-none focus:border-violeta-claro" />
            </label>
            {error && <p role="alert" className="text-sm text-[#ffb4b4]">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
            {!jurado && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/60">Cuentas de prueba</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button key={a.email} type="button" onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD) }}
                      className="rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-white/10">{ROLE_LABEL[a.role]}</button>
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
