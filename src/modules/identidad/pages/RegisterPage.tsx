import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, fieldErrors, MENSAJES } from '@/modules/core/api/errors'
import { Aviso } from '@/modules/core/components/errores'
import { camposDeRegistro, CLAVE_NUEVA_RE, TEXTO_REGLA_CLAVE, TEXTOS_ACCESO } from '../utils/erroresAcceso'
import { Badge, Button, Card } from '@/modules/core/design-system'
import { ROLE_HOME } from '@/modules/core/types/roles'
import { Campo, Opciones } from '../components/Campo'
import { a11y, inputCls } from '../utils/campo'
import { useAuth } from '../hooks/useAuth'
import { NAME_MAX, NAME_MIN, NEIGHBORHOOD_MAX } from '../types/auth.dto'
import { MANIQUI_LABEL, type Maniqui } from '../types/usuario.dto'
import { correoValido } from '../utils/formato'
import { LegalConsentCheckboxes, type LegalConsentState, type LegalConsentErrors } from '@/modules/legal/components/LegalConsentCheckboxes'
import { consentService } from '@/modules/legal/services/consentService'

type Errores = Partial<Record<'nombre' | 'email' | 'barrio' | 'password' | 'terminos', string>>

/**
 * SR-RF-01: registro de una persona (rol comprador) en ms-usuarios (POST /api/v1/users).
 * El correo queda sin verificar: al terminar se pasa al inicio de sesión para ingresar el código OTP.
 */
export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tipoParam = params.get('tipo')?.toLowerCase()
  const registerRole: 'BUYER' | 'STORE_ADMIN' | 'FOUNDATION_REPRESENTATIVE' =
    tipoParam === 'tienda'
      ? 'STORE_ADMIN'
      : tipoParam === 'fundacion'
        ? 'FOUNDATION_REPRESENTATIVE'
        : 'BUYER'
  const esTienda = registerRole === 'STORE_ADMIN'
  const esFundacion = registerRole === 'FOUNDATION_REPRESENTATIVE'
  const esComprador = registerRole === 'BUYER'
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [barrio, setBarrio] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [maniqui, setManiqui] = useState<Maniqui>('MUJER')
  const [consentState, setConsentState] = useState<LegalConsentState>({
    aceptaTerminos: false,
    aceptaDatos: false,
    esMayorDeEdad: false,
    aceptaPromociones: false,
  })
  const [consentErrors, setConsentErrors] = useState<LegalConsentErrors>({})
  const [errores, setErrores] = useState<Errores>({})
  const [general, setGeneral] = useState('')
  /** 409: texto de ms-usuarios («El correo electrónico … ya se encuentra registrado») o el del plan. */
  const [noSePudo, setNoSePudo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const validar = (): { formErrors: Errores; legalErrors: LegalConsentErrors } => {
    const e: Errores = {}
    const cErr: LegalConsentErrors = {}

    const n = nombre.trim().length
    if (n < NAME_MIN || n > NAME_MAX) e.nombre = `Escribe tu nombre completo (de ${NAME_MIN} a ${NAME_MAX} caracteres).`
    if (!correoValido(email))
      e.email = 'Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.'
    if (barrio.trim().length > NEIGHBORHOOD_MAX) e.barrio = `El barrio no puede superar ${NEIGHBORHOOD_MAX} caracteres.`
    if (!CLAVE_NUEVA_RE.test(password)) e.password = TEXTO_REGLA_CLAVE

    if (!consentState.aceptaTerminos || !consentState.aceptaDatos) {
      cErr.terminos = 'Para crear la cuenta debes aceptar los términos y la política de datos.'
    }
    if (!consentState.aceptaDatos) {
      cErr.datos = 'Debes autorizar el tratamiento de datos personales (Habeas Data).'
    }
    if (!consentState.esMayorDeEdad) {
      cErr.edad = 'Debes confirmar que eres mayor de 18 años.'
    }

    return { formErrors: e, legalErrors: cErr }
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (inFlight.current) return
    const { formErrors, legalErrors } = validar()
    setErrores(formErrors)
    setConsentErrors(legalErrors)
    setGeneral('')
    setNoSePudo(null)

    const primero = (['nombre', 'email', 'barrio', 'password'] as const).find((k) => formErrors[k])
    if (primero) {
      document.getElementById(`su-${primero}`)?.focus()
      return
    }
    if (Object.keys(legalErrors).length > 0) {
      document.getElementById('consent-terminos')?.focus()
      return
    }

    inFlight.current = true
    setLoading(true)

    // Registrar consentimiento de Habeas Data con trazabilidad
    await consentService.recordFormConsent({
      email: email.trim(),
      aceptaTerminos: consentState.aceptaTerminos,
      aceptaDatos: consentState.aceptaDatos,
      esMayorDeEdad: consentState.esMayorDeEdad,
      aceptaPromociones: consentState.aceptaPromociones,
      origen: esFundacion
        ? 'REGISTER_PAGE_FUNDACION'
        : esTienda
          ? 'REGISTER_PAGE_TIENDA'
          : 'REGISTER_PAGE_COMPRADOR',
    })

    try {
      const r = await register({
        name: nombre.trim(),
        email: email.trim(),
        password,
        neighborhood: barrio,
        ...(esComprador ? { maniqui } : {}),
        aceptaTerminos: consentState.aceptaTerminos,
        dataPolicyAccepted: consentState.aceptaDatos,
        ...(registerRole !== 'BUYER' ? { role: registerRole } : {}),
      })
      // Correo sin verificar (SR-RF-01): el código OTP se ingresa en el modal de inicio de sesión.
      if (r.kind === 'otp') { navigate('/?login', { replace: true }); return }
      const target = r.user.role === 'STORE_ADMIN' ? '/tienda/suscripcion/activar' : ROLE_HOME[r.user.role]
      navigate(target, { replace: true })
    } catch (err) {
      const kind = errorKind(err)
      const campos = camposDeRegistro(fieldErrors(err))
      const primero = (['nombre', 'email', 'barrio', 'password'] as const).find((k) => campos[k])
      if (primero) {
        // 400 · 422 con campos: el mensaje del servidor va debajo de cada campo y el cursor al primero.
        setErrores(campos)
        document.getElementById(`su-${primero}`)?.focus()
      } else if (kind === 'conflicto' || kind === 'datos') {
        // 409 EMAIL_ALREADY_REGISTERED (o 400/422 sin campos): el texto real de ms-usuarios, como pidió el back.
        setNoSePudo((err instanceof ApiError ? err.detail : undefined) ?? TEXTOS_ACCESO.registro)
      } else {
        setGeneral(kind === 'servidor' ? MENSAJES.servidor : errorMessage(err, 'No se pudo crear la cuenta. Intenta de nuevo.'))
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
              {esFundacion
                ? 'Registra tu fundación'
                : esTienda
                  ? 'Registra tu tienda'
                  : 'Crea tu cuenta'}
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

            <Campo
              id="su-nombre"
              label={
                esFundacion
                  ? 'Nombre de la fundación'
                  : esTienda
                    ? 'Nombre de la tienda'
                    : 'Nombre completo'
              }
              error={errores.nombre}
            >
              <input
                {...a11y('su-nombre', errores.nombre)}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete={esComprador ? 'name' : 'organization'}
                maxLength={60}
                placeholder={
                  esFundacion
                    ? 'Ej. Fundación Abrigo Bogotá'
                    : esTienda
                      ? 'Ej. Taller Chapinero'
                      : 'Ej. Valentina Rojas'
                }
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
            <Campo id="su-barrio" label="Barrio (opcional)" error={errores.barrio}>
              <input
                {...a11y('su-barrio', errores.barrio)}
                type="text"
                value={barrio}
                maxLength={NEIGHBORHOOD_MAX}
                onChange={(e) => setBarrio(e.target.value)}
                autoComplete="address-level3"
                placeholder="Ej. Chapinero"
                className={inputCls}
              />
            </Campo>
            <Campo
              id="su-password"
              label="Contraseña"
              error={errores.password}
              hint={TEXTO_REGLA_CLAVE}
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
            {esComprador && (
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
            )}
            {/* Consentimientos legales normativos separados */}
            <LegalConsentCheckboxes
              state={consentState}
              onChange={(updates) => {
                setConsentState((prev) => ({ ...prev, ...updates }))
                setConsentErrors((prev) => {
                  const copy = { ...prev }
                  if (updates.aceptaTerminos) delete copy.terminos
                  if (updates.aceptaDatos) delete copy.datos
                  if (updates.esMayorDeEdad) delete copy.edad
                  return copy
                })
              }}
              errors={consentErrors}
              role={registerRole}
              showPromociones={true}
            />

            {noSePudo && (
              <Aviso
                tono="error"
                titulo={noSePudo}
                accion={
                  <>
                    <Link
                      to="/login"
                      className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-on-accent)]"
                    >
                      Iniciar sesión
                    </Link>
                  </>
                }
              >
                Si ya tienes una cuenta, inicia sesión.
              </Aviso>
            )}
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
