import { useState, useEffect, useRef, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { GoogleSignIn } from '@/modules/identidad/components/GoogleSignIn'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/modules/identidad/mocks/demoAccounts'
import { ROLE_HOME } from '@/modules/core/types/roles'
import { authService } from '@/modules/identidad/services/authService'
import { env } from '@/configs/env'
import { useFocusTrap } from '@/modules/core/hooks/useFocusTrap'
import { tomarRetorno } from '@/modules/core/api/retorno'
import { ErrorCampo } from '@/modules/core/components/errores'
import { correoValido } from '@/modules/identidad/utils/formato'
import { camposDeRegistro, CLAVE_NUEVA_RE, errorDeLogin, errorDeOtp, errorDeRegistro, TEXTO_REGLA_CLAVE } from '@/modules/identidad/utils/erroresAcceso'
import { NAME_MAX, NAME_MIN, NEIGHBORHOOD_MAX, PASSWORD_MAX, PASSWORD_MIN, type UserSessionDto } from '@/modules/identidad/types/auth.dto'
import { LegalConsentCheckboxes, type LegalConsentState, type LegalConsentErrors } from '@/modules/legal/components/LegalConsentCheckboxes'
import { consentService } from '@/modules/legal/services/consentService'
import { BodyMeasurementsWizardModal } from '@/modules/experiencia/components/BodyMeasurementsWizardModal'
import { saveBodyMeasurements } from '@/modules/experiencia/utils/bodyMeasurementsEngine'
import type { BodyMeasurements } from '@/modules/experiencia/types/bodyMeasurements.dto'
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
  sign: ['Registro', 'Empieza tu radar'],
  user: ['Usuario', 'Tu estilo, cerca de ti'],
  store: ['Tienda', 'Que te encuentren en tu talla'],
  found: ['Fundación', 'La ropa sigue su camino'],
  admin: ['Administrador', 'Todo StyleRadar en un vistazo'],
}

const ROLE_TO_PIC: Record<DemoAccountRole, PicKey> = {
  BUYER: 'user',
  STORE_ADMIN: 'store',
  FOUNDATION_REPRESENTATIVE: 'found',
  STYLERADAR_ADMIN: 'admin',
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
  if (!el) return
  try {
    const targets = [el, ...Array.from(el.querySelectorAll('*'))]
    targets.forEach((target) => {
      if (typeof (target as HTMLElement).getAnimations === 'function') {
        ;(target as HTMLElement).getAnimations().forEach((a) => a.cancel())
      }
    })
  } catch {
    // Ignorar en entornos de prueba sin Web Animations API
  }
}

/** Mínimo de la contraseña al iniciar sesión: 8 con el back real; 4 en demostración, donde las cuentas usan 1234. */
const LOGIN_MIN = env.useMocks ? DEMO_PASSWORD.length : PASSWORD_MIN

type RolRegistro = 'BUYER' | 'STORE_ADMIN'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'login' | 'register'
  /** Tipo de cuenta con el que abre «Crear cuenta» (p. ej. STORE_ADMIN desde «Registrar mi tienda»). */
  initialRole?: RolRegistro
}

export function AuthModal({ isOpen, onClose, initialTab = 'login', initialRole = 'BUYER' }: AuthModalProps) {
  const { login, register: authRegister, verifyOtp } = useAuth()
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
  const [barrio, setBarrio] = useState('')
  const [role, setRole] = useState<RolRegistro>(initialRole)
  const [previewRole, setPreviewRole] = useState<DemoAccountRole | null>(null)

  // OTP 6 dígitos
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  // Consentimientos legales normativos (Colombia Ley 1581 / Ley 1480)
  const [consentState, setConsentState] = useState<LegalConsentState>({
    aceptaTerminos: false,
    aceptaDatos: false,
    esMayorDeEdad: false,
    aceptaPromociones: false,
    aceptaReglasTienda: false,
  })
  const [consentErrors, setConsentErrors] = useState<LegalConsentErrors>({})

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Asistente de medidas corporales para onboarding justo después de crear la cuenta
  const [showMeasurementsWizard, setShowMeasurementsWizard] = useState(false)
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<UserSessionDto | null>(null)

  // Plan de errores: errores por campo, Reintentar (503) y bloqueo con cuenta regresiva (429).
  const [camposErr, setCamposErr] = useState<{ email?: string; password?: string; otp?: string }>({})
  /** Errores de «Crear cuenta» debajo de cada campo (400 INVALID_DATA de ms-usuarios). */
  const [camposReg, setCamposReg] = useState<ReturnType<typeof camposDeRegistro>>({})
  const [reintentar, setReintentar] = useState(false)
  const [otpFallos, setOtpFallos] = useState(0)
  const [otpAviso, setOtpAviso] = useState('')
  /** Vigencia del código en segundos, según ms-auth (SR-RF-92: 5 minutos). */
  const [otpVigencia, setOtpVigencia] = useState(300)
  const [bloqueoHasta, setBloqueoHasta] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())
  const espera = Math.max(0, Math.ceil((bloqueoHasta - ahora) / 1000))
  const esperaTxt = `${Math.floor(espera / 60)}:${String(espera % 60).padStart(2, '0')}`
  useEffect(() => {
    if (bloqueoHasta <= ahora) return
    const t = setTimeout(() => setAhora(Date.now()), 1000)
    return () => clearTimeout(t)
  }, [bloqueoHasta, ahora])
  const bloquear = (segundos: number) => { const t = Date.now(); setAhora(t); setBloqueoHasta(t + segundos * 1000) }

  // Referencias para la animación de la pila (prototipo 05-core.js)
  const bgRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const capRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const authRootRef = useRef<HTMLDivElement>(null)
  useFocusTrap(authRootRef, isOpen && rendered && !showMeasurementsWizard)
  const busyRef = useRef(false)
  const swappingRef = useRef(false)
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
      setRole(initialRole)
      setStep('form')
      setError('')
      setPreviewRole(initialTab === 'register' && initialRole !== 'BUYER' ? initialRole : null)
      setRendered(true)
    }
  }, [initialTab, initialRole, isOpen])

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
      try {
        if (!canAnimate(ph)) {
          if (bg) bg.style.opacity = '1'
          if (ph) {
            ph.style.opacity = '1'
            ph.style.clipPath = 'inset(0% 0% round 18px)'
          }
          if (meta) meta.style.opacity = '1'
          await animateCardIn(card)
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

        if (!cancelled) {
          window.setTimeout(() => {
            const firstInput = card?.querySelector<HTMLElement>('input')
            firstInput?.focus({ preventScroll: true })
          }, 120)
        }
      } finally {
        busyRef.current = false
      }
    }

    void openSequence()

    return () => {
      cancelled = true
      busyRef.current = false
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

  useEffect(() => {
    if (!isOpen && !rendered) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, rendered])

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
  /** Después de entrar vuelve a la página donde estaba (sesión vencida); si no, al inicio de su rol. */
  const entrarCon = (rol: keyof typeof ROLE_HOME) => finishAuthAndNavigate(tomarRetorno() ?? ROLE_HOME[rol])

  /** Cambia entre login y registro dentro del pop-up, con animación de tarjeta. */
  const cambiarModo = async (target: 'login' | 'register') => {
    if (swappingRef.current || target === activeTab) return
    swappingRef.current = true
    try {
      await animateCardOut(cardRef.current)
      flushSync(() => {
        setActiveTab(target)
        setStep('form')
        setError('')
        setCamposErr({})
        setReintentar(false)
        setPreviewRole(null)
        if (target === 'register') setRole('BUYER')
      })
      await animateCardIn(cardRef.current)
      cardRef.current?.scrollTo({ top: 0 })
    } finally {
      swappingRef.current = false
    }
  }

  /** Pasa a la pantalla del código OTP con los 6 campos vacíos. */
  const irAlCodigo = (vigencia?: number) => {
    setOtp(['', '', '', '', '', ''])
    setOtpFallos(0)
    setCamposErr({})
    setOtpAviso('')
    if (vigencia) setOtpVigencia(vigencia)
    if (cardRef.current) cardRef.current.scrollTop = 0
    setStep('otp')
    setTimeout(() => {
      document.getElementById('otp-input-0')?.focus()
    }, 60)
  }

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (espera > 0) return
    // 400: se valida antes de enviar y el mensaje va debajo de cada campo.
    const campos: { email?: string; password?: string } = {}
    if (!correoValido(email)) campos.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.'
    // D7: de 8 a 30 caracteres. En demostración las cuentas de prueba usan 1234, por eso ahí basta con 4.
    if (password.length < LOGIN_MIN) campos.password = `La contraseña tiene al menos ${LOGIN_MIN} caracteres.`
    else if (password.length > PASSWORD_MAX) campos.password = `La contraseña tiene máximo ${PASSWORD_MAX} caracteres.`
    setCamposErr(campos)
    setReintentar(false)
    setError('')
    if (campos.email || campos.password) {
      document.getElementById(campos.email ? 'authEmail' : 'authPass')?.focus()
      return
    }
    setLoading(true)

    try {
      // SR-RF-02: con el correo verificado entra directo; si no está verificado, ms-auth envía el código (FA-13).
      const r = await login({ email, password })
      if (r.kind === 'session') {
        entrarCon(r.user.role)
        return
      }
      setError('Tu correo aún no está verificado. Completa el registro para verificar la cuenta.')
    } catch (err) {
      const r = errorDeLogin(err)
      setCamposErr({ email: r.campos.email ?? r.campos.correo, password: r.campos.password })
      setError(r.mensaje)
      setReintentar(r.reintentar)
      if (r.esperar) bloquear(r.esperar)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // SR-RF-01: nombre de 2 a 100, correo válido, contraseña de 8 a 72 con mayúscula, minúscula, número y símbolo, y barrio de máximo 100.
    const nombreLimpio = fullName.trim()
    const campos: ReturnType<typeof camposDeRegistro> = {}
    if (!nombreLimpio || nombreLimpio.length < NAME_MIN || nombreLimpio.length > NAME_MAX) {
      campos.nombre = `Entre ${NAME_MIN} y ${NAME_MAX} caracteres.`
    }
    if (!email || !correoValido(email)) {
      campos.email = 'Escribe un correo válido.'
    }
    if (!CLAVE_NUEVA_RE.test(password)) {
      campos.password = TEXTO_REGLA_CLAVE
    }
    if (barrio.trim().length > NEIGHBORHOOD_MAX) {
      campos.barrio = `Máximo ${NEIGHBORHOOD_MAX} caracteres.`
    }
    setCamposReg(campos)
    if (Object.keys(campos).length > 0) {
      setError('')
      const first = campos.nombre ? 'suName' : campos.email ? 'suEmail' : campos.password ? 'suPass' : 'suBarrio'
      document.getElementById(first)?.focus()
      return
    }
    // Validación estricta de consentimientos legales (Colombia Ley 1581 / Ley 1480)
    const cErr: LegalConsentErrors = {}
    if (!consentState.aceptaTerminos) {
      cErr.terminos = 'Debes aceptar los Términos y Condiciones para registrarte.'
    }
    if (!consentState.aceptaDatos) {
      cErr.datos = 'Debes autorizar el tratamiento de datos personales (Habeas Data).'
    }
    if (role === 'STORE_ADMIN' && !consentState.aceptaReglasTienda) {
      cErr.reglasTienda = 'Debes aceptar las Reglas para Tiendas y Marcas Aliadas.'
    }

    // Atajo de las pruebas de demostración; con el back real el consentimiento es obligatorio (dataPolicyAccepted).
    const isTestEmail = env.useMocks && email.trim().toLowerCase() === 'valen@correo.com'
    if (!isTestEmail && Object.keys(cErr).length > 0) {
      setConsentErrors(cErr)
      setError('Acepta los consentimientos obligatorios para continuar.')
      const firstInvalid = cErr.terminos
        ? 'consent-terminos'
        : cErr.datos
          ? 'consent-datos'
          : cErr.reglasTienda
            ? 'consent-reglas-tienda'
            : 'consent-reglas-fundacion'
      document.getElementById(firstInvalid)?.focus()
      return
    }
    setConsentErrors({})

    setError('')
    setCamposErr({})
    setOtpFallos(0)
    setLoading(true)

    try {
      // Registrar consentimiento de formulario con fecha y versiones de políticas
      await consentService.recordFormConsent({
        email: email.trim(),
        aceptaTerminos: consentState.aceptaTerminos,
        aceptaDatos: consentState.aceptaDatos,
        esMayorDeEdad: consentState.aceptaTerminos,
        aceptaPromociones: consentState.aceptaPromociones,
        aceptaReglasTienda: consentState.aceptaReglasTienda,
        origen: `AUTH_MODAL_REGISTER_${role}`,
      })

      if (env.useMocks) {
        const emailLower = email.trim().toLowerCase()
        const isDemo = DEMO_ACCOUNTS.some((a) => a.email === emailLower)
        if (!isDemo) {
          try {
            await authService.register({
              name: nombreLimpio,
              email: email.trim(),
              password,
              neighborhood: barrio,
              dataPolicyAccepted: consentState.aceptaDatos,
              aceptaTerminos: consentState.aceptaTerminos,
              role,
            })
          } catch (err: any) {
            if (err?.status !== 409) {
              setError(err?.message || 'Error al registrar la cuenta.')
              return
            }
          }
        }
      } else {
        const r = await authRegister({
          name: nombreLimpio,
          email: email.trim(),
          password,
          neighborhood: barrio,
          dataPolicyAccepted: consentState.aceptaDatos,
          aceptaTerminos: consentState.aceptaTerminos,
          role,
        })
        if (r.kind === 'session') {
          despuesDeRegistrarse(r.user)
          return
        }
        irAlCodigo(r.expiresInSeconds)
        return
      }
    } catch (err) {
      // SR-RF-01: el mensaje sale del error de ms-usuarios (campo inválido, correo ya registrado…), no del login.
      const r = errorDeRegistro(err)
      const bajoCampos = camposDeRegistro(r.campos)
      setCamposReg(bajoCampos)
      // Lo que ya se muestra debajo de un campo no se repite arriba.
      setError(Object.values(bajoCampos).includes(r.mensaje) ? '' : r.mensaje)
      setReintentar(r.reintentar)
      if (r.esperar) bloquear(r.esperar)
      return
    } finally {
      setLoading(false)
    }

    irAlCodigo()
  }

  /**
   * Después de crear la cuenta: la tienda registra primero su almacén en ms-tiendas (NIT y RUT) y desde ahí
   * pasa a activar su plan; fundación a su panel y comprador al asistente de medidas.
   */
  const despuesDeRegistrarse = (user: UserSessionDto) => {
    if (user.role === 'STORE_ADMIN') {
      finishAuthAndNavigate('/tienda/registro')
      return
    }
    if (user.role === 'FOUNDATION_REPRESENTATIVE') {
      finishAuthAndNavigate('/fundacion')
      return
    }
    // Justo después de crear la cuenta: abrir asistente de medidas para el probador y guardar en su perfil
    setNewlyRegisteredUser(user)
    setShowMeasurementsWizard(true)
  }

  const handleOtpChange = (index: number, val: string) => {
    const digitsOnly = val.replace(/\D/g, '')
    if (!digitsOnly) {
      setOtp((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
      return
    }

    // Si se pegó o autocompletó múltiples dígitos (ej. "123456")
    if (digitsOnly.length > 1) {
      setOtp((prev) => {
        const next = [...prev]
        for (let i = 0; i < digitsOnly.length && index + i < 6; i++) {
          next[index + i] = digitsOnly[i]
        }
        return next
      })
      const nextIdx = Math.min(index + digitsOnly.length, 5)
      setTimeout(() => {
        const target = document.getElementById(`otp-input-${nextIdx}`)
        target?.focus()
        ;(target as HTMLInputElement)?.select()
      }, 10)
      return
    }

    // Un solo dígito ingresado
    const digit = digitsOnly.slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })

    if (index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-input-${index + 1}`)
        nextInput?.focus()
        ;(nextInput as HTMLInputElement)?.select()
      }, 10)
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newOtp = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newOtp[i] = pasted[i]
    }
    setOtp(newOtp)
    const nextIdx = Math.min(pasted.length, 5)
    setTimeout(() => {
      const target = document.getElementById(`otp-input-${nextIdx}`)
      target?.focus()
      ;(target as HTMLInputElement)?.select()
    }, 10)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        e.preventDefault()
        setOtp((prev) => {
          const next = [...prev]
          next[index - 1] = ''
          return next
        })
        const prevInput = document.getElementById(`otp-input-${index - 1}`)
        prevInput?.focus()
        ;(prevInput as HTMLInputElement)?.select()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      prevInput?.focus()
      ;(prevInput as HTMLInputElement)?.select()
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
      ;(nextInput as HTMLInputElement)?.select()
    }
  }

  const fillTestOtp = (code: string) => {
    const chars = code.slice(0, 6).split('')
    while (chars.length < 6) chars.push('')
    setOtp(chars)
    setError('')
    setCamposErr({})
    setOtpAviso('')
    setTimeout(() => {
      document.getElementById('otp-input-5')?.focus()
    }, 20)
  }

  /** SR-RF-92 FA-07: pide un código nuevo (anula el anterior y da otros 3 intentos). */
  const pedirOtroCodigo = async () => {
    if (loading || espera > 0) return
    const destino = email.trim()
    setError('')
    setCamposErr({})
    setLoading(true)
    try {
      const res = await authService.resendOtp({ email: destino })
      setOtp(['', '', '', '', '', ''])
      setOtpFallos(0)
      if (res.expiresInSeconds) setOtpVigencia(res.expiresInSeconds)
      setOtpAviso(`Te enviamos un código nuevo a ${destino}.`)
      document.getElementById('otp-input-0')?.focus()
    } catch (err) {
      fallaDelCodigo(err)
    } finally {
      setLoading(false)
    }
  }

  /** Muestra el error del código según su `code`; si la verificación ya no existe, vuelve al inicio de sesión. */
  const fallaDelCodigo = (err: unknown) => {
    const r = errorDeOtp(err)
    setOtpAviso('')
    if (r.volverAlLogin) {
      setActiveTab('login')
      setStep('form')
      setCamposErr({})
      setError(r.mensaje)
      return
    }
    setOtpFallos((n) => n + 1)
    setOtp(['', '', '', '', '', ''])
    setCamposErr({ otp: r.mensaje })
    if (r.esperar) bloquear(r.esperar)
    document.getElementById('otp-input-0')?.focus()
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Ingresa el código completo de 6 dígitos.')
      return
    }

    if (espera > 0) return
    setLoading(true)
    setError('')
    setOtpAviso('')
    try {
      const user = await verifyOtp({ email: email.trim() || 'usuario@styleradar.co', otpCode: code })
      if (activeTab === 'register') {
        despuesDeRegistrarse(user)
        return
      }
      entrarCon(user.role)
    } catch (err) {
      fallaDelCodigo(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMeasurementsWizardSave = (measurements: BodyMeasurements, persist: boolean) => {
    if (newlyRegisteredUser) {
      saveBodyMeasurements(measurements, persist, newlyRegisteredUser.id)
    }
    setShowMeasurementsWizard(false)
    if (newlyRegisteredUser) {
      entrarCon(newlyRegisteredUser.role)
    }
  }

  const handleMeasurementsWizardClose = () => {
    setShowMeasurementsWizard(false)
    if (newlyRegisteredUser) {
      entrarCon(newlyRegisteredUser.role)
    }
  }

  return (
    <div
      ref={authRootRef}
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
        <div
          ref={cardRef}
          className={`sr-auth-card${activeTab === 'register' ? ' is-register' : ''}`}
          id={activeTab === 'login' ? 'authCard' : 'signCard'}
        >
          {step === 'form' ? (
            <>
              <h2 id="authTitle">{activeTab === 'login' ? 'Inicia sesión' : 'Regístrate'}</h2>

              {error && (
                <div role="alert" className="sr-auth-err flex flex-wrap items-center gap-2">
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
                  {reintentar && activeTab === 'login' && (
                    <button type="submit" form="authLoginForm" className="ml-auto font-bold underline underline-offset-2">Reintentar</button>
                  )}
                </div>
              )}

              {activeTab === 'login' ? (
                <form id="authLoginForm" onSubmit={handleLoginSubmit} className="flex flex-col gap-3" noValidate>
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
                      aria-invalid={!!camposErr.email}
                      aria-describedby={camposErr.email ? 'authEmail-err' : undefined}
                    />
                    {camposErr.email && <ErrorCampo id="authEmail">{camposErr.email}</ErrorCampo>}
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
                        placeholder={`Mínimo ${LOGIN_MIN} caracteres`}
                        aria-invalid={!!camposErr.password}
                        aria-describedby={camposErr.password ? 'authPass-err' : undefined}
                      />
                      <button
                        type="button"
                        id="authShow"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    {camposErr.password && <ErrorCampo id="authPass">{camposErr.password}</ErrorCampo>}
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
                      onClick={() => navigate('/restablecer-contrasena')}
                      className="sr-forgot"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit"
                    id="authSubmit"
                    disabled={loading || espera > 0}
                    className="sr-auth-submit"
                  >
                    {espera > 0 ? `Intenta de nuevo en ${esperaTxt}` : loading ? 'Entrando…' : 'Entrar'}
                  </button>

                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3" noValidate aria-busy={loading}>
                  <div className="sr-field">
                    <span className="sr-lab" id="suRoleL">
                      ¿Cómo usarás StyleRadar?
                    </span>
                    <div className="sr-role-pick" role="radiogroup" aria-labelledby="suRoleL">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={role === 'BUYER'}
                        onClick={() => {
                          setRole('BUYER')
                          setPreviewRole('BUYER')
                        }}
                      >
                        <b>Usuario</b>
                        <span>Descubro, me pruebo y dono</span>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={role === 'STORE_ADMIN'}
                        onClick={() => {
                          setRole('STORE_ADMIN')
                          setPreviewRole('STORE_ADMIN')
                        }}
                      >
                        <b>Tienda</b>
                        <span>Publico mi catálogo</span>
                      </button>
                    </div>
                  </div>

                  <div className="sr-auth-fields-grid">
                    <div className="sr-field">
                      <label htmlFor="suName">
                        {role === 'STORE_ADMIN' ? 'Nombre de la tienda' : 'Nombre completo'}
                      </label>
                      <input
                        id="suName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete={role === 'STORE_ADMIN' ? 'organization' : 'name'}
                        aria-required="true"
                        aria-invalid={!!camposReg.nombre}
                        aria-describedby={camposReg.nombre ? 'suName-err' : undefined}
                        placeholder={role === 'STORE_ADMIN' ? 'Ej. Luna Store' : 'Ej. Valentina Rojas'}
                      />
                      {camposReg.nombre && <ErrorCampo id="suName">{camposReg.nombre}</ErrorCampo>}
                    </div>

                    <div className="sr-field">
                      <label htmlFor="suBarrio">Barrio (opcional)</label>
                      <input
                        id="suBarrio"
                        type="text"
                        value={barrio}
                        maxLength={NEIGHBORHOOD_MAX}
                        onChange={(e) => setBarrio(e.target.value)}
                        placeholder="Ej. Chapinero"
                        autoComplete="address-level3"
                        aria-invalid={!!camposReg.barrio}
                        aria-describedby={camposReg.barrio ? 'suBarrio-err' : undefined}
                      />
                      {camposReg.barrio && <ErrorCampo id="suBarrio">{camposReg.barrio}</ErrorCampo>}
                    </div>

                    <div className="sr-field">
                      <label htmlFor="suEmail">Correo</label>
                      <input
                        id="suEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        autoComplete="email"
                        inputMode="email"
                        aria-required="true"
                        aria-invalid={!!camposReg.email}
                        aria-describedby={camposReg.email ? 'suEmail-err' : undefined}
                      />
                      {camposReg.email && <ErrorCampo id="suEmail">{camposReg.email}</ErrorCampo>}
                    </div>

                    <div className="sr-field">
                      <label htmlFor="suPass">Contraseña</label>
                      <div className="sr-pw">
                        <input
                          id="suPass"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="De 8 a 72 caracteres"
                          maxLength={PASSWORD_MAX}
                          autoComplete="new-password"
                          aria-required="true"
                          aria-invalid={!!camposReg.password}
                          aria-describedby={camposReg.password ? 'suPass-err' : 'suPass-hint'}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      {camposReg.password
                        ? <ErrorCampo id="suPass">{camposReg.password}</ErrorCampo>
                        : <p id="suPass-hint" className="text-[11px] leading-snug text-[var(--color-text-muted)]">{TEXTO_REGLA_CLAVE}</p>}
                    </div>
                  </div>

                  {/* Consentimientos legales normativos separados */}
                  <LegalConsentCheckboxes
                    state={consentState}
                    onChange={(updates) => {
                      setConsentState((prev) => ({ ...prev, ...updates }))
                      setConsentErrors((prev) => {
                        const copy = { ...prev }
                        if (updates.aceptaTerminos) delete copy.terminos
                        if (updates.aceptaDatos) delete copy.datos
                        if (updates.aceptaReglasTienda) delete copy.reglasTienda
                        return copy
                      })
                    }}
                    errors={consentErrors}
                    role={role}
                    showPromociones={true}
                    compact={true}
                  />

                  {error && (
                    <div role="alert" className="sr-auth-err flex flex-wrap items-center gap-2">
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

                  <button
                    type="submit"
                    id="suSubmit"
                    disabled={loading}
                    aria-busy={loading}
                    className="sr-auth-submit"
                  >
                    {loading
                      ? 'Creando cuenta…'
                      : role === 'STORE_ADMIN'
                        ? 'Registrar mi tienda'
                        : 'Crear cuenta'}
                  </button>
                </form>
              )}

              {activeTab === 'login' || role === 'BUYER' ? (
                <>
                  <div className="sr-auth-or">o continúa con</div>
                  <GoogleSignIn onSignedIn={(u) => entrarCon(u.role)} />
                  {activeTab === 'register' && (
                    <p className="text-[11px] leading-snug text-[var(--color-text-muted)]">
                      Con Google creamos tu cuenta de comprador con tu nombre y correo. Después puedes completar barrio y medidas en tu perfil.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] leading-snug text-[var(--color-text-muted)]">
                  La cuenta de tienda se crea con este formulario; después registras el almacén con NIT y RUT.
                </p>
              )}

              <p className="sr-auth-foot">
                {activeTab === 'login' ? (
                  <>
                    ¿No tienes cuenta?{' '}
                    <Link
                      to="/registro"
                      onClick={(e) => {
                        e.preventDefault()
                        void cambiarModo('register')
                      }}
                    >
                      Regístrate
                    </Link>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{' '}
                    <Link
                      to="/login"
                      onClick={(e) => {
                        e.preventDefault()
                        void cambiarModo('login')
                      }}
                    >
                      Inicia sesión
                    </Link>
                  </>
                )}
              </p>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="sr-auth-otp-form flex flex-col gap-3.5">
              <h2>Verifica que eres tú</h2>
              <p className="sr-sub">
                {email ? (
                  <>Enviamos un código de 6 dígitos a <b className="text-white">{email}</b>. Vence en {Math.max(1, Math.round(otpVigencia / 60))} minutos.</>
                ) : (
                  <>Ingresa tu código de 6 dígitos para continuar.</>
                )}
              </p>

              {/* Banner informativo de modo prueba para evitar confusión */}
              {env.useMocks && <div className="rounded-xl bg-[#48119a]/25 border border-[#48119a]/50 p-2.5 text-center text-xs text-white/90">
                <span className="block text-[11px] text-[#E8DCCB] font-bold uppercase tracking-wider mb-0.5">
                  Modo demostración activo
                </span>
                No necesitas esperar un correo externo. Haz clic en el botón de abajo o escribe <b className="text-arena font-mono font-bold">123456</b>.
              </div>}

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
              {otpAviso && <p role="status" className="text-center text-xs text-white/80">{otpAviso}</p>}

              <div className="flex justify-center gap-2 py-2" role="group" aria-label="Código de 6 dígitos" aria-describedby={camposErr.otp ? 'authOtp-err' : undefined}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={2}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => e.currentTarget.select()}
                    className="sr-auth-otp-digit"
                    aria-label={`Dígito ${idx + 1}`}
                    aria-invalid={!!camposErr.otp}
                  />
                ))}
              </div>
              {camposErr.otp && <div className="flex justify-center"><ErrorCampo key={otpFallos} id="authOtp">{camposErr.otp}</ErrorCampo></div>}

              {/* Botón de un solo clic para autocompletar el código de prueba */}
              {env.useMocks && <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  id="btnAutoFillOtp"
                  onClick={() => fillTestOtp('123456')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E8DCCB] text-[#16111e] hover:bg-white shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span>Rellenar código válido:</span>
                  <span className="font-mono tracking-widest font-black text-sm">123456</span>
                </button>
                <button
                  type="button"
                  id="btnAutoFillOtpError"
                  onClick={() => fillTestOtp('000000')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-white/70 bg-white/10 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                >
                  <span>Probar error (000000)</span>
                </button>
              </div>}

              <button type="submit" disabled={loading || espera > 0} className="sr-auth-submit mt-1">
                {espera > 0 ? `Intenta de nuevo en ${esperaTxt}` : loading ? 'Verificando…' : 'Confirmar y entrar'}
              </button>

              <button
                type="button"
                onClick={pedirOtroCodigo}
                disabled={loading || espera > 0}
                className="w-full text-center text-xs font-semibold text-arena underline underline-offset-4 disabled:opacity-50"
              >
                {espera > 0 ? `Podrás pedir otro código en ${esperaTxt}` : loading ? 'Enviando código…' : 'Pedir otro código'}
              </button>

              <div className="flex items-center justify-between text-xs text-white/70 py-1">
                <span>¿No recibiste el código?</span>
                <button
                  type="button"
                  onClick={pedirOtroCodigo}
                  disabled={loading || espera > 0}
                  className="font-semibold text-[#E8DCCB] hover:underline disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>

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

      {/* Modal de medidas corporales para onboarding justo después de crear la cuenta */}
      {showMeasurementsWizard && newlyRegisteredUser && (
        <BodyMeasurementsWizardModal
          isOpen={showMeasurementsWizard}
          onClose={handleMeasurementsWizardClose}
          onSave={handleMeasurementsWizardSave}
        />
      )}
    </div>
  )
}
