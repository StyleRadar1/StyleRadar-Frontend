import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/modules/identidad/mocks/demoAccounts'
import { ROLE_HOME, ROLE_LABEL } from '@/modules/core/types/roles'
import { ApiError } from '@/modules/core/api/apiClient'

type DemoAccountRole = (typeof DEMO_ACCOUNTS)[number]['role']

const ROLE_PREVIEW: Record<DemoAccountRole, { src: string; alt: string }> = {
  COMPRADOR: { src: '/img/representantes/R1.png', alt: 'Personas probándose ropa' },
  ADMIN_ALMACEN: { src: '/img/representantes/R2.png', alt: 'Representante de una tienda local' },
  REPRESENTANTE_FUNDACION: { src: '/img/representantes/R3.png', alt: 'Voluntarios de una fundación' },
  ADMIN_STYLERADAR: { src: '/img/representantes/R4.png', alt: 'Administrador de StyleRadar frente a Bogotá' },
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab)
  const [step, setStep] = useState<'form' | 'otp'>('form')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Campos para registro
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'COMPRADOR' | 'ADMIN_ALMACEN' | 'REPRESENTANTE_FUNDACION'>('COMPRADOR')
  const [previewRole, setPreviewRole] = useState<DemoAccountRole | null>(null)

  // OTP 6 dígitos
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setActiveTab(initialTab)
    setStep('form')
    setError('')
    setPreviewRole(null)
  }, [initialTab, isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || password.length < 4) {
      setError('Escribe tu correo y una contraseña de al menos 4 caracteres.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const user = await login({ email, password })
      onClose()
      navigate(ROLE_HOME[user.role], { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Credenciales inválidas.')
    } finally {
      setLoading(false)
    }
  }

  const selectDemoAccount = (demoEmail: string) => {
    const account = DEMO_ACCOUNTS.find((item) => item.email === demoEmail)
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setError('')
    setPreviewRole(account?.role ?? null)
  }

  const activePhoto = previewRole
    ? ROLE_PREVIEW[previewRole]
    : { src: activeTab === 'login' ? '/img/representantes/S1.png' : '/img/representantes/S2.png', alt: activeTab === 'login' ? 'Representante iniciando sesión' : 'Representantes creando una cuenta' }

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || password.length < 4 || !fullName) {
      setError('Por favor completa todos los campos requeridos.')
      return
    }
    setError('')
    // Simulación del paso a verificación de 2 factores (RF-92)
    setStep('otp')
  }

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = val
    setOtp(newOtp)

    // Auto-focus siguiente input si hay valor
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Ingresa el código completo de 6 dígitos.')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Simular login exitoso tras verificación
      const user = await login({ email: 'usuario@styleradar.co', password: DEMO_PASSWORD })
      onClose()
      navigate(ROLE_HOME[user.role], { replace: true })
    } catch (err) {
      setError('Código inválido o expirado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="authTitle"
    >
      {/* Fondo oscuro con desenfoque */}
      <div
        className="fixed inset-0 bg-[#0e0a14]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor Modal: Pila Foto + Vidrio */}
      <div className="relative z-10 w-full max-w-4xl bg-[#1f1b26] border border-white/15 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Columna Izquierda: Foto Editorial */}
        <div className="hidden md:block md:col-span-5 relative bg-[#15121b] overflow-hidden">
          <img
            src={activePhoto.src}
            alt={activePhoto.alt}
            className="w-full h-full object-cover object-[50%_45%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#15121b]/95 via-[#15121b]/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#a98be0]">
              StyleRadar · Bogotá
            </span>
            <p className="text-sm font-extrabold text-white leading-snug">
              Conectando boutiques, personas y fundaciones en un solo radar.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Autenticación */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          {/* Barra superior de marca y botón cerrar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-auto" />
              <span className="font-extrabold text-xs uppercase tracking-wider text-white">
                StyleRadar
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>

          {step === 'form' ? (
            <div className="space-y-6">
              {/* Selector de Pestañas: Iniciar sesión / Registro */}
              <div
                role="tablist"
                aria-label="Cuenta"
                className="grid grid-cols-2 p-1 rounded-full bg-white/5 border border-white/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'login'}
                  onClick={() => {
                    setActiveTab('login')
                    setError('')
                    setPreviewRole(null)
                  }}
                  className={`py-2 text-xs font-black uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[#48119a] text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'register'}
                  onClick={() => {
                    setActiveTab('register')
                    setError('')
                    setPreviewRole(null)
                  }}
                  className={`py-2 text-xs font-black uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#48119a] text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>

              {/* Título de la sección */}
              <div>
                <h2 id="authTitle" className="text-2xl sm:text-3xl font-extrabold text-white">
                  {activeTab === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
                </h2>
                <p className="text-xs text-[#b9b9ca] mt-1">
                  {activeTab === 'login'
                    ? 'Entra con tu correo registrado para continuar.'
                    : 'Únete a StyleRadar y descubre la moda de tu ciudad.'}
                </p>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-medium"
                >
                  {error}
                </div>
              )}

              {/* Formulario de Login */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="authEmail"
                      className="text-[11px] font-bold uppercase tracking-wider text-white/70"
                    >
                      Correo electrónico
                    </label>
                    <input
                      id="authEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-[#48119a] focus:bg-white/10 text-white text-sm outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="authPass"
                      className="text-[11px] font-bold uppercase tracking-wider text-white/70"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="authPass"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-[#48119a] focus:bg-white/10 text-white text-sm outline-none transition-all pr-20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#a98be0] hover:text-white"
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/70 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded accent-[#48119a]"
                      />
                      <span>Recordarme</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setError('Contacta a soporte o usa una cuenta demo.')}
                      className="text-[#a98be0] hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-full bg-[#48119a] hover:bg-[#5e18c8] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#48119a55] transition-all cursor-pointer"
                  >
                    {loading ? 'Entrando…' : 'Entrar a StyleRadar'}
                  </button>
                </form>
              ) : (
                /* Formulario de Registro */
                <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre o el de tu marca"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-[#48119a] focus:bg-white/10 text-white text-sm outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-[#48119a] focus:bg-white/10 text-white text-sm outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Tipo de cuenta
                    </label>
                    <select
                      value={role}
                      onChange={(e) => {
                        const nextRole = e.target.value as typeof role
                        setRole(nextRole)
                        setPreviewRole(nextRole)
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-[#1f1b26] border border-white/15 text-white text-sm outline-none"
                    >
                      <option value="COMPRADOR">Persona / Comprador</option>
                      <option value="ADMIN_ALMACEN">Tienda o Boutique local</option>
                      <option value="REPRESENTANTE_FUNDACION">Fundación aliada</option>
                    </select>
                    <img
                      src={role === 'COMPRADOR' ? '/img/representantes/R1.png' : role === 'ADMIN_ALMACEN' ? '/img/representantes/R2.png' : '/img/representantes/R3.png'}
                      alt={role === 'COMPRADOR' ? 'Personas usando el probador' : role === 'ADMIN_ALMACEN' ? 'Representante de una tienda local' : 'Voluntarios de una fundación'}
                      loading="lazy"
                      className="mx-auto mt-3 block h-56 w-auto max-w-full rounded-xl bg-[#15121b] object-contain"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-[#48119a] focus:bg-white/10 text-white text-sm outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#48119a] hover:bg-[#5e18c8] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#48119a55] transition-all cursor-pointer"
                  >
                    Continuar a verificación ↗
                  </button>
                </form>
              )}

              {/* Seleccionar una cuenta demo solo completa el formulario; el ingreso requiere submit. */}
              {activeTab === 'login' && (
                <div className="pt-4 border-t border-white/10 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-white/60 font-semibold uppercase tracking-wider">
                    <span>Elige una cuenta y luego oprime Entrar:</span>
                    <span className="text-[#a98be0]">Clave: 1234</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={loading}
                        onClick={() => selectDemoAccount(acc.email)}
                        className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-[#48119a]/40 border border-white/10 text-[11px] font-bold text-white/90 hover:text-white transition-all text-center truncate cursor-pointer"
                      >
                        {ROLE_LABEL[acc.role]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Pantalla de OTP (Verificación en dos pasos RF-92) */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#48119a]/30 border border-[#48119a] flex items-center justify-center text-white mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white">Verifica que eres tú</h3>
                <p className="text-xs text-[#b9b9ca] max-w-sm mx-auto">
                  Enviamos un código de 6 dígitos a <b className="text-white">{email}</b>. Vence en
                  10 minutos.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-medium text-center"
                >
                  {error}
                </div>
              )}

              {/* Grid de 6 dígitos */}
              <div className="flex justify-center gap-2 sm:gap-3 py-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-black text-white rounded-xl bg-white/5 border border-white/20 focus:border-[#7b4dd8] focus:bg-white/10 outline-none transition-all"
                    aria-label={`Dígito ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#48119a] hover:bg-[#5e18c8] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#48119a55] transition-all cursor-pointer"
                >
                  {loading ? 'Verificando…' : 'Confirmar y entrar'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full text-center text-xs font-semibold text-white/60 hover:text-white transition-colors"
                >
                  ← Volver al formulario
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

