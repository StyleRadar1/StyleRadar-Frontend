import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pricingPlans } from '@/data/landingData'

interface PricingPlansProps {
  onOpenRegister?: () => void
}

export function PricingPlans({ onOpenRegister }: PricingPlansProps) {
  const [filterAudience, setFilterAudience] = useState<'TODOS' | 'PERSONAS' | 'NEGOCIOS'>('TODOS')

  const filteredPlans = pricingPlans.filter((plan) => {
    if (filterAudience === 'PERSONAS') return plan.audience === 'Personas'
    if (filterAudience === 'NEGOCIOS') return plan.audience === 'Tiendas' || plan.audience === 'Fundaciones'
    return true
  })

  return (
    <section
      id="planes"
      className="relative py-24 md:py-32 px-6 md:px-12 bg-transparent text-[var(--sr-hero-text)] border-t border-[var(--sr-border-subtle)]"
      aria-labelledby="pePlanesTitle"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--sr-accent)]">
              Planes y membresías
            </p>
            <h2
              id="pePlanesTitle"
              className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-[var(--sr-hero-text)]"
            >
              Un plan para <span className="text-[var(--sr-accent-text)]">cada quien.</span>
            </h2>
            <p className="text-base md:text-lg text-[var(--sr-hero-text-muted)] leading-relaxed">
              Explorar el catálogo, el mapa y las playlists siempre es gratis. Paga solo si
              deseas funciones avanzadas como el probador sobre tu foto o publicar tu tienda.
            </p>
          </div>

          {/* Filtro rápido por público */}
          <div className="flex items-center gap-2 bg-[var(--sr-surface)] p-1.5 rounded-full border border-[var(--sr-border-subtle)] self-start md:self-auto">
            {(['TODOS', 'PERSONAS', 'NEGOCIOS'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterAudience(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterAudience === tab
                    ? 'bg-[var(--sr-accent)] text-[var(--sr-text-on-accent)] shadow-md'
                    : 'text-[var(--sr-hero-text-muted)] hover:text-[var(--sr-hero-text)]'
                }`}
              >
                {tab === 'TODOS' ? 'Todos los planes' : tab === 'PERSONAS' ? 'Para personas' : 'Para comercios'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de tarjetas de precios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {filteredPlans.map((plan) => {
            const isFeatured = plan.featured

            return (
              <article
                key={plan.name}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  isFeatured
                    ? 'bg-[var(--sr-surface-raised)] border-2 border-[var(--sr-accent)] shadow-[0_12px_40px_rgba(72,17,154,0.25)] scale-[1.02] z-10'
                    : 'bg-[var(--sr-surface)]/80 border border-[var(--sr-border-subtle)] hover:border-[var(--sr-accent)] hover:bg-[var(--sr-surface)]'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--sr-accent)] text-[var(--sr-text-on-accent)] text-[10px] font-black tracking-widest uppercase shadow-md">
                    Más elegido
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--sr-accent)]">
                      {plan.audience}
                    </span>
                    <h3 className="text-2xl font-black text-[var(--sr-hero-text)] tracking-tight mt-1">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[var(--sr-hero-text)]">{plan.price}</span>
                    <span className="text-xs text-[var(--sr-hero-text-muted)] font-medium">/ {plan.cadence}</span>
                  </div>

                  {/* Lista de beneficios */}
                  <ul className="space-y-3 pt-4 border-t border-[var(--sr-border-subtle)] text-xs text-[var(--sr-hero-text-muted)] leading-relaxed">
                    {plan.items.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <svg
                          className={`w-4 h-4 flex-none mt-0.5 ${
                            isFeatured ? 'text-[var(--sr-accent)]' : 'text-[var(--sr-hero-text-muted)]'
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón de acción */}
                <div className="pt-8">
                  {onOpenRegister && plan.to === '/registro' ? (
                    <button
                      type="button"
                      onClick={onOpenRegister}
                      className={`w-full py-3.5 px-6 rounded-full font-black text-xs uppercase tracking-wider transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                        isFeatured
                          ? 'bg-[var(--sr-accent)] hover:opacity-90 text-[var(--sr-text-on-accent)] shadow-lg shadow-[var(--sr-accent)]/30'
                          : 'bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-raised)] text-[var(--sr-hero-text)] border border-[var(--sr-border-subtle)]'
                      }`}
                    >
                      {plan.action}
                    </button>
                  ) : (
                    <Link
                      to={plan.to}
                      className={`block w-full py-3.5 px-6 rounded-full font-black text-xs uppercase tracking-wider transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                        isFeatured
                          ? 'bg-[var(--sr-accent)] hover:opacity-90 text-[var(--sr-text-on-accent)] shadow-lg shadow-[var(--sr-accent)]/30'
                          : 'bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-raised)] text-[var(--sr-hero-text)] border border-[var(--sr-border-subtle)]'
                      }`}
                    >
                      {plan.action}
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

