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
      className="relative overflow-hidden py-24 px-6 md:px-16 bg-[#120f18] text-white border-t border-white/10"
      aria-labelledby="peFinalTitle"
    >
      {/* Imagen de fondo con gradiente oscurecedor */}
      <div className="absolute inset-0 z-0">
        <img
          src="/prototipo/assets/img/categorias/casual.jpg"
          alt=""
          loading="lazy"
          className="w-full h-full object-cover opacity-15 filter grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120f18] via-[#120f18]/85 to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-start gap-8">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs font-extrabold tracking-widest uppercase text-[#b9b9ca]">
            Explora sin límites · Bogotá
          </p>
          <h2
            id="peFinalTitle"
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]"
          >
            Antes de salir a buscar, <br />
            <span className="text-[#e8dccb]">mira qué hay.</span>
          </h2>
          <p className="text-base md:text-lg text-[#d1ced7] leading-relaxed">
            Entra para ver el catálogo, el mapa interactivo y el probador virtual. Puedes
            explorar las boutiques y marcas locales de Bogotá sin necesidad de crear una cuenta.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#48119a] hover:bg-[#5e18c8] text-white font-extrabold text-xs tracking-wider uppercase shadow-[0_8px_30px_#48119a77] hover:translate-y-[-2px] transition-all"
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
              className="px-8 py-4 rounded-full border border-white/30 hover:border-white/70 bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs tracking-wider uppercase backdrop-blur-sm transition-all cursor-pointer"
            >
              Iniciar sesión
            </button>
          ) : (
            <Link
              to="/login"
              className="px-8 py-4 rounded-full border border-white/30 hover:border-white/70 bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs tracking-wider uppercase backdrop-blur-sm transition-all"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Barra inferior y volver arriba */}
        <div className="w-full pt-12 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#b9b9ca]">
          <p className="font-medium text-center sm:text-left">
            © 2026 StyleRadar · DOSW · Escuela Colombiana de Ingeniería Julio Garavito
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
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

