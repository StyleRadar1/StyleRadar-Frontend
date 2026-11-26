import { Link } from 'react-router-dom'
import { PROVIDER_INFO } from '@/modules/legal/config/legalConfig'

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

        {/* Sección de cumplimiento legal, protección al consumidor y pie de página completo */}
        <div className="w-full pt-10 border-t border-[var(--sr-border-subtle)]/70">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs text-[var(--sr-hero-text-muted)]">
            <div className="space-y-2">
              <p className="font-bold uppercase tracking-wider text-[var(--sr-hero-text)] text-[11px]">
                Marco Legal
              </p>
              <ul className="space-y-1.5">
                <li><Link to="/legal/terminos" className="hover:text-[var(--sr-accent)] transition-colors">Términos y Condiciones</Link></li>
                <li><Link to="/legal/datos-personales" className="hover:text-[var(--sr-accent)] transition-colors">Política de Datos (Habeas Data)</Link></li>
                <li><Link to="/legal/aviso-privacidad" className="hover:text-[var(--sr-accent)] transition-colors">Aviso de Privacidad</Link></li>
                <li><Link to="/legal/cookies" className="hover:text-[var(--sr-accent)] transition-colors">Política de Cookies</Link></li>
                <li><Link to="/legal/pagos-seguridad" className="hover:text-[var(--sr-accent)] transition-colors">Medios de Pago y Seguridad</Link></li>
                <li><Link to="/legal" className="font-semibold text-[var(--sr-accent)] hover:underline">Mapa Legal Completo →</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold uppercase tracking-wider text-[var(--sr-hero-text)] text-[11px]">
                Ayuda & Consumidor
              </p>
              <ul className="space-y-1.5">
                <li><Link to="/legal/pqrs" className="font-semibold text-[var(--sr-hero-text)] hover:text-[var(--sr-accent)] transition-colors">Radicar PQRS Oficial</Link></li>
                <li><Link to="/legal/devoluciones-garantias" className="hover:text-[var(--sr-accent)] transition-colors font-medium">Derecho de Retracto (5 días)</Link></li>
                <li><Link to="/legal/devoluciones-garantias" className="hover:text-[var(--sr-accent)] transition-colors">Garantías y Cambios</Link></li>
                <li><Link to="/legal/envios-entregas" className="hover:text-[var(--sr-accent)] transition-colors">Envíos y Entregas Bogotá</Link></li>
                <li><Link to="/legal/centro-ayuda" className="hover:text-[var(--sr-accent)] transition-colors">Centro de Ayuda / FAQ</Link></li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('sr-open-cookie-settings'))}
                    className="font-medium text-[var(--sr-accent)] hover:underline cursor-pointer"
                  >
                    Configurar cookies
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold uppercase tracking-wider text-[var(--sr-hero-text)] text-[11px]">
                Aliados & Comunidad
              </p>
              <ul className="space-y-1.5">
                <li><Link to="/legal/reglas-tiendas" className="hover:text-[var(--sr-accent)] transition-colors">Reglas para Tiendas</Link></li>
                <li><Link to="/legal/reglas-fundaciones" className="hover:text-[var(--sr-accent)] transition-colors">Reglas para Fundaciones</Link></li>
                <li><Link to="/legal/segunda-vida" className="hover:text-[var(--sr-accent)] transition-colors">Segunda Vida (Ropa Usada)</Link></li>
                <li><Link to="/legal/probador-virtual-datos" className="hover:text-[var(--sr-accent)] transition-colors">Probador Virtual y Datos</Link></li>
                <li><Link to="/legal/normas-comunidad" className="hover:text-[var(--sr-accent)] transition-colors">Normas de Comunidad</Link></li>
                <li><Link to="/planes" className="hover:text-[var(--sr-accent)] transition-colors">Planes para Comercios</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold uppercase tracking-wider text-[var(--sr-hero-text)] text-[11px]">
                Información del Proveedor
              </p>
              <div className="space-y-1 text-[11px]">
                <p><strong className="text-[var(--sr-hero-text)]">{PROVIDER_INFO.razonSocial}</strong></p>
                <p>NIT {PROVIDER_INFO.nit}</p>
                <p>{PROVIDER_INFO.direccion}</p>
                <p>Canal Habeas Data: <a href={`mailto:${PROVIDER_INFO.correoDatos}`} className="text-[var(--sr-accent)] underline">{PROVIDER_INFO.correoDatos}</a></p>
                <p className="pt-1">
                  <a
                    href="https://www.sic.gov.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[var(--sr-hero-text)] hover:text-[var(--sr-accent)]"
                  >
                    <span>Vigilado SIC (sic.gov.co)</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

