import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@/modules/core/components/Navbar'
import { Footer } from '@/modules/core/components/Footer'
import { EnvironmentBanner, MockBanner } from '@/modules/core/components/Status'
import { env } from '@/configs/env'

export function AppLayout() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-violeta focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      {!isLanding && env.useMocks && <MockBanner />}
      {!isLanding && env.appEnvironment === 'qa' && <EnvironmentBanner environment="qa" />}
      {!isLanding && <Navbar />}
      <main id="main-content" className="flex-1"><Outlet /></main>
      {!isLanding && <Footer />}
    </div>
  )
}
