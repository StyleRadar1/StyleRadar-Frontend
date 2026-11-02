import { Outlet } from 'react-router-dom'
import { Navbar } from '@/modules/core/components/Navbar'
import { Footer } from '@/modules/core/components/Footer'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}
