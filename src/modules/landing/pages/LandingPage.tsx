import { useEffect, useRef, useState } from 'react'
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
import MapaLanding from '@/modules/mapa/components/MapaLanding'
import { AuthModal, QuickTryOnModal } from '@/components/modals'
import { markLandingSeen } from '../landingSeen'
import './LandingPage.css'

export default function LandingPage() {
  const { user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // /?login abre el inicio de sesión (lo usan el botón «Iniciar sesión» del menú de la app y «Cerrar sesión»).
  const [params, setParams] = useSearchParams()
  const loginRequested = params.has('login')
  const [isAuthOpen, setIsAuthOpen] = useState(() => !user && loginRequested)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [authRole, setAuthRole] = useState<'BUYER' | 'STORE_ADMIN' | 'FOUNDATION_REPRESENTATIVE'>('BUYER')
  const [isTryOnOpen, setIsTryOnOpen] = useState(false)

  useEffect(() => {
    markLandingSeen()
  }, [])

  // Abrir solo cuando se pasa de / a /?login. No reabrir durante el cierre:
  // el cambio de URL y el cierre del modal pueden ocurrir en renders distintos.
  const previousLoginRequested = useRef(loginRequested)
  useEffect(() => {
    if (!user && loginRequested && !previousLoginRequested.current) {
      setAuthTab('login')
      setIsAuthOpen(true)
    }
    if (user && isAuthOpen) setIsAuthOpen(false)
    previousLoginRequested.current = loginRequested
  }, [loginRequested, user, isAuthOpen])

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

  const handleOpenRegister = (rol: 'BUYER' | 'STORE_ADMIN' | 'FOUNDATION_REPRESENTATIVE' = 'BUYER') => {
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

        {/* 7. Mapa interactivo de tiendas y fundaciones (Mapbox) */}
        <MapaLanding />
      </main>

      {/* Cierre editorial del landing */}
      <LandingFooter onOpenLogin={handleOpenLogin} />

      {/* Modal unificado de Autenticación (Login, Registro, OTP de 2 pasos y cuentas demo) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false)
          if (params.has('login')) setParams({}, { replace: true })
        }}
        initialTab={authTab}
        initialRole={authRole}
      />

      {/* Modal del Probador Virtual premium (Quick Try-On) */}
      <QuickTryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
      />
    </div>
  )
}
