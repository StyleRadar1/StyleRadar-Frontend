import { Link } from 'react-router-dom'
import { navCapsules } from '@/data/landingData'

interface LandingMobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenLogin?: () => void
}

export function LandingMobileMenu({ isOpen, onClose, onOpenLogin }: LandingMobileMenuProps) {
  if (!isOpen) return null

  const handleScrollTo = (targetId: string) => {
    onClose()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-[#15121b]/95 backdrop-blur-xl flex flex-col justify-between p-8 pt-28 xl:hidden transition-all"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación móvil"
    >
      <nav className="flex flex-col gap-4">
        {navCapsules.map((item) => (
          <button
            key={item.targetId}
            type="button"
            onClick={() => handleScrollTo(item.targetId)}
            className="text-left text-2xl font-black text-white/90 hover:text-white uppercase tracking-tight py-2 border-b border-white/10 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-3 pt-6 border-t border-white/15">
        {onOpenLogin ? (
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenLogin()
            }}
            className="w-full py-4 text-center rounded-full border border-white/30 text-white font-bold text-sm tracking-wider uppercase bg-white/5"
          >
            Iniciar sesión
          </button>
        ) : (
          <Link
            to="/login"
            onClick={onClose}
            className="w-full py-4 text-center rounded-full border border-white/30 text-white font-bold text-sm tracking-wider uppercase bg-white/5"
          >
            Iniciar sesión
          </Link>
        )}

        <Link
          to="/catalogo"
          onClick={onClose}
          className="w-full py-4 text-center rounded-full bg-[#48119a] text-white font-black text-sm tracking-wider uppercase shadow-[0_8px_25px_#48119a77]"
        >
          Entrar a StyleRadar ↗
        </Link>
      </div>
    </div>
  )
}

