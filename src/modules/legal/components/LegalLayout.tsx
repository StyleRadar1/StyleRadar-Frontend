import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LEGAL_DOCS_REGISTRY } from '../config/legalConfig'
import type { LegalDocMeta, LegalDocSection } from '../types/legal.types'

interface LegalLayoutProps {
  docMeta: LegalDocMeta
  sections?: LegalDocSection[]
  children: ReactNode
}

export function LegalLayout({ docMeta, sections = [], children }: LegalLayoutProps) {
  const { pathname } = useLocation()

  const categories = [
    { key: 'general', title: 'Marco General & Plataforma' },
    { key: 'privacidad', title: 'Privacidad & Datos' },
    { key: 'consumidor', title: 'Derechos del Consumidor' },
    { key: 'aliados', title: 'Tiendas & Fundaciones' },
    { key: 'comunidad', title: 'Comunidad & Circular' },
    { key: 'soporte', title: 'Soporte & PQRS' },
  ] as const

  const docsList = Object.values(LEGAL_DOCS_REGISTRY)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg,#0a0a0c)] text-[var(--color-text,#ededed)] pt-6 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb accesible */}
        <nav aria-label="Migas de pan" className="mb-6 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Link to="/" className="hover:text-[var(--color-accent)] transition-colors">
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/legal" className="hover:text-[var(--color-accent)] transition-colors">
            Centro Legal
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[var(--color-text)] truncate max-w-xs sm:max-w-md" aria-current="page">
            {docMeta.shortTitle}
          </span>
        </nav>

        {/* Layout en 2 columnas: Índice anclado a la izquierda (desktop) + Contenido legal a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* BARRA LATERAL ANCLADA (STICKY) EN ESCRITORIO */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            {/* Tarjeta de navegación por documentos */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Documentos Legales (18)
                </h2>
                <Link
                  to="/legal"
                  className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline"
                >
                  Ver índice
                </Link>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4 text-xs scrollbar-thin">
                {categories.map((cat) => {
                  const items = docsList.filter((d) => d.category === cat.key)
                  if (items.length === 0) return null
                  return (
                    <div key={cat.key} className="space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] px-2 pt-1">
                        {cat.title}
                      </p>
                      {items.map((item) => {
                        const targetPath = item.slug === 'mapa-legal' ? '/legal' : `/legal/${item.slug}`
                        const isActive = pathname === targetPath || (item.slug === 'mapa-legal' && pathname === '/legal')
                        return (
                          <Link
                            key={item.id}
                            to={targetPath}
                            className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-colors ${
                              isActive
                                ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] font-bold shadow-sm'
                                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]'
                            }`}
                          >
                            <span className="truncate">{item.shortTitle}</span>
                            <span className="text-[10px] opacity-75 shrink-0 ml-1">v{item.version}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Índice interno anclado de la página actual (TOC) */}
            {sections.length > 0 && (
              <div className="hidden lg:block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-4 text-xs space-y-2">
                <p className="font-bold text-[var(--color-text)] uppercase tracking-wider text-[11px]">
                  En esta página
                </p>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block truncate text-[var(--color-text-muted)] hover:text-[var(--color-accent)] py-0.5 transition-colors"
                    >
                      {s.numeral} {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Accesos rápidos de utilidad */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 text-xs space-y-3">
              <p className="font-bold text-[var(--color-text)]">¿Tienes dudas sobre esta política?</p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/legal/pqrs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition-colors"
                >
                  <span>Radicar consulta formal</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Imprimir o Guardar PDF</span>
                </button>
              </div>
            </div>
          </aside>

          {/* CUERPO DEL DOCUMENTO LEGAL A LA DERECHA */}
          <main className="lg:col-span-8 space-y-8">
            {/* Encabezado del documento */}
            <header className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
                <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 font-bold text-[var(--color-accent)] uppercase tracking-wider text-[11px]">
                  Documento Oficial · Colombia
                </span>
                <div className="flex items-center gap-3">
                  <span>Versión <strong>{docMeta.version}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Última actualización: <strong>{docMeta.lastUpdated}</strong></span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text)] leading-tight">
                {docMeta.title}
              </h1>

              {/* Resumen ejecutivo inicial */}
              <div
                className="rounded-2xl border-l-4 border-[var(--color-accent)] bg-[var(--color-surface-raised)]/60 p-4 text-sm text-[var(--color-text)] leading-relaxed space-y-1"
                role="note"
                aria-label="Resumen ejecutivo del documento"
              >
                <p className="font-bold text-xs uppercase tracking-wider text-[var(--color-accent)]">
                  Resumen Ejecutivo
                </p>
                <p>{docMeta.summary}</p>
              </div>

              {/* Badges de lectura y jurisdicción */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]/50">
                <span>⏱️ Lectura estimada: ~{docMeta.readTimeMinutes} min</span>
                <span>🇨🇴 Jurisdicción: Bogotá D.C., Colombia</span>
                <span>⚖️ Regulador: Superintendencia de Industria y Comercio (SIC)</span>
              </div>
            </header>

            {/* Contenido renderizado */}
            <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-10 text-[var(--color-text)] leading-relaxed">
              {children}
            </article>

            {/* Pie del documento: Enlaces de navegación y reporte */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
              <p>
                ¿Encontraste algún término confuso o requieres aclaración? Escríbenos a{' '}
                <a href="mailto:privacidad@styleradar.co" className="font-bold text-[var(--color-accent)] hover:underline">
                  privacidad@styleradar.co
                </a>
              </p>
              <Link
                to="/legal"
                className="shrink-0 font-bold text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
              >
                ← Volver al Mapa Legal
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
