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
      {!isLanding && env.useMocks && <MockBanner />}
      {!isLanding && env.appEnvironment === 'qa' && <EnvironmentBanner environment="qa" />}
      {!isLanding && <Navbar />}
      <main className="flex-1"><Outlet /></main>
      {!isLanding && <Footer />}
    </div>
  )
}
