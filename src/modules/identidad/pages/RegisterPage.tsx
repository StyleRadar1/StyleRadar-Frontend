import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { Badge, Button, Card } from '@/modules/core/design-system'
import { ROLE_HOME } from '@/modules/core/types/roles'
import { Campo, Opciones } from '../components/Campo'
import { a11y, inputCls } from '../utils/campo'
import { useAuth } from '../hooks/useAuth'
import { PASSWORD_MIN } from '../types/auth.dto'
import { MANIQUI_LABEL, type Maniqui } from '../types/usuario.dto'
import { correoValido } from '../utils/formato'

type Errores = Partial<Record<'nombre' | 'email' | 'password' | 'terminos', string>>

/** RF-01: registro de una persona (rol comprador) contra ms-auth. Al terminar queda con la sesión iniciada. */
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [maniqui, setManiqui] = useState<Maniqui>('MUJER')
  const [terminos, setTerminos] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [general, setGeneral] = useState('')
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const validar = (): Errores => {
    const e: Errores = {}
    if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo (mínimo 3 letras).'
    if (!correoValido(email))
      e.email = 'Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.'
    if (password.length < PASSWORD_MIN)
      e.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`
    if (!terminos)
      e.terminos = 'Para crear la cuenta debes aceptar los términos y la política de datos.'
    return e
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (inFlight.current) return
    const e = validar()
    setErrores(e)
    setGeneral('')
    const primero = (['nombre', 'email', 'password', 'terminos'] as const).find((k) => e[k])
    if (primero) {
      document.getElementById(`su-${primero}`)?.focus()
      return
    }
    inFlight.current = true
    setLoading(true)
    try {
      const user = await register({
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        maniqui,
        aceptaTerminos: terminos,
      })
      navigate(ROLE_HOME[user.role], { replace: true })
    } catch (err) {
      if (errorKind(err) === 'conflicto') {
        setErrores({ email: errorMessage(err) })
        document.getElementById('su-email')?.focus()
      } else {
        setGeneral(errorMessage(err, 'No se pudo crear la cuenta. Intenta de nuevo.'))
      }
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      <img
        src="/img/representantes/S2.png"
        alt="Representantes caminando por calle comercial de Bogotá"
        className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)]/90 via-[var(--color-bg)]/40 to-[var(--color-bg)]/80" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
        <div className="hidden md:block">
          <Badge>Crear cuenta</Badge>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-[var(--color-text,#ffffff)] drop-shadow-md">
            Tu estilo, en tu talla y cerca de ti
          </h1>
          <p className="mt-4 max-w-md text-[var(--color-text-muted)]">
            Guarda tus tallas, pruébate prendas en el maniquí y encuentra la tienda de Bogotá que la
            tiene.
          </p>
        </div>
        <Card className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 p-7 text-[var(--color-text)] shadow-2xl backdrop-blur-xl">
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
            noValidate
            aria-labelledby="su-titulo"
          >
            <h2 id="su-titulo" className="text-3xl font-extrabold text-[var(--color-text)]">
              Crea tu cuenta
            </h2>
            <p className="-mt-2 text-sm text-[var(--color-text-muted)]">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-[var(--color-accent)] underline underline-offset-4"
              >
                Inicia sesión
              </Link>
            </p>

            <Campo id="su-nombre" label="Nombre completo" error={errores.nombre}>
              <input
                {...a11y('su-nombre', errores.nombre)}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                maxLength={60}
                placeholder="Ej. Valentina Rojas"
                className={inputCls}
              />
            </Campo>
            <Campo id="su-email" label="Correo" error={errores.email}>
              <input
                {...a11y('su-email', errores.email)}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                className={inputCls}
              />
            </Campo>
            <Campo
              id="su-password"
              label="Contraseña"
              error={errores.password}
              hint={`Mínimo ${PASSWORD_MIN} caracteres.`}
            >
              <div className="relative">
                <input
                  {...a11y('su-password', errores.password, true)}
                  type={ver ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`${inputCls} pr-24`}
                />
                <button
                  type="button"
                  onClick={() => setVer(!ver)}
                  aria-pressed={ver}
                  className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors"
                >
                  {ver ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </Campo>
            <div>
              <Opciones
                label="Maniquí del probador"
                options={['MUJER', 'HOMBRE'] as const}
                value={maniqui}
                onChange={setManiqui}
                labels={MANIQUI_LABEL}
              />
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                Puedes cambiarlo después en tu perfil.
              </p>
            </div>
            <div>
              <label className="flex items-start gap-3 text-sm text-[var(--color-text)] cursor-pointer">
                <input
                  id="su-terminos"
                  type="checkbox"
                  checked={terminos}
                  onChange={(e) => setTerminos(e.target.checked)}
                  aria-invalid={!!errores.terminos}
                  aria-describedby={errores.terminos ? 'su-terminos-err' : undefined}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                />
                <span>Acepto los términos de uso y la política de tratamiento de datos.</span>
              </label>
              {errores.terminos && (
                <p
                  id="su-terminos-err"
                  role="alert"
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger-text)]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errores.terminos}</span>
                </p>
              )}
            </div>

            {general && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-[var(--color-danger-bg)] p-3 text-sm font-semibold text-[var(--color-danger-text)]"
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
                <span>{general}</span>
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
            <p className="text-xs text-[var(--color-text-muted)]">
              ¿Tienes una tienda o una fundación? Se unen a StyleRadar como aliadas, no con este
              formulario. Mira los{' '}
              <Link
                to="/planes"
                className="font-semibold text-[var(--color-accent)] underline underline-offset-4"
              >
                planes para comercios
              </Link>
              .
            </p>
          </form>
        </Card>
      </div>
    </section>
  )
}
