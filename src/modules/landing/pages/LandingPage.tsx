import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { CustomCursor, NoiseGrain } from '@/components/ui'
import { LandingHeader, LandingMobileMenu, LandingFooter } from '@/components/layout'
import {
  Hero,
  ProblemSection,
  CategoriesGrid,
  VideoReels,
  ClothingCycle,
  PricingPlans,
} from '@/components/landing'
import { markLandingSeen } from '../landingSeen'
import './LandingPage.css'

const MapaLanding = lazy(() => import('@/modules/mapa/components/MapaLanding'))
const AuthModal = lazy(() => import('@/components/modals/AuthModal').then((m) => ({ default: m.AuthModal })))
const QuickTryOnModal = lazy(() => import('@/components/modals/QuickTryOnModal').then((m) => ({ default: m.QuickTryOnModal })))

function DeferredMapSection() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    if (shouldLoad) return
    const node = hostRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '450px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={hostRef} className="min-h-[420px]">
      {shouldLoad ? (
        <Suspense fallback={<div className="py-20 text-center text-sm text-[var(--sr-muted)]">Cargando mapa de tiendas…</div>}>
          <MapaLanding />
        </Suspense>
      ) : null}
    </div>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // /?login abre el inicio de sesión (lo usan el botón «Iniciar sesión» del menú de la app y «Cerrar sesión»).
  const [params, setParams] = useSearchParams()
  const loginRequested = params.has('login')
  const registerRequested = params.has('registro') || params.has('register')
  const requestedTab: 'login' | 'register' = registerRequested ? 'register' : 'login'
  const requestedRole: 'BUYER' | 'STORE_ADMIN' =
    (params.get('tipo') ?? params.get('rol'))?.toLowerCase() === 'tienda' ? 'STORE_ADMIN' : 'BUYER'
  const [isAuthOpen, setIsAuthOpen] = useState(() => !user && (loginRequested || registerRequested))
  const [authTab, setAuthTab] = useState<'login' | 'register'>(requestedTab)
  const [authRole, setAuthRole] = useState<'BUYER' | 'STORE_ADMIN'>(requestedRole)
  const [isTryOnOpen, setIsTryOnOpen] = useState(false)

  useEffect(() => {
    markLandingSeen()
  }, [])

  // Abrir solo cuando se pasa de / a /?login. No reabrir durante el cierre:
  // el cambio de URL y el cierre del modal pueden ocurrir en renders distintos.
  const authRequestKey = loginRequested ? 'login' : registerRequested ? `register:${requestedRole}` : ''
  const previousAuthRequestKey = useRef(authRequestKey)
  useEffect(() => {
    if (!user && authRequestKey && authRequestKey !== previousAuthRequestKey.current) {
      setAuthTab(requestedTab)
      setAuthRole(requestedRole)
      setIsAuthOpen(true)
    }
    if (user && isAuthOpen) setIsAuthOpen(false)
    previousAuthRequestKey.current = authRequestKey
  }, [authRequestKey, requestedTab, requestedRole, user, isAuthOpen])

  const handleOpenLogin = () => {
    if (user) return
    setAuthTab('login')
    setIsAuthOpen(true)
  }

  const handleOpenTryOn = () => {
    if (!user) {
      setAuthTab('login')
      setIsAuthOpen(true)
      return
    }
    setIsTryOnOpen(true)
  }

  const handleOpenRegister = (rol: 'BUYER' | 'STORE_ADMIN' = 'BUYER') => {
    if (user) return
    setAuthRole(rol)
    setAuthTab('register')
    setIsAuthOpen(true)
  }

  return (
    <div className="sr-landing relative min-h-screen bg-transparent text-[var(--sr-hero-text,#fff)] selection:bg-[#48119a] selection:text-white">
      {/* Efectos sensoriales: grano analógico y cursor interactivo */}
      <NoiseGrain />
      <CustomCursor />

      {/* Header fijo superior */}
      <LandingHeader
        onOpenLogin={handleOpenLogin}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Menú drawer desplegable para móvil */}
      <LandingMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenLogin={handleOpenLogin}
      />

      {/* Estructura modular de secciones del Landing */}
      <main>
        {/* 1. Hero interactivo con carrusel de diapositivas y CTA */}
        <Hero />

        {/* 2. Para quién es StyleRadar: personas, tiendas y fundaciones */}
        <ProblemSection />

        {/* 3. Categorías de estilo */}
        <CategoriesGrid />

        {/* 4. Videos de uso y acceso al probador virtual */}
        <VideoReels onOpenTryOn={handleOpenTryOn} isAuthenticated={Boolean(user)} />

        {/* 5. Ciclo de la ropa y economía circular */}
        <ClothingCycle />

        {/* 6. Planes de membresía */}
        <PricingPlans onOpenRegister={handleOpenRegister} />

        {/* 7. Mapa interactivo de tiendas y fundaciones (Mapbox, carga diferida al hacer scroll) */}
        <DeferredMapSection />
      </main>

      {/* Cierre editorial del landing */}
      <LandingFooter onOpenLogin={handleOpenLogin} />

      {/* Modal unificado de Autenticación (Login, Registro, OTP de 2 pasos y cuentas demo) */}
      {isAuthOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => {
              setIsAuthOpen(false)
              setParams({}, { replace: true })
            }}
            initialTab={authTab}
            initialRole={authRole}
          />
        </Suspense>
      )}

      {/* Modal del Probador Virtual premium (Quick Try-On) */}
      {isTryOnOpen && (
        <Suspense fallback={null}>
          <QuickTryOnModal
            isOpen={isTryOnOpen}
            onClose={() => setIsTryOnOpen(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
