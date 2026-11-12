import { Link } from 'react-router-dom'

interface LandingFooterProps {
  onOpenLogin?: () => void
}

export function LandingFooter({ onOpenLogin }: LandingFooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer
      id="pe-pie"
      className="relative overflow-hidden py-24 px-6 md:px-16 bg-transparent text-[var(--sr-hero-text)] border-t border-[var(--sr-border-subtle)]"
      aria-labelledby="peFinalTitle"
    >
      {/* Imagen de fondo sutil integrada sin tapar la aurora */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <img
          src="/prototipo/assets/img/categorias/casual.jpg"
          alt=""
          loading="lazy"
          className="w-full h-full object-cover filter grayscale contrast-125"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-start gap-8">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs font-extrabold tracking-widest uppercase text-[var(--sr-accent)]">
            Explora sin límites · Bogotá
          </p>
          <h2
            id="peFinalTitle"
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] text-[var(--sr-hero-text)]"
          >
            Antes de salir a buscar, <br />
            <span className="text-[var(--sr-accent-text)]">mira qué hay.</span>
          </h2>
          <p className="text-base md:text-lg text-[var(--sr-hero-text-muted)] leading-relaxed">
            Entra para ver el catálogo, el mapa interactivo y el probador virtual. Puedes
            explorar las boutiques y marcas locales de Bogotá sin necesidad de crear una cuenta.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[var(--sr-accent)] hover:opacity-90 text-[var(--sr-text-on-accent)] font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-[var(--sr-accent)]/30 hover:translate-y-[-2px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <span>Entrar a StyleRadar</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
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

          {onOpenLogin ? (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-full border border-[var(--sr-border-subtle)] hover:border-[var(--sr-accent)] bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-raised)] text-[var(--sr-hero-text)] font-extrabold text-xs tracking-wider uppercase backdrop-blur-sm transition-all cursor-pointer"
            >
              Iniciar sesión
            </button>
          ) : (
            <Link
              to="/login"
              className="px-8 py-4 rounded-full border border-[var(--sr-border-subtle)] hover:border-[var(--sr-accent)] bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-raised)] text-[var(--sr-hero-text)] font-extrabold text-xs tracking-wider uppercase backdrop-blur-sm transition-all"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Barra inferior y volver arriba */}
        <div className="w-full pt-12 mt-8 border-t border-[var(--sr-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--sr-hero-text-muted)]">
          <p className="font-medium text-center sm:text-left">
            © 2026 StyleRadar · DOSW · Escuela Colombiana de Ingeniería Julio Garavito
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:text-[var(--sr-hero-text)] transition-colors cursor-pointer group"
          >
            <span className="font-bold uppercase tracking-wider text-[11px]">Volver arriba</span>
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 stroke-[2.5] group-hover:-translate-y-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  )
}

