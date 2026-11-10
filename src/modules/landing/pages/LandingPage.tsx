import { useState } from 'react'
import { CustomCursor, NoiseGrain } from '@/components/ui'
import { LandingHeader, LandingMobileMenu, LandingFooter } from '@/components/layout'
import {
  Hero,
  ProblemSection,
  CategoriesGrid,
  VideoReels,
  ClothingCycle,
  PricingPlans,
  MapPreview,
} from '@/components/landing'
import { AuthModal, QuickTryOnModal } from '@/components/modals'
import './LandingPage.css'

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [isTryOnOpen, setIsTryOnOpen] = useState(false)

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

        {/* 2. Problemática urbana en Bogotá */}
        <ProblemSection />

        {/* 3. Categorías de estilo */}
        <CategoriesGrid />

        {/* 4. Video reels / Módulos interactivos en video */}
        <VideoReels />

        {/* 5. Ciclo de la ropa y economía circular */}
        <ClothingCycle />

        {/* 6. Planes de membresía */}
        <PricingPlans onOpenRegister={handleOpenRegister} />

        {/* 7. Mapa de boutiques de Bogotá */}
        <MapPreview />
      </main>

      {/* Cierre editorial del landing */}
      <LandingFooter onOpenLogin={handleOpenLogin} />

      {/* Modal unificado de Autenticación (Login, Registro, OTP de 2 pasos y cuentas demo) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
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
