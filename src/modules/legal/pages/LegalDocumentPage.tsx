import { useParams, Navigate } from 'react-router-dom'
import { LegalLayout } from '../components/LegalLayout'
import { LEGAL_DOCUMENTS } from '../data/legalDocuments'

export default function LegalDocumentPage() {
  const { slug } = useParams<{ slug: string }>()
  const safeSlug = slug || 'terminos'

  const doc = LEGAL_DOCUMENTS[safeSlug]

  if (!doc) {
    return <Navigate to="/legal" replace />
  }

  return (
    <LegalLayout docMeta={doc} sections={doc.sections}>
      {doc.sections.map((sec) => (
        <section
          key={sec.id}
          id={sec.id}
          className="space-y-4 scroll-mt-28 border-b border-[var(--color-border)]/40 pb-8 last:border-b-0 last:pb-0"
        >
          <div className="flex items-baseline gap-3">
            <span className="text-sm sm:text-base font-black text-[var(--color-accent)] font-mono">
              {sec.numeral}
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {sec.title}
            </h2>
          </div>

          <div className="space-y-3.5 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
            {sec.paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Viñetas o listas estructuradas si aplican */}
          {sec.bullets && sec.bullets.length > 0 && (
            <ul className="mt-3 space-y-2 pl-5 text-sm sm:text-base text-[var(--color-text-muted)] list-disc marker:text-[var(--color-accent)]">
              {sec.bullets.map((b, i) => (
                <li key={i} className="pl-1 leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/* Subsecciones anidadas si aplican */}
          {sec.subsections && sec.subsections.length > 0 && (
            <div className="mt-6 space-y-5 pl-2 sm:pl-4 border-l-2 border-[var(--color-border)]">
              {sec.subsections.map((sub) => (
                <div key={sub.id} id={sub.id} className="space-y-2 scroll-mt-28">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--color-accent)]">{sub.numeral}</span>
                    <span>{sub.title}</span>
                  </h3>
                  {sub.paragraphs.map((p, j) => (
                    <p key={j} className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                      {p}
                    </p>
                  ))}
                  {sub.bullets && (
                    <ul className="mt-2 space-y-1.5 pl-4 text-xs sm:text-sm list-disc marker:text-[var(--color-accent)]">
                      {sub.bullets.map((sb, k) => (
                        <li key={k}>{sb}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Nota destacada o plantilla legal (ej. letra pequeña) */}
          {sec.alertNote && (
            <div className="mt-4 rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 p-4 text-xs sm:text-sm text-[var(--color-text)] leading-relaxed space-y-1.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--color-accent)] block">
                Leyenda Legal Obligatoria (SIC · Ley 1480 de 2011)
              </span>
              <p className="font-mono text-xs uppercase text-[var(--color-text)] tracking-tight">
                {sec.alertNote}
              </p>
            </div>
          )}
        </section>
      ))}
    </LegalLayout>
  )
}
