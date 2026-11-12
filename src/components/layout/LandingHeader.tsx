import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { navCapsules } from '@/data/landingData'
import { AppearancePicker } from '@/modules/core/theme'
import './LandingHeader.css'

interface LandingHeaderProps {
  onOpenLogin?: () => void
  onToggleMobileMenu?: () => void
  isMobileMenuOpen?: boolean
}

const sectionTargets: Record<string, string> = {
  categorias: 'categorias',
  videos: 'pe-videos',
  ciclo: 'ciclo',
  planes: 'planes',
  mapa: 'pe-mapa',
  'quienes-somos': 'pe-pie',
}

export function LandingHeader({
  onOpenLogin,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}: LandingHeaderProps) {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleScrollTo = (targetId: string) => {
    const element = document.getElementById(targetId)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header id="peHeader" className={`pe-header${isScrolled ? ' is-scrolled' : ''}`}>
      <div className="pe-header-left">
        <a
          href="#inicio"
          className="pe-brand"
          id="peBrandHome"
          aria-label="StyleRadar, volver al inicio"
          onClick={(event) => {
            event.preventDefault()
            handleScrollTo('inicio')
          }}
        >
          <svg className="pe-logo" viewBox="0 0 556 935" width="22" height="36" aria-hidden="true">
            <path className="srl-d" d="M237 6 L234 6 L209 23 L195 83 L193 85 L147 30 L108 40 L138 147 L58 233 L68 496 L68 544 L62 621 L86 629 L128 639 L160 643 L190 643 L225 636 L245 627 L264 614 L284 594 L298 576 L292 568 L192 477 L210 347 L210 329 L194 169Z" />
            <path className="srl-w" d="M410 646 L380 631 L347 610 L344 610 L321 639 L295 663 L274 677 L258 685 L225 696 L189 701 L147 700 L108 694 L54 680 L43 749 L97 767 L128 774 L163 779 L221 779 L264 771 L283 765 L310 753 L330 741 L351 725 L369 708 L389 684 L407 656Z" />
            <path className="srl-w" d="M549 696 L467 671 L452 699 L425 736 L396 766 L378 781 L345 803 L321 815 L286 828 L258 835 L202 841 L144 838 L75 824 L29 809 L20 845 L6 888 L43 905 L74 915 L117 924 L154 928 L214 928 L259 923 L303 914 L348 900 L403 875 L431 858 L467 830 L490 807 L507 786 L525 758 L541 724Z" />
          </svg>
          <span className="pe-brand-text">StyleRadar</span>
        </a>

        <nav className="pe-nav-capsules" aria-label="Secciones del landing">
          {navCapsules.map((item) => {
            const targetId = sectionTargets[item.targetId] ?? item.targetId
            return (
              <button
                key={item.targetId}
                type="button"
                className="pe-capsule-btn"
                data-scroll={`pe-${item.targetId}`}
                onClick={() => handleScrollTo(targetId)}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="pe-header-right">
        <AppearancePicker className="pe-tema" />

        <button
          type="button"
          className="pe-login-btn"
          id="portalLoginBtn"
          data-login
          onClick={onOpenLogin}
        >
          Iniciar sesión
        </button>

        <button
          type="button"
          className="pe-explore-btn"
          id="portalEnterBtn"
          data-enter
          onClick={() => navigate('/catalogo')}
        >
          <span>Entrar a StyleRadar</span>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>

        <button
          type="button"
          className="pe-mobile-menu-btn"
          id="peMobileToggle"
          aria-label="Menú de secciones"
          aria-expanded={isMobileMenuOpen}
          aria-controls="landing-mobile-menu"
          onClick={onToggleMobileMenu}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
