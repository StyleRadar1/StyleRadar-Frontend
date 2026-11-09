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
      className="relative py-24 md:py-32 px-6 md:px-12 bg-[#15121b] text-white border-t border-white/5"
      aria-labelledby="pePlanesTitle"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a98be0]">
              Planes y membresías
            </p>
            <h2
              id="pePlanesTitle"
              className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]"
            >
              Un plan para <span className="text-[#e8dccb]">cada quien.</span>
            </h2>
            <p className="text-base md:text-lg text-[#d1ced7] leading-relaxed">
              Explorar el catálogo, el mapa y las playlists siempre es gratis. Paga solo si
              deseas funciones avanzadas como el probador sobre tu foto o publicar tu tienda.
            </p>
          </div>

          {/* Filtro rápido por público */}
          <div className="flex items-center gap-2 bg-[#1f1b26] p-1.5 rounded-full border border-white/10 self-start md:self-auto">
            {(['TODOS', 'PERSONAS', 'NEGOCIOS'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterAudience(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterAudience === tab
                    ? 'bg-[#48119a] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
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
                    ? 'bg-gradient-to-b from-[#26173d] to-[#1a1428] border-2 border-[#7b4dd8] shadow-[0_12px_40px_#48119a55] scale-[1.02] z-10'
                    : 'bg-[#1f1b26]/70 border border-white/10 hover:border-white/25 hover:bg-[#1f1b26]'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#7b4dd8] text-white text-[10px] font-black tracking-widest uppercase shadow-md">
                    Más elegido
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#a98be0]">
                      {plan.audience}
                    </span>
                    <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-xs text-[#b9b9ca] font-medium">/ {plan.cadence}</span>
                  </div>

                  {/* Lista de beneficios */}
                  <ul className="space-y-3 pt-4 border-t border-white/10 text-xs text-[#d1ced7] leading-relaxed">
                    {plan.items.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <svg
                          className={`w-4 h-4 flex-none mt-0.5 ${
                            isFeatured ? 'text-[#a98be0]' : 'text-white/60'
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
                      className={`w-full py-3.5 px-6 rounded-full font-black text-xs uppercase tracking-wider transition-all text-center cursor-pointer ${
                        isFeatured
                          ? 'bg-[#48119a] hover:bg-[#5e18c8] text-white shadow-lg shadow-[#48119a66]'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                    >
                      {plan.action}
                    </button>
                  ) : (
                    <Link
                      to={plan.to}
                      className={`block w-full py-3.5 px-6 rounded-full font-black text-xs uppercase tracking-wider transition-all text-center ${
                        isFeatured
                          ? 'bg-[#48119a] hover:bg-[#5e18c8] text-white shadow-lg shadow-[#48119a66]'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
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

