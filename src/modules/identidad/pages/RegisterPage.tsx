import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorKind, errorMessage, fieldErrors, MENSAJES } from '@/modules/core/api/errors'
import { Aviso } from '@/modules/core/components/errores'
import { camposDeRegistro, TEXTOS_ACCESO } from '../utils/erroresAcceso'
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
  const [noSePudo, setNoSePudo] = useState(false)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const validar = (): Errores => {
    const e: Errores = {}
    if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo (mínimo 3 letras).'
    if (!correoValido(email)) e.email = 'Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.'
    if (password.length < PASSWORD_MIN) e.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`
    if (!terminos) e.terminos = 'Para crear la cuenta debes aceptar los términos y la política de datos.'
    return e
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (inFlight.current) return
    const e = validar(); setErrores(e); setGeneral(''); setNoSePudo(false)
    const primero = (['nombre', 'email', 'password', 'terminos'] as const).find((k) => e[k])
    if (primero) { document.getElementById(`su-${primero}`)?.focus(); return }
    inFlight.current = true; setLoading(true)
    try {
      const user = await register({ nombre: nombre.trim(), email: email.trim(), password, maniqui, aceptaTerminos: terminos })
      navigate(ROLE_HOME[user.role], { replace: true })
    } catch (err) {
      const kind = errorKind(err)
      const campos = camposDeRegistro(fieldErrors(err))
      const primero = (['nombre', 'email', 'password'] as const).find((k) => campos[k])
      if (primero) {
        // 400 · 422 con campos: el mensaje del servidor va debajo de cada campo y el cursor al primero.
        setErrores(campos); document.getElementById(`su-${primero}`)?.focus()
      } else if (kind === 'conflicto' || kind === 'datos') {
        // 409 · 422 «el correo ya tiene cuenta»: nunca se confirma que el correo existe.
        setNoSePudo(true)
      } else setGeneral(kind === 'servidor' ? MENSAJES.servidor : errorMessage(err, 'No se pudo crear la cuenta. Intenta de nuevo.'))
    } finally {
      inFlight.current = false; setLoading(false)
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      <img src="/img/crear-cuenta.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_40%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#140e20]/80 via-[#140e20]/30 to-[#140e20]/60" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
        <div className="hidden md:block">
          <Badge>Crear cuenta</Badge>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight">Tu estilo, en tu talla y cerca de ti</h1>
          <p className="mt-4 max-w-md text-white/80">Guarda tus tallas, pruébate prendas en el maniquí y encuentra la tienda de Bogotá que la tiene.</p>
        </div>
        <Card className="bg-grafito/60 p-7">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate aria-labelledby="su-titulo">
            <h2 id="su-titulo" className="text-3xl font-extrabold">Crea tu cuenta</h2>
            <p className="-mt-2 text-sm text-white/75">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-arena underline underline-offset-4">Inicia sesión</Link></p>

            <Campo id="su-nombre" label="Nombre completo" error={errores.nombre}>
              <input {...a11y('su-nombre', errores.nombre)} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={60} placeholder="Ej. Valentina Rojas" className={inputCls} />
            </Campo>
            <Campo id="su-email" label="Correo" error={errores.email}>
              <input {...a11y('su-email', errores.email)} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tucorreo@ejemplo.com" className={inputCls} />
            </Campo>
            <Campo id="su-password" label="Contraseña" error={errores.password} hint={`Mínimo ${PASSWORD_MIN} caracteres.`}>
              <div className="relative">
                <input {...a11y('su-password', errores.password, true)} type={ver ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={`${inputCls} pr-24`} />
                <button type="button" onClick={() => setVer(!ver)} aria-pressed={ver} className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-white/80 hover:bg-white/10">{ver ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </Campo>
            <div>
              <Opciones label="Maniquí del probador" options={['MUJER', 'HOMBRE'] as const} value={maniqui} onChange={setManiqui} labels={MANIQUI_LABEL} />
              <p className="mt-1.5 text-xs text-white/60">Puedes cambiarlo después en tu perfil.</p>
            </div>
            <div>
              <label className="flex items-start gap-3 text-sm text-white/85">
                <input id="su-terminos" type="checkbox" checked={terminos} onChange={(e) => setTerminos(e.target.checked)}
                  aria-invalid={!!errores.terminos} aria-describedby={errores.terminos ? 'su-terminos-err' : undefined} className="mt-0.5 h-5 w-5 shrink-0 accent-violeta" />
                <span>Acepto los términos de uso y la política de tratamiento de datos.</span>
              </label>
              {errores.terminos && <p id="su-terminos-err" role="alert" className="mt-1.5 text-xs text-[var(--sr-bad,#ffb4b4)]">{errores.terminos}</p>}
            </div>

            {noSePudo && (
              <Aviso tono="error" titulo={TEXTOS_ACCESO.registro}
                accion={<>
                  <Link to="/login" className="rounded-lg bg-violeta px-3 py-1.5 text-xs font-semibold text-white">Iniciar sesión</Link>
                  <Link to="/login" className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold">Recuperar contraseña</Link>
                </>}>
                Si ya tienes una cuenta, inicia sesión o recupera tu contraseña.
              </Aviso>
            )}
            {general && <p role="alert" className="rounded-xl bg-[var(--sr-bad,#ff8a8a)]/10 p-3 text-sm text-[var(--sr-bad,#ffb4b4)]">{general}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creando cuenta…' : 'Crear cuenta'}</Button>
            <p className="text-xs text-white/65">¿Tienes una tienda o una fundación? Se unen a StyleRadar como aliadas, no con este formulario. Mira los <Link to="/planes" className="font-semibold text-arena underline underline-offset-4">planes para comercios</Link>.</p>
          </form>
        </Card>
      </div>
    </section>
  )
}
