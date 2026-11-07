import { Outlet } from 'react-router-dom'
import { Navbar } from '@/modules/core/components/Navbar'
import { Footer } from '@/modules/core/components/Footer'
import { EnvBadge, MockBanner } from '@/modules/core/components/Status'
import { env } from '@/configs/env'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {env.useMocks && <MockBanner />}
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <EnvBadge />
    </div>
  )
}
