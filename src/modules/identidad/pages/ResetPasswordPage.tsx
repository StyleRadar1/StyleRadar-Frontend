import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { authService } from '../services/authService'
import { PASSWORD_MAX, PASSWORD_MIN } from '../types/auth.dto'
import './ResetPasswordPage.css'

type Step = 'email' | 'verify' | 'done'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [successText, setSuccessText] = useState('Tu contraseña se restableció correctamente.')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    const clean = email.trim().toLowerCase()
    if (!EMAIL_RE.test(clean)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    setBusy(true)
    try {
      const res = await authService.requestPasswordReset(clean)
      setEmail(clean)
      setInfo(res.message)
      setCooldown(60)
      setStep('verify')
    } catch (err) {
      setError(errorMessage(err) || 'No pudimos enviar el código OTP a ese correo.')
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (busy || cooldown > 0) return
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const res = await authService.requestPasswordReset(email)
      setInfo(res.message)
      setCooldown(60)
    } catch (err) {
      setError(errorMessage(err) || 'No pudimos reenviar el código.')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmReset = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const cleanOtp = otpCode.replace(/\D/g, '')
    if (cleanOtp.length !== 6) {
      setError('Ingresa el código OTP de 6 dígitos enviado a tu correo.')
      return
    }
    if (newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
      setError(`La nueva contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    try {
      const res = await authService.confirmPasswordReset({
        email,
        otpCode: cleanOtp,
        newPassword,
      })
      setSuccessText(res.message || 'Tu contraseña se restableció correctamente.')
      setStep('done')
    } catch (err) {
      setError(errorMessage(err) || 'El código OTP es inválido o venció. Intenta nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="sr-reset-password-page relative min-h-[calc(100vh-5rem)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e0b16]/85 via-[#0e0b16]/65 to-[#0e0b16]/35"
      />
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#151121]/85 p-7 text-white shadow-2xl backdrop-blur-xl sm:p-9">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-violeta-claro">
          Seguridad de cuenta
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Restablecer contraseña
        </h1>

        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="mt-5 space-y-4" noValidate>
            <p className="text-sm text-[var(--color-text-muted)]">
              Ingresa tu correo registrado y te enviaremos un código OTP de 6 dígitos para verificar tu identidad.
            </p>

            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Correo registrado
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-violeta"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-violeta px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-violeta-hover disabled:opacity-60"
            >
              {busy ? 'Enviando código OTP…' : 'Enviar código OTP'}
            </button>

            <div className="pt-2 text-center">
              <Link to="/?login" className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-4">
                ← Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleConfirmReset} className="mt-5 space-y-4" noValidate>
            <p className="text-sm text-[var(--color-text-muted)]">
              {info || 'Código enviado.'} Revisa <b className="text-[var(--color-text)]">{email}</b> e ingresa el código junto con tu nueva contraseña.
            </p>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="reset-otp" className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Código OTP (6 dígitos)
                </label>
                <button
                  type="button"
                  disabled={busy || cooldown > 0}
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
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-base tracking-[0.3em] text-[var(--color-text)] outline-none focus:border-violeta"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="reset-new-password" className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Nueva contraseña
                </label>
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
                placeholder={`Mínimo ${PASSWORD_MIN} caracteres`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-violeta"
              />
            </div>

            <div>
              <label htmlFor="reset-confirm-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Confirmar nueva contraseña
              </label>
              <input
                id="reset-confirm-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-violeta"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-violeta px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:bg-violeta-hover disabled:opacity-60"
            >
              {busy ? 'Verificando…' : 'Verificar y restablecer contraseña'}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => { setStep('email'); setError('') }}
                className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-4"
              >
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
              <h2 className="text-xl font-extrabold text-[var(--color-text)]">
                ¡Contraseña restablecida!
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {successText} Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            <Link
              to="/?login"
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
