import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import { navCapsules } from '@/data/landingData'

interface LandingHeaderProps {
  onOpenLogin?: () => void
  onToggleMobileMenu?: () => void
  isMobileMenuOpen?: boolean
}

export function LandingHeader({
  onOpenLogin,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}: LandingHeaderProps) {
  const [theme, setTheme] = useState<'oscuro' | 'claro' | 'daltonico'>('oscuro')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleThemeChange = (newTheme: 'oscuro' | 'claro' | 'daltonico') => {
    setTheme(newTheme)
    document.documentElement.setAttribute('data-tema', newTheme)
  }

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 px-6 md:px-12 py-5 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#15121b]/85 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white font-extrabold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
          aria-label="StyleRadar, volver al inicio"
        >
          <Logo className="h-7 w-auto" />
          <span className="text-base tracking-wider">StyleRadar</span>
        </Link>

        {/* Cápsulas de navegación para desktop */}
        <nav
          className="hidden xl:flex items-center gap-2"
          aria-label="Secciones del landing"
        >
          {navCapsules.map((item) => (
            <a
              key={item.targetId}
              href={`#${item.targetId}`}
              onClick={(e) => handleScrollTo(e, item.targetId)}
              className="px-3.5 py-1.5 rounded-full border border-white/15 bg-[#161120]/30 backdrop-blur-sm text-[#f1e9df] text-[11px] font-semibold tracking-wider uppercase hover:border-white/40 hover:bg-white/10 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Selector de tema */}
        <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-full px-3 py-1.5 text-xs text-white/80">
          <svg
            className="w-4 h-4 text-white/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
          </svg>
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as 'oscuro' | 'claro' | 'daltonico')}
            className="bg-transparent text-white text-xs font-medium cursor-pointer focus:outline-none"
            aria-label="Tema de color"
          >
            <option value="oscuro" className="bg-[#1f1b26] text-white">Oscuro</option>
            <option value="claro" className="bg-[#1f1b26] text-white">Claro</option>
            <option value="daltonico" className="bg-[#1f1b26] text-white">Daltónico</option>
          </select>
        </div>

        {/* Acciones principales */}
        {onOpenLogin ? (
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-white hover:text-white/80 text-xs font-semibold px-3 py-2 transition-colors cursor-pointer"
          >
            Iniciar sesión
          </button>
        ) : (
          <Link
            to="/login"
            className="text-white hover:text-white/80 text-xs font-semibold px-3 py-2 transition-colors"
          >
            Iniciar sesión
          </Link>
        )}

        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 bg-[#48119a] hover:bg-[#5b17c2] text-white text-xs font-bold tracking-wider uppercase shadow-[0_4px_20px_#48119a66] hover:shadow-[0_6px_24px_#48119a99] transition-all"
        >
          <span>Entrar a StyleRadar</span>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </Link>

        {/* Botón hamburguesa móvil */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="xl:hidden flex flex-col justify-center items-center gap-1.5 w-10 h-10 rounded-full border border-white/20 bg-white/5 text-white cursor-pointer"
          aria-label="Menú de secciones"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`block h-0.5 w-5 bg-white transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-5 bg-white transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-white transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>
    </header>
  )
}

