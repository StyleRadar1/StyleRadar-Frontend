import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clothingCycle } from '@/data/landingData'

export function ClothingCycle() {
  const [activeTab, setActiveTab] = useState(0)
  const currentPillar = clothingCycle[activeTab]

  return (
    <section
      id="ciclo"
      className="relative py-24 md:py-32 px-6 md:px-12 bg-transparent text-[var(--sr-hero-text)] border-t border-[var(--sr-border-subtle)]"
      aria-labelledby="cicloTitle"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Cabecera */}
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--sr-accent)]">
            Moda circular · Bogotá
          </p>
          <h2
            id="cicloTitle"
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-[var(--sr-hero-text)]"
          >
            El ecosistema de StyleRadar:{' '}
            <span className="text-[var(--sr-accent-text)]">tres formas de vivir la moda.</span>
          </h2>
          <p className="text-base md:text-lg text-[var(--sr-hero-text-muted)] leading-relaxed">
            En StyleRadar ninguna prenda se queda olvidada en el armario: puedes estrenar talento
            local en boutiques de barrio, hacer circular prendas de segunda mano o donar con
            impacto social directo.
          </p>
        </div>

        {/* Selector de los tres pilares */}
        <div
          role="tablist"
          aria-label="Tres formas de vivir la moda en StyleRadar"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[var(--sr-border-subtle)] pb-6"
        >
          {clothingCycle.map((pillar, index) => {
            const isSelected = activeTab === index
            return (
              <button
                key={pillar.label}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-4 p-5 rounded-2xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--sr-surface-raised)] border-2 border-[var(--sr-accent)] shadow-lg scale-[1.02]'
                    : 'bg-[var(--sr-surface)]/60 border border-[var(--sr-border-subtle)] hover:bg-[var(--sr-surface)]'
                }`}
              >
                <span
                  className={`text-xl font-black ${
                    isSelected ? 'text-[var(--sr-accent)]' : 'text-[var(--sr-hero-text-muted)]'
                  }`}
                >
                  0{index + 1}
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-base text-[var(--sr-hero-text)] tracking-tight">
                    {pillar.label}
                  </span>
                  <span className="text-xs text-[var(--sr-hero-text-muted)]">{pillar.sub}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Panel del pilar activo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[var(--sr-surface)]/80 border border-[var(--sr-border-subtle)] rounded-3xl p-6 md:p-12">
          {/* Detalles del pilar */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-[var(--sr-accent)]/20 border border-[var(--sr-accent)]/40 text-[var(--sr-accent)] font-bold text-xs uppercase tracking-wider">
              {currentPillar.eyebrow}
            </span>

            <h3 className="text-3xl md:text-4xl font-extrabold text-[var(--sr-hero-text)] tracking-tight leading-snug">
              {currentPillar.title}
            </h3>

            <p className="text-base text-[var(--sr-hero-text-muted)] leading-relaxed">
              {currentPillar.text}
            </p>

            {/* Estadísticas del pilar */}
            <div className="flex items-center gap-10 py-3 border-y border-[var(--sr-border-subtle)]">
              <div>
                <p className="text-3xl md:text-4xl font-black text-[var(--sr-hero-text)]">
                  {currentPillar.stat}
                </p>
                <p className="text-xs text-[var(--sr-hero-text-muted)] uppercase tracking-wider mt-1">
                  {currentPillar.statLabel}
                </p>
              </div>
              <div className="border-l border-[var(--sr-border-subtle)] pl-10">
                <p className="text-3xl md:text-4xl font-black text-[var(--sr-accent-text)]">100%</p>
                <p className="text-xs text-[var(--sr-hero-text-muted)] uppercase tracking-wider mt-1">
                  Transparente en Bogotá
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-2">
              <Link
                to={currentPillar.to}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#48119a] hover:bg-[#5e18c8] text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_8px_25px_#48119a77] hover:translate-x-1 transition-all"
              >
                <span>{currentPillar.action}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          {/* Imagen de preview editorial */}
          <div className="lg:col-span-5 relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-[var(--sr-surface)] border border-[var(--sr-border-subtle)]">
            <img
              src={currentPillar.image}
              alt={currentPillar.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--sr-accent)]">
                Ecosistema StyleRadar
              </p>
              <p className="text-base font-extrabold text-white">
                {currentPillar.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

