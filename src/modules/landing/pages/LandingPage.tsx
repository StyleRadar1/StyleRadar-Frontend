import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import './LandingPage.css'

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // /?login abre el inicio de sesión (lo usan el botón «Iniciar sesión» del menú de la app y «Cerrar sesión»).
  const [params, setParams] = useSearchParams()
  const [isAuthOpen, setIsAuthOpen] = useState(() => params.has('login'))
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [isTryOnOpen, setIsTryOnOpen] = useState(false)

  useEffect(() => {
    if (params.has('login')) {
      setAuthTab('login')
      setIsAuthOpen(true)
    }
  }, [params])

  const handleOpenLogin = () => {
    setAuthTab('login')
    setIsAuthOpen(true)
  }

  const handleOpenRegister = () => {
    setAuthTab('register')
    setIsAuthOpen(true)
  }

  return (
    <div className="sr-landing relative min-h-screen bg-[#15121b] text-white selection:bg-[#48119a] selection:text-white">
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
        <VideoReels onOpenTryOn={() => setIsTryOnOpen(true)} />

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
      />

      {/* Modal del Probador Virtual premium (Quick Try-On) */}
      <QuickTryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
      />
    </div>
  )
}
