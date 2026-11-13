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
      className="fixed inset-0 z-40 bg-[var(--color-bg-elevated,var(--sr-surface-raised))]/95 backdrop-blur-xl flex flex-col justify-between p-8 pt-28 xl:hidden transition-all text-[var(--color-text,#ffffff)]"
      id="landing-mobile-menu"
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
            className="text-left text-2xl font-black text-[var(--color-text)] hover:text-[var(--color-accent)] uppercase tracking-tight py-2 border-b border-[var(--color-border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-3 pt-6 border-t border-[var(--color-border)]">
        {onOpenLogin ? (
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenLogin()
            }}
            className="w-full py-4 text-center rounded-full border border-[var(--color-border)] text-[var(--color-text)] font-bold text-sm tracking-wider uppercase bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            Iniciar sesión
          </button>
        ) : (
          <Link
            to="/login"
            onClick={onClose}
            className="w-full py-4 text-center rounded-full border border-[var(--color-border)] text-[var(--color-text)] font-bold text-sm tracking-wider uppercase bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            Iniciar sesión
          </Link>
        )}

        <Link
          to="/catalogo"
          onClick={onClose}
          className="w-full py-4 text-center rounded-full bg-[var(--color-accent)] text-[var(--color-text-on-accent)] font-black text-sm tracking-wider uppercase shadow-lg shadow-[var(--color-accent)]/30 hover:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          Entrar a StyleRadar ↗
        </Link>
      </div>
    </div>
  )
}
