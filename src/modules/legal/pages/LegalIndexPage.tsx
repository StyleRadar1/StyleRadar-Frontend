import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL_DOCS_REGISTRY, PROVIDER_INFO } from '../config/legalConfig'
import { LegalLayout } from '../components/LegalLayout'

export default function LegalIndexPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')

  const docs = Object.values(LEGAL_DOCS_REGISTRY)

  const categories = [
    { key: 'todos', label: 'Todos (18)' },
    { key: 'general', label: 'General & Contratos' },
    { key: 'privacidad', label: 'Privacidad & Datos' },
    { key: 'consumidor', label: 'Consumidor & Pagos' },
    { key: 'aliados', label: 'Tiendas & Fundaciones' },
    { key: 'comunidad', label: 'Comunidad & Ropa Usada' },
    { key: 'soporte', label: 'PQRS & Ayuda' },
  ]

  const filteredDocs = docs.filter((doc) => {
    const matchesCategory = selectedCategory === 'todos' || doc.category === selectedCategory
    const matchesSearch =
      searchTerm.trim() === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const indexMeta = LEGAL_DOCS_REGISTRY['mapa-legal']

  return (
    <LegalLayout docMeta={indexMeta}>
      <div className="space-y-8">
        {/* Introducción y buscador */}
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
            Bienvenido al Centro de Transparencia, Políticas y Cumplimiento Normativo de Style Radar. Aquí encontrarás la totalidad de las directrices, reglamentos de compras, garantías, privacidad y canales de atención vigentes de conformidad con las leyes colombianas (Ley 1480 de 2011, Ley 1581 de 2012, Ley 527 de 1999).
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por política, tema o palabra clave (ej. garantía, retracto, cookies, fotos)..."
                aria-label="Buscar documento legal"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 px-4 py-2.5 pl-10 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-colors"
              />
              <svg
                className="absolute left-3.5 top-3 h-4 w-4 text-[var(--color-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>

          {/* Filtros por categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none pt-1">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === c.key
                    ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] shadow-sm'
                    : 'bg-[var(--color-surface-raised)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rejilla de los 18 documentos legales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc, idx) => {
            const targetPath = doc.slug === 'mapa-legal' ? '/legal' : `/legal/${doc.slug}`
            return (
              <Link
                key={doc.id}
                to={targetPath}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 hover:bg-[var(--color-surface-raised)]/70 hover:border-[var(--color-accent)]/50 p-5 transition-all shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-[var(--color-accent)]">
                      DOC #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      v{doc.version} · {doc.readTimeMinutes} min
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-3">
                    {doc.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--color-border)]/50 flex items-center justify-between text-xs font-semibold text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform">
                  <span>Acceder al documento completo</span>
                  <span aria-hidden="true">→</span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Ficha completa del proveedor (Ley 1480 de 2011 y Ley 1581 de 2012) */}
        <section
          id="proveedor"
          aria-labelledby="sr-provider-info-title"
          className="rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/30 p-5 text-xs text-[var(--color-text-muted)] space-y-3"
        >
          <h4 id="sr-provider-info-title" className="text-sm font-bold text-[var(--color-text)]">
            Información del Proveedor y Responsable de Datos
          </h4>
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
        </section>

        {/* Tarjeta de protección al consumidor y canal SIC */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--color-text-muted)]">
          <div className="space-y-1 max-w-xl">
            <h4 className="font-bold text-sm text-[var(--color-text)]">
              Protección al Consumidor en Colombia (SIC)
            </h4>
            <p>
              Style Radar opera bajo la vigilancia y control de la Superintendencia de Industria y Comercio. Si consideras que se han vulnerado tus derechos como consumidor o en el tratamiento de tus datos personales, puedes radicar tu solicitud en{' '}
              <a href={PROVIDER_INFO.sicUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--color-accent)] hover:underline">
                www.sic.gov.co
              </a>
              .
            </p>
          </div>
          <Link
            to="/legal/pqrs"
            className="shrink-0 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 font-bold text-xs text-[var(--color-text-on-accent)] hover:opacity-90 transition-opacity"
          >
            Radicar PQRS en Style Radar
          </Link>
        </div>
      </div>
    </LegalLayout>
  )
}
