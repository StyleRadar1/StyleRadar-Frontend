import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pricingPlans } from '@/data/landingData'
import { formatCOP } from '@/modules/core/utils/format'
import { RADAR_PLUS_PRICE, STORE_SUBSCRIPTION_PRICE } from '@/modules/transacciones/constants/plansByRole'
import { PLAN_COMPARISON_ROWS } from '@/modules/transacciones/types/plan.dto'

interface PricingPlansProps {
  /** Abre «Crear cuenta» con el tipo de cuenta del plan (?tipo=tienda → STORE_ADMIN). */
  onOpenRegister?: (rol?: 'BUYER' | 'STORE_ADMIN' | 'FOUNDATION_REPRESENTATIVE') => void
}

export function PricingPlans({ onOpenRegister }: PricingPlansProps) {
  const [filterAudience, setFilterAudience] = useState<'TODOS' | 'PERSONAS' | 'NEGOCIOS'>('TODOS')

  const normalizedPlans = pricingPlans.map((plan) => {
    if (plan.name === 'Radar') {
      return {
        ...plan,
        items: PLAN_COMPARISON_ROWS.map(([que, radar]) => `${que}: ${radar}`),
      }
    }
    if (plan.name === 'Radar+') {
      return {
        ...plan,
        price: formatCOP(RADAR_PLUS_PRICE),
        items: PLAN_COMPARISON_ROWS.map(([que, , plus]) => `${que}: ${plus}`),
      }
    }
    if (plan.name === 'Tienda aliada') {
      return {
        ...plan,
        price: formatCOP(STORE_SUBSCRIPTION_PRICE),
      }
    }
    return plan
  })

  const filteredPlans = normalizedPlans.filter((plan) => {
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

          {/* Filtro rápido por público con efecto glass */}
          <div className="flex items-center gap-2 bg-white/85 dark:bg-purple-950/30 backdrop-blur-xl p-1.5 rounded-full border border-black/10 dark:border-purple-400/25 self-start md:self-auto shadow-md dark:shadow-lg">
            {(['TODOS', 'PERSONAS', 'NEGOCIOS'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterAudience(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterAudience === tab
                    ? 'bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] text-[#ffffff] shadow-[0_4px_14px_rgba(139,92,246,0.45)]'
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
                    ? 'bg-gradient-to-b from-purple-50/95 via-white/95 to-purple-50/90 dark:from-purple-900/40 dark:via-[#141021]/85 dark:to-[#141021]/95 backdrop-blur-2xl border-2 border-[#7B3FE4] dark:border-purple-400/70 shadow-lg dark:shadow-[0_20px_50px_rgba(139,92,246,0.35),0_0_30px_rgba(139,92,246,0.2)] scale-[1.02] z-10'
                    : 'bg-white/85 dark:bg-purple-950/20 backdrop-blur-2xl border border-black/10 dark:border-purple-400/20 hover:border-purple-400/50 hover:bg-purple-50/80 dark:hover:bg-purple-500/10 shadow-md dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)]'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--sr-accent)] text-[#ffffff] text-[10px] font-black tracking-widest uppercase shadow-md">
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
                  {onOpenRegister && (plan.to === '/registro' || plan.to === '/registro?tipo=tienda') ? (
                    <button
                      type="button"
                      onClick={() => onOpenRegister(plan.to === '/registro?tipo=tienda' ? 'STORE_ADMIN' : 'BUYER')}
                      className={`w-full py-3.5 px-6 rounded-full font-black text-xs uppercase tracking-wider transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                        isFeatured
                          ? 'bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] hover:from-[#B49BFB] hover:to-[#8B5CF6] text-[#ffffff] shadow-[0_4px_20px_rgba(139,92,246,0.5)] border border-white/20'
                          : 'bg-purple-100/90 hover:bg-purple-200/90 dark:bg-purple-500/10 dark:hover:bg-purple-500/25 text-[#48119A] dark:text-white border border-purple-300 dark:border-purple-400/30 hover:border-purple-400/60 backdrop-blur-md shadow-sm'
                      }`}
                    >
                      {plan.action}
                    </button>
                  ) : (
                    <Link
                      to={plan.to}
                      className={`block w-full py-3.5 px-6 rounded-full font-black text-xs uppercase tracking-wider transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                        isFeatured
                          ? 'bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] hover:from-[#B49BFB] hover:to-[#8B5CF6] text-[#ffffff] shadow-[0_4px_20px_rgba(139,92,246,0.5)] border border-white/20'
                          : 'bg-purple-100/90 hover:bg-purple-200/90 dark:bg-purple-500/10 dark:hover:bg-purple-500/25 text-[#48119A] dark:text-white border border-purple-300 dark:border-purple-400/30 hover:border-purple-400/60 backdrop-blur-md shadow-sm'
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

