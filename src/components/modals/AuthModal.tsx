import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { GoogleSignIn } from '@/modules/identidad/components/GoogleSignIn'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/modules/identidad/mocks/demoAccounts'
import { ROLE_HOME, ROLE_LABEL } from '@/modules/core/types/roles'
import { ApiError } from '@/modules/core/api/apiClient'
import './AuthModal.css'

type DemoAccountRole = (typeof DEMO_ACCOUNTS)[number]['role']
type PicKey = 'login' | 'sign' | 'user' | 'store' | 'found' | 'admin'

const AUTH_PIC: Record<PicKey, { src: string; alt: string }> = {
  login: { src: '/img/representantes/S1.png', alt: 'Representante iniciando sesión' },
  sign: { src: '/img/representantes/S2.png', alt: 'Representantes creando una cuenta' },
  user: { src: '/img/representantes/R1.png', alt: 'Personas probándose ropa' },
  store: { src: '/img/representantes/R2.png', alt: 'Representante de una tienda local' },
  found: { src: '/img/representantes/R3.png', alt: 'Voluntarios de una fundación' },
  admin: { src: '/img/representantes/R4.png', alt: 'Administrador de StyleRadar frente a Bogotá' },
}

const AUTH_CAP: Record<PicKey, [string, string]> = {
  login: ['Iniciar sesión', 'Qué bueno verte otra vez'],
  sign: ['Crear cuenta', 'Empieza tu radar'],
  user: ['Usuario', 'Tu estilo, cerca de ti'],
  store: ['Tienda', 'Que te encuentren en tu talla'],
  found: ['Fundación', 'La ropa sigue su camino'],
  admin: ['Administrador', 'Todo StyleRadar en un vistazo'],
}

const ROLE_TO_PIC: Record<DemoAccountRole, PicKey> = {
  COMPRADOR: 'user',
  ADMIN_ALMACEN: 'store',
  REPRESENTANTE_FUNDACION: 'found',
  ADMIN_STYLERADAR: 'admin',
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

function canAnimate(el: HTMLElement | null): boolean {
  return Boolean(el && typeof el.animate === 'function' && !prefersReducedMotion())
}

async function runAnim(
  el: HTMLElement | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): Promise<void> {
  if (!el || !canAnimate(el)) return
  try {
    const anim = el.animate(keyframes, { fill: 'forwards', ...options })
    if (anim && anim.finished) {
      await anim.finished
    }
  } catch {
    // Ignorar si la animación se cancela al desmontar o cambiar de vista
  }
}

function cancelAnims(el: Element | null) {
  if (!el || typeof (el as HTMLElement).getAnimations !== 'function') return
  try {
    ;(el as HTMLElement).getAnimations().forEach((a) => a.cancel())
  } catch {
    // Ignorar en entornos de prueba sin Web Animations API
  }
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [rendered, setRendered] = useState(isOpen)
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

  // Referencias para la animación de la pila (prototipo 05-core.js)
  const bgRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const capRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)
  const prevSrcRef = useRef<string>('')

  const getPicKey = (
    tab: 'login' | 'register',
    currentPreviewRole: DemoAccountRole | null,
    currentEmail: string,
  ): PicKey => {
    if (currentPreviewRole) return ROLE_TO_PIC[currentPreviewRole]
    if (tab === 'register') return 'sign'
    const matched = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === currentEmail.trim().toLowerCase(),
    )
    return matched ? ROLE_TO_PIC[matched.role] : 'login'
  }

  const picKey = getPicKey(activeTab, previewRole, email)
  const activePhoto = AUTH_PIC[picKey]
  const activeCap = AUTH_CAP[picKey]

  const animateCardIn = async (card: HTMLElement | null) => {
    if (!card) return
    const kids = Array.from(card.children) as HTMLElement[]
    if (!canAnimate(card)) {
      card.style.opacity = '1'
      kids.forEach((k) => {
        k.style.opacity = '1'
      })
      return
    }
    await runAnim(
      card,
      [
        { opacity: 0, transform: 'translateY(48px) scale(.9)', filter: 'blur(14px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ],
      { duration: 680, easing: 'cubic-bezier(.2,.7,.1,1)' },
    )
    kids.forEach((k, i) => {
      void runAnim(
        k,
        [
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 440, delay: i * 45, easing: 'cubic-bezier(.2,.7,.1,1)' },
      )
    })
  }

  const animateCardOut = async (card: HTMLElement | null) => {
    if (!card || !canAnimate(card)) return
    const kids = Array.from(card.children) as HTMLElement[]
    await Promise.all(
      kids
        .slice()
        .reverse()
        .map((k, i) =>
          runAnim(
            k,
            [
              { opacity: 1, transform: 'none' },
              { opacity: 0, transform: 'translateY(-8px)' },
            ],
            { duration: 200, delay: i * 18 },
          ),
        ),
    )
    await runAnim(
      card,
      [
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
        { opacity: 0, transform: 'translateY(34px) scale(.92)', filter: 'blur(12px)' },
      ],
      { duration: 420, easing: 'cubic-bezier(.4,0,.2,1)' },
    )
  }

  // Sincronizar apertura del modal y ejecutar la secuencia openAuth del prototipo
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      setStep('form')
      setError('')
      setPreviewRole(null)
      setRendered(true)
    }
  }, [initialTab, isOpen])

  useEffect(() => {
    if (!rendered || !isOpen) return
    let cancelled = false
    const bg = bgRef.current
    const ph = photoRef.current
    const img = imgRef.current
    const meta = metaRef.current
    const card = cardRef.current

    prevSrcRef.current = activePhoto.src
    document.documentElement.classList.add('lock')

    const openSequence = async () => {
      busyRef.current = true
      if (!canAnimate(ph)) {
        if (bg) bg.style.opacity = '1'
        if (ph) {
          ph.style.opacity = '1'
          ph.style.clipPath = 'inset(0% 0% round 18px)'
        }
        if (meta) meta.style.opacity = '1'
        await animateCardIn(card)
        busyRef.current = false
        return
      }

      void runAnim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 320 })
      await runAnim(
        ph,
        [
          {
            opacity: 0,
            clipPath: 'inset(41% 44% round 12px)',
            transform: 'scale(.55) rotate(-4deg)',
          },
          {
            opacity: 1,
            clipPath: 'inset(38% 41% round 14px)',
            transform: 'scale(1) rotate(0deg)',
          },
        ],
        { duration: 520, easing: 'cubic-bezier(.34,1.56,.64,1)' },
      )
      if (cancelled) return

      void runAnim(
        img,
        [{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
        { duration: 950, easing: 'cubic-bezier(.65,0,.35,1)' },
      )
      await runAnim(
        ph,
        [
          { clipPath: 'inset(38% 41% round 14px)' },
          { clipPath: 'inset(0% 0% round 18px)' },
        ],
        { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)' },
      )
      if (cancelled) return

      void runAnim(
        meta,
        [
          { opacity: 0, transform: 'translateY(-8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 420 },
      )
      await animateCardIn(card)
      busyRef.current = false

      if (!cancelled) {
        window.setTimeout(() => {
          const firstInput = card?.querySelector<HTMLElement>('input')
          firstInput?.focus({ preventScroll: true })
        }, 120)
      }
    }

    void openSequence()

    return () => {
      cancelled = true
      document.documentElement.classList.remove('lock')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered, isOpen])

  // Transición suave de foto (.sr-auth-ghost) y leyenda (.sr-auth-cap) al cambiar rol o pestaña
  useEffect(() => {
    if (!rendered || !isOpen) return
    const ph = photoRef.current
    const img = imgRef.current
    const cap = capRef.current
    const previousSrc = prevSrcRef.current

    if (cap && canAnimate(cap)) {
      void runAnim(
        cap,
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 520, easing: 'cubic-bezier(.2,.7,.1,1)' },
      )
    }

    if (previousSrc && previousSrc !== activePhoto.src && ph && img && canAnimate(ph)) {
      const ghost = document.createElement('img')
      ghost.src = previousSrc
      ghost.alt = ''
      ghost.className = 'sr-auth-ghost'
      ghost.style.transform = window.getComputedStyle(img).transform
      img.after(ghost)
      void runAnim(ghost, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 650,
        easing: 'ease',
      }).then(() => {
        ghost.remove()
      })
    }
    prevSrcRef.current = activePhoto.src
  }, [activePhoto.src, picKey, rendered, isOpen])

  const handleRequestClose = async () => {
    if (busyRef.current) return
    busyRef.current = true
    const bg = bgRef.current
    const ph = photoRef.current
    const img = imgRef.current
    const meta = metaRef.current
    const card = cardRef.current

    if (canAnimate(ph)) {
      await animateCardOut(card)
      void runAnim(meta, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 })
      void runAnim(
        img,
        [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }],
        { duration: 800, easing: 'cubic-bezier(.65,0,.35,1)' },
      )
      await runAnim(
        ph,
        [
          { clipPath: 'inset(0% 0% round 18px)' },
          { clipPath: 'inset(38% 41% round 14px)' },
        ],
        { duration: 780, easing: 'cubic-bezier(.65,0,.35,1)' },
      )
      await runAnim(
        ph,
        [
          { opacity: 1, transform: 'scale(1) rotate(0deg)' },
          { opacity: 0, transform: 'scale(.55) rotate(4deg)' },
        ],
        { duration: 360, easing: 'cubic-bezier(.36,0,.66,-.56)' },
      )
      await runAnim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 280 })
    }

    ;[bg, ph, img, meta, card].forEach(cancelAnims)
    document.documentElement.classList.remove('lock')
    busyRef.current = false
    setRendered(false)
    onClose()
  }

  const handleSwapTab = async (targetTab: 'login' | 'register') => {
    if (busyRef.current || (targetTab === activeTab && step === 'form')) return
    busyRef.current = true
    const card = cardRef.current
    await animateCardOut(card)
    cancelAnims(card)
    setError('')
    setStep('form')
    if (targetTab === 'login') {
      setPreviewRole(null)
    } else {
      setPreviewRole(null)
    }
    setActiveTab(targetTab)
    requestAnimationFrame(() => {
      void animateCardIn(cardRef.current).then(() => {
        busyRef.current = false
        const firstInput = cardRef.current?.querySelector<HTMLElement>('input')
        firstInput?.focus({ preventScroll: true })
      })
    })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && rendered) {
        // Si está abierto otro diálogo en portal (como el selector de Google), dejar que ese cierre primero
        const dialogs = document.querySelectorAll('[role="dialog"]')
        if (dialogs.length > 1) return
        void handleRequestClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rendered])

  if (!rendered && !isOpen) return null

  const finishAuthAndNavigate = (targetPath: string) => {
    document.documentElement.classList.remove('lock')
    setRendered(false)
    onClose()
    navigate(targetPath, { replace: true })
  }

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
      finishAuthAndNavigate(ROLE_HOME[user.role])
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

  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || password.length < 4 || !fullName) {
      setError('Por favor completa todos los campos requeridos.')
      return
    }
    setError('')
    setStep('otp')
  }

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = val
    setOtp(newOtp)

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
      const user = await login({ email: 'usuario@styleradar.co', password: DEMO_PASSWORD })
      finishAuthAndNavigate(ROLE_HOME[user.role])
    } catch {
      setError('Código inválido o expirado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="sr-auth"
      id="auth"
      data-pic={picKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby="authTitle"
    >
      {/* Fondo oscuro con desenfoque */}
      <div
        ref={bgRef}
        className="sr-auth-bg"
        id="authBg"
        onClick={() => void handleRequestClose()}
        aria-hidden="true"
      />

      {/* Contenedor Pila: Foto que se abre + Tarjeta de vidrio encima */}
      <div className="sr-auth-stack">
        <div ref={photoRef} className="sr-auth-photo" id="authPhoto">
          <img
            src={activePhoto.src}
            alt=""
            aria-hidden="true"
            className="sr-auth-backdrop-img"
          />
          <img ref={imgRef} id="authImg" src={activePhoto.src} alt={activePhoto.alt} />
          <div ref={capRef} className="sr-auth-cap" id="authCap" aria-hidden="true">
            <span className="ac-k">{activeCap[0]}</span>
            <b className="ac-t">{activeCap[1]}</b>
          </div>
        </div>

        {/* Barra superior de marca y botón Cerrar */}
        <div ref={metaRef} className="sr-auth-meta" id="authMeta">
          <span className="sr-brand-s">
            <svg viewBox="0 0 556 935" aria-hidden="true">
              <path d="M237 6 L234 6 L209 23 L195 83 L193 85 L147 30 L108 40 L138 147 L58 233 L68 496 L68 544 L62 621 L86 629 L128 639 L160 643 L190 643 L225 636 L245 627 L264 614 L284 594 L298 576 L292 568 L192 477 L210 347 L210 329 L194 169Z" />
              <path d="M410 646 L380 631 L347 610 L344 610 L321 639 L295 663 L274 677 L258 685 L225 696 L189 701 L147 700 L108 694 L54 680 L43 749 L97 767 L128 774 L163 779 L221 779 L264 771 L283 765 L310 753 L330 741 L351 725 L369 708 L389 684 L407 656Z" />
              <path d="M549 696 L467 671 L452 699 L425 736 L396 766 L378 781 L345 803 L321 815 L286 828 L258 835 L202 841 L144 838 L75 824 L29 809 L20 845 L6 888 L43 905 L74 915 L117 924 L154 928 L214 928 L259 923 L303 914 L348 900 L403 875 L431 858 L467 830 L490 807 L507 786 L525 758 L541 724Z" />
            </svg>
            <span>StyleRadar</span>
          </span>
          <button
            type="button"
            id="authClose"
            className="sr-auth-close"
            onClick={() => void handleRequestClose()}
          >
            Cerrar
          </button>
        </div>

        {/* Tarjeta de vidrio */}
        <div ref={cardRef} className="sr-auth-card" id={activeTab === 'login' ? 'authCard' : 'signCard'}>
          {step === 'form' ? (
            <>
              <div className="sr-auth-tabs" role="tablist" aria-label="Cuenta">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'login'}
                  onClick={() => void handleSwapTab('login')}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'register'}
                  onClick={() => void handleSwapTab('register')}
                >
                  Crear cuenta
                </button>
              </div>

              <h2 id="authTitle">{activeTab === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
              <p className="sr-sub">
                {activeTab === 'login'
                  ? 'Entra con Google o con tu correo.'
                  : 'Únete a StyleRadar con Google o con tu correo.'}
              </p>

              <GoogleSignIn onSignedIn={(u) => finishAuthAndNavigate(ROLE_HOME[u.role])} />

              <div className="sr-auth-or">o con tu correo</div>

              {error && (
                <div role="alert" className="sr-auth-err flex items-center gap-2">
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
                </div>
              )}

              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3" noValidate>
                  <div className="sr-field">
                    <label htmlFor="authEmail">Correo</label>
                    <input
                      id="authEmail"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setPreviewRole(null)
                      }}
                      placeholder="tucorreo@ejemplo.com"
                    />
                  </div>

                  <div className="sr-field">
                    <label htmlFor="authPass">Contraseña</label>
                    <div className="sr-pw">
                      <input
                        id="authPass"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                      />
                      <button
                        type="button"
                        id="authShow"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  <div className="sr-auth-row">
                    <label className="sr-check">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Recordarme</span>
                    </label>
                    <button
                      type="button"
                      className="sr-forgot"
                      onClick={() => setError('Contacta a soporte o elige una cuenta de prueba abajo.')}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit"
                    id="authSubmit"
                    disabled={loading}
                    className="sr-auth-submit"
                  >
                    {loading ? 'Entrando…' : 'Entrar'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3" noValidate>
                  <div className="sr-field">
                    <span className="sr-lab" id="suRoleL">
                      ¿Cómo vas a usar StyleRadar?
                    </span>
                    <div className="sr-role-pick" role="radiogroup" aria-labelledby="suRoleL">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={role === 'COMPRADOR'}
                        onClick={() => {
                          setRole('COMPRADOR')
                          setPreviewRole('COMPRADOR')
                        }}
                      >
                        <b>Usuario</b>
                        <span>Descubro, me pruebo y dono</span>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={role === 'ADMIN_ALMACEN'}
                        onClick={() => {
                          setRole('ADMIN_ALMACEN')
                          setPreviewRole('ADMIN_ALMACEN')
                        }}
                      >
                        <b>Tienda</b>
                        <span>Publico mi catálogo</span>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={role === 'REPRESENTANTE_FUNDACION'}
                        onClick={() => {
                          setRole('REPRESENTANTE_FUNDACION')
                          setPreviewRole('REPRESENTANTE_FUNDACION')
                        }}
                      >
                        <b>Fundación</b>
                        <span>Recibo donaciones</span>
                      </button>
                    </div>
                  </div>

                  <div className="sr-field">
                    <label htmlFor="suName">
                      {role === 'ADMIN_ALMACEN'
                        ? 'Nombre de la tienda'
                        : role === 'REPRESENTANTE_FUNDACION'
                          ? 'Nombre de la fundación'
                          : 'Nombre completo'}
                    </label>
                    <input
                      id="suName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={
                        role === 'ADMIN_ALMACEN'
                          ? 'Ej. Luna Store'
                          : role === 'REPRESENTANTE_FUNDACION'
                            ? 'Ej. Fundación Abrigo Bogotá'
                            : 'Ej. Valentina Rojas'
                      }
                    />
                  </div>

                  <div className="sr-field">
                    <label htmlFor="suEmail">Correo</label>
                    <input
                      id="suEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                    />
                  </div>

                  <div className="sr-field">
                    <label htmlFor="suPass">Contraseña</label>
                    <div className="sr-pw">
                      <input
                        id="suPass"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="suSubmit"
                    disabled={loading}
                    className="sr-auth-submit"
                  >
                    {loading
                      ? 'Creando cuenta…'
                      : role === 'ADMIN_ALMACEN'
                        ? 'Registrar mi tienda'
                        : role === 'REPRESENTANTE_FUNDACION'
                          ? 'Registrar mi fundación'
                          : 'Crear cuenta'}
                  </button>
                </form>
              )}

              {activeTab === 'login' && (
                <div className="sr-auth-demo">
                  <span className="sr-lbl">
                    <span>Cuentas de prueba</span>
                    <span>Clave: 1234</span>
                  </span>
                  <div className="sr-auth-demo-row">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={loading}
                        className={email === acc.email ? 'on' : ''}
                        onClick={() => selectDemoAccount(acc.email)}
                      >
                        {ROLE_LABEL[acc.role]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="sr-auth-foot">
                {activeTab === 'login' ? (
                  <>
                    ¿No tienes cuenta?{' '}
                    <button type="button" onClick={() => void handleSwapTab('register')}>
                      Crear cuenta gratis →
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={() => void handleSwapTab('login')}>
                      Inicia sesión →
                    </button>
                  </>
                )}
              </p>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <h2>Verifica que eres tú</h2>
              <p className="sr-sub">
                Enviamos un código de 6 dígitos a <b className="text-white">{email}</b>. Vence en 10
                minutos.
              </p>

              {error && (
                <div role="alert" className="sr-auth-err flex items-center gap-2">
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
                </div>
              )}

              <div className="flex justify-center gap-2 py-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-14 text-center text-xl font-black text-white rounded-xl bg-white/10 border border-white/25 focus:border-[#E8DCCB] outline-none"
                    aria-label={`Dígito ${idx + 1}`}
                  />
                ))}
              </div>

              <button type="submit" disabled={loading} className="sr-auth-submit">
                {loading ? 'Verificando…' : 'Confirmar y entrar'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-center text-xs font-semibold text-white/70 hover:text-white"
              >
                ← Volver al formulario
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
