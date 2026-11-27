import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ROLE_HOME } from '@/modules/core/types/roles'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { PROVIDER_INFO } from '../config/legalConfig'

export function LegalFooter() {
  const user = useContext(AuthContext)?.user ?? null
  const homePath = user ? ROLE_HOME[user.role] : '/'
  const currentYear = new Date().getFullYear()

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('sr-open-cookie-settings'))
  }

  return (
    <footer
      className="relative z-10 border-t border-[var(--color-border)] bg-[var(--color-surface)]/75 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-[var(--color-text)] transition-colors"
      aria-labelledby="sr-legal-footer-heading"
    >
      <h2 id="sr-legal-footer-heading" className="sr-only">
        Pie de página legal e institucional de Style Radar
      </h2>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* 1. SECCIÓN PRINCIPAL: 3 COLUMNAS LEGALES + BRAND */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Bloque Identidad de Marca y Redes */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={homePath} className="inline-flex items-center gap-2 group">
              <span className="text-xl font-black tracking-tight text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                Style<span className="text-[var(--color-accent)]">Radar</span>
              </span>
              <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--color-accent)] uppercase">
                Bogotá
              </span>
            </Link>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-sm">
              Plataforma tecnológica de moda local, diseño independiente y economía circular en Bogotá. Conectamos tiendas, diseñadores, compradores y fundaciones para impulsar la escena urbana con transparencia y respaldo legal.
            </p>

            {/* Redes Sociales Oficiales */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Comunidad en redes
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/styleradaroficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  aria-label="Instagram de Style Radar (se abre en nueva ventana)"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@styleradaroficial?lang=es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  aria-label="TikTok de Style Radar (se abre en nueva ventana)"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.29 0 .58.04.85.12V9.32a6.34 6.34 0 00-.85-.06A6.33 6.33 0 003.15 15.6a6.34 6.34 0 006.33 6.33 6.33 6.33 0 006.34-6.33V9.22a8.16 8.16 0 004.77 1.52V7.3a4.85 4.85 0 01-1-.61z" />
                  </svg>
                </a>
                {/* BUG-8: StyleRadar no tiene canal oficial de YouTube; no se muestra enlace. */}
              </div>
            </div>
          </div>

          {/* Columna 1: Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Marco Legal
            </h3>
            <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
              <li>
                <Link to="/legal/terminos" className="hover:text-[var(--color-accent)] transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/legal/datos-personales" className="hover:text-[var(--color-accent)] transition-colors">
                  Política de Datos (Habeas Data)
                </Link>
              </li>
              <li>
                <Link to="/legal/aviso-privacidad" className="hover:text-[var(--color-accent)] transition-colors">
                  Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="hover:text-[var(--color-accent)] transition-colors">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link to="/legal/pagos-seguridad" className="hover:text-[var(--color-accent)] transition-colors">
                  Medios de Pago y Seguridad
                </Link>
              </li>
              <li>
                <Link to="/legal/propiedad-intelectual" className="hover:text-[var(--color-accent)] transition-colors">
                  Propiedad Intelectual
                </Link>
              </li>
              <li>
                <Link to="/legal/uso-aceptable" className="hover:text-[var(--color-accent)] transition-colors">
                  Uso Aceptable y Seguridad
                </Link>
              </li>
              <li>
                <Link to="/legal" className="font-semibold text-[var(--color-accent)] hover:underline">
                  Ver Mapa Legal Completo →
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 2: Ayuda & Consumidor */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Ayuda & Consumidor
            </h3>
            <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
              <li>
                <Link to="/legal/pqrs" className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1.5">
                  <span>Radicar PQRS</span>
                  <span className="rounded bg-[var(--color-accent)]/20 px-1 py-0.2 text-[9px] font-bold text-[var(--color-accent)]">Oficial</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/devoluciones-garantias"
                  className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 font-semibold text-[var(--color-text)]"
                >
                  <span>Derecho de Retracto (5 días)</span>
                </Link>
              </li>
              <li>
                <Link to="/legal/devoluciones-garantias" className="hover:text-[var(--color-accent)] transition-colors">
                  Garantías y Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/legal/envios-entregas" className="hover:text-[var(--color-accent)] transition-colors">
                  Envíos y Entregas en Bogotá
                </Link>
              </li>
              <li>
                <Link to="/legal/promociones-descuentos" className="hover:text-[var(--color-accent)] transition-colors">
                  Promociones y Descuentos
                </Link>
              </li>
              <li>
                <Link to="/legal/centro-ayuda" className="hover:text-[var(--color-accent)] transition-colors">
                  Centro de Ayuda y FAQ
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookieSettings}
                  className="text-left font-medium text-[var(--color-accent)] hover:underline cursor-pointer"
                >
                  Configurar cookies
                </button>
              </li>
              <li className="pt-1">
                <a
                  href={PROVIDER_INFO.sicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-text)] hover:text-[var(--color-accent)] border border-[var(--color-border)] rounded-md px-2 py-1 bg-[var(--color-surface-raised)]/40 transition-colors"
                >
                  <span>Portal SIC (sic.gov.co)</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Aliados & Comunidad */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Comunidad & Aliados
            </h3>
            <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
              <li>
                <Link to="/legal/reglas-tiendas" className="hover:text-[var(--color-accent)] transition-colors">
                  Reglas para Tiendas y Marcas
                </Link>
              </li>
              <li>
                <Link to="/legal/reglas-fundaciones" className="hover:text-[var(--color-accent)] transition-colors">
                  Reglas para Fundaciones
                </Link>
              </li>
              <li>
                <Link to="/legal/segunda-vida" className="hover:text-[var(--color-accent)] transition-colors">
                  Reglas «Segunda Vida» (Ropa Usada)
                </Link>
              </li>
              <li>
                <Link to="/legal/probador-virtual-datos" className="hover:text-[var(--color-accent)] transition-colors">
                  Probador Virtual y Datos de Imagen
                </Link>
              </li>
              <li>
                <Link to="/legal/normas-comunidad" className="hover:text-[var(--color-accent)] transition-colors">
                  Normas de Comunidad y Playlists
                </Link>
              </li>
              <li>
                <Link to="/planes" className="hover:text-[var(--color-accent)] transition-colors font-medium text-[var(--color-text)]">
                  Planes para Comercios Locales
                </Link>
              </li>
              <li>
                <Link to="/donar" className="hover:text-[var(--color-accent)] transition-colors">
                  Donar Ropa a Causas Locales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 2. BLOQUE DE INFORMACIÓN DEL PROVEEDOR (EXIGENCIA LEY 1480 DE 2011 Y LEY 1581 DE 2012) */}
        <div className="mt-12 rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/30 p-5 text-xs text-[var(--color-text-muted)] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="font-bold text-[var(--color-text)] block">Proveedor / Razón Social:</span>
              <span>{PROVIDER_INFO.razonSocial}</span>
            </div>
            <div>
              <span className="font-bold text-[var(--color-text)] block">Identificación Tributaria:</span>
              <span>NIT {PROVIDER_INFO.nit}</span>
            </div>
            <div>
              <span className="font-bold text-[var(--color-text)] block">Domicilio & Dirección:</span>
              <span>{PROVIDER_INFO.direccion}</span>
            </div>
            <div>
              <span className="font-bold text-[var(--color-text)] block">Contacto & WhatsApp:</span>
              <span>{PROVIDER_INFO.telefono}</span>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]/60 pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-[11px]">
            <p>
              <strong className="text-[var(--color-text)]">Responsable del Tratamiento de Datos:</strong> {PROVIDER_INFO.razonSocial} ·{' '}
              <strong className="text-[var(--color-text)]">Canal para ejercer tus derechos (Habeas Data):</strong>{' '}
              <a href={`mailto:${PROVIDER_INFO.correoDatos}`} className="text-[var(--color-accent)] hover:underline">
                {PROVIDER_INFO.correoDatos}
              </a>
            </p>
            <p className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
              Horario: {PROVIDER_INFO.horarioAtencion}
            </p>
          </div>
        </div>

        {/* 3. LÍNEA INFERIOR: COPYRIGHT, ENLACE SIC Y LEYENDAS */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
          <p className="text-center sm:text-left">
            © {currentYear} Style Radar · {PROVIDER_INFO.razonSocial} · Todos los derechos reservados. Comercio electrónico regulado bajo las leyes de la República de Colombia.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/legal/devoluciones-garantias" className="hover:text-[var(--color-text)] transition-colors font-semibold">
              Retracto legal
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/legal/pqrs" className="hover:text-[var(--color-text)] transition-colors font-semibold">
              Canal PQRS
            </Link>
            <span aria-hidden="true">·</span>
            <a
              href={PROVIDER_INFO.sicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text)] transition-colors font-semibold"
            >
              Superintendencia de Industria y Comercio
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
