import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { authService } from '../services/authService'
import { marcarSalidaVoluntaria } from '../states/salida'
import { CLAVE_NUEVA_RE, errorDeRestablecer, TEXTOS_RESTABLECER, type ErrorRestablecer } from '../utils/erroresAcceso'
import './ResetPasswordPage.css'

type Step = 'email' | 'verify' | 'done'
type Campos = ErrorRestablecer['campos'] & { confirm?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Espera de «Reenviar código»: ms-auth permite 4 códigos por correo cada 15 minutos. */
const ESPERA_REENVIO = 60

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Cuenta regresiva de un segundo en un segundo. */
function useCuentaAtras(): [number, (s: number) => void] {
  const [s, setS] = useState(0)
  useEffect(() => {
    if (s <= 0) return
    const id = window.setTimeout(() => setS((x) => Math.max(0, x - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [s])
  return [s, setS]
}

/**
 * El servidor ya revocó el accessToken y el refreshToken: se borran también aquí, sin llamar a /logout
 * y sin el aviso de «sesión vencida».
 */
function borrarSesionLocal() {
  if (!tokenStorage.get()) return
  tokenStorage.clear()
  marcarSalidaVoluntaria()
  window.dispatchEvent(new Event('sr:sesion-expirada'))
}

/**
 * «¿Olvidaste tu contraseña?» (ms-auth · Password reset): sirve para comprador, tienda y fundación.
 * 1) correo → POST /api/v1/auth/password/forgot; 2) código de 6 dígitos + nueva contraseña → POST /api/v1/auth/password/reset.
 * La confirmación de la contraseña se valida solo aquí. La contraseña nueva vive solo en el estado de esta pantalla.
 */
export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [campos, setCampos] = useState<Campos>({})
  const [pedirCodigo, setPedirCodigo] = useState(false)
  const [soporte, setSoporte] = useState(false)
  const [info, setInfo] = useState('')
  const [successText, setSuccessText] = useState('')
  const [cooldown, setCooldown] = useCuentaAtras()
  const [vence, setVence] = useCuentaAtras()
  const [espera, setEspera] = useCuentaAtras()

  const limpiarErrores = () => {
    setError('')
    setCampos({})
    setPedirCodigo(false)
    setSoporte(false)
  }

  const mostrarError = (e: unknown) => {
    const r = errorDeRestablecer(e)
    setError(r.mensaje)
    setCampos(r.campos)
    setPedirCodigo(r.pedirCodigo)
    setSoporte(r.soporte)
    if (r.esperar > 0) setEspera(r.esperar)
  }

  const pedirCodigoAlServidor = async (correo: string) => {
    const res = await authService.requestPasswordReset(correo)
    setInfo(res.message)
    setCooldown(ESPERA_REENVIO)
    setVence(res.expiresInSeconds ?? 0)
  }

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    limpiarErrores()
    setInfo('')
    const clean = email.trim().toLowerCase()
    if (!EMAIL_RE.test(clean)) {
      setCampos({ email: TEXTOS_RESTABLECER.correo })
      return
    }
    setBusy(true)
    try {
      await pedirCodigoAlServidor(clean)
      setEmail(clean)
      setStep('verify')
    } catch (err) {
      mostrarError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (busy || cooldown > 0) return
    limpiarErrores()
    setInfo('')
    setBusy(true)
    try {
      await pedirCodigoAlServidor(email)
      setOtpCode('')
    } catch (err) {
      mostrarError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault()
    limpiarErrores()
    const cleanOtp = otpCode.replace(/\D/g, '')
    const nuevos: Campos = {}
    if (cleanOtp.length !== 6) nuevos.otpCode = TEXTOS_RESTABLECER.codigo
    if (!CLAVE_NUEVA_RE.test(newPassword)) nuevos.newPassword = TEXTOS_RESTABLECER.clave
    else if (newPassword !== confirmPassword) nuevos.confirm = TEXTOS_RESTABLECER.noCoinciden
    if (Object.keys(nuevos).length) {
      setCampos(nuevos)
      return
    }
    setBusy(true)
    try {
      const res = await authService.confirmPasswordReset({ email, otpCode: cleanOtp, newPassword })
      borrarSesionLocal()
      setNewPassword('')
      setConfirmPassword('')
      setOtpCode('')
      setSuccessText(res.message)
      setStep('done')
    } catch (err) {
      mostrarError(err)
    } finally {
      setBusy(false)
    }
  }

  const campoError = (id: string, texto?: string) =>
    texto ? <p id={id} role="alert" className="mt-1.5 text-xs font-semibold text-rose-300">{texto}</p> : null

  const errorGeneral = error ? (
    <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300">
      {error}
      {soporte && (
        <> <Link to="/legal/centro-ayuda" className="underline underline-offset-2">Escribe a soporte</Link>.</>
      )}
    </p>
  ) : null

  return (
    <div className="sr-reset-password-page relative min-h-[calc(100vh-5rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e0b16]/85 via-[#0e0b16]/65 to-[#0e0b16]/35"
      />
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#151121]/85 p-7 text-white shadow-2xl backdrop-blur-xl sm:p-9">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-violeta-claro">Seguridad de cuenta</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">Restablecer contraseña</h1>

          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="mt-5 space-y-4" noValidate>
              <p className="text-sm text-[var(--color-text-muted)]">
                Ingresa el correo de tu cuenta y te enviaremos un código de 6 dígitos para crear una contraseña nueva.
              </p>

              <div>
                <label htmlFor="reset-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Correo registrado</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!campos.email}
                  aria-describedby={campos.email ? 'reset-email-error' : undefined}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-violeta"
                />
                {campoError('reset-email-error', campos.email)}
              </div>

              {errorGeneral}

              <button type="submit" disabled={busy || espera > 0} className="w-full rounded-xl bg-violeta px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-violeta-hover disabled:opacity-60">
                {espera > 0 ? `Intenta de nuevo en ${espera}s` : busy ? 'Enviando código…' : 'Enviar código'}
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-4">← Volver a iniciar sesión</Link>
              </div>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleConfirmReset} className="mt-5 space-y-4" noValidate>
              <p className="text-sm text-[var(--color-text-muted)]">
                {info} Revisa <b className="text-[var(--color-text)]">{email}</b> e ingresa el código junto con tu nueva contraseña.
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {vence > 0 ? `El código vence en ${mmss(vence)}.` : 'Si el código venció, pide uno nuevo con «Reenviar código».'}
              </p>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="reset-otp" className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Código (6 dígitos)</label>
                  <button
                    type="button"
                    disabled={busy || cooldown > 0 || espera > 0}
                    onClick={handleResend}
                    className="text-xs font-semibold text-violeta-claro hover:underline disabled:opacity-50"
                  >
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
                  </button>
                </div>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  aria-invalid={!!campos.otpCode}
                  aria-describedby={campos.otpCode ? 'reset-otp-error' : undefined}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-base tracking-[0.3em] text-[var(--color-text)] outline-none focus:border-violeta"
                />
                {campoError('reset-otp-error', campos.otpCode)}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="reset-new-password" className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Nueva contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showPass ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  id="reset-new-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="De 8 a 72 caracteres"
                  maxLength={72}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  aria-invalid={!!campos.newPassword}
                  aria-describedby={campos.newPassword ? 'reset-new-password-error' : 'reset-new-password-hint'}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-violeta"
                />
                {campos.newPassword
                  ? campoError('reset-new-password-error', campos.newPassword)
                  : <p id="reset-new-password-hint" className="mt-1.5 text-xs text-[var(--color-text-muted)]">{TEXTOS_RESTABLECER.clave}</p>}
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Confirmar nueva contraseña</label>
                <input
                  id="reset-confirm-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repite la nueva contraseña"
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={!!campos.confirm}
                  aria-describedby={campos.confirm ? 'reset-confirm-error' : undefined}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-violeta"
                />
                {campoError('reset-confirm-error', campos.confirm)}
              </div>

              {campoError('reset-email-error', campos.email)}
              {errorGeneral}

              <button type="submit" disabled={busy || espera > 0 || pedirCodigo} className="w-full rounded-xl bg-violeta px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-violeta-hover disabled:opacity-60">
                {espera > 0
                  ? `Espera ${espera}s y pide un código nuevo`
                  : pedirCodigo
                    ? 'Pide un código nuevo para continuar'
                    : busy ? 'Cambiando contraseña…' : 'Cambiar contraseña'}
              </button>

              <div className="pt-1 text-center">
                <button type="button" onClick={() => { setStep('email'); limpiarErrores() }} className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-4">
                  Cambiar correo
                </button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div role="status" className="mt-6 space-y-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-400">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[var(--color-text)]">¡Contraseña restablecida!</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{successText}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Por seguridad cerramos tu sesión en todos los dispositivos.</p>
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-violeta px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-violeta-hover"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
