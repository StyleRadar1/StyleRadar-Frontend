import { useState } from 'react'
import { Link } from 'react-router-dom'
import { howItWorksSteps } from '@/data/landingData'

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section
      id="como-funciona"
      className="relative py-24 md:py-32 px-6 md:px-12 bg-gradient-to-b from-[#15121b] via-[#1b1722] to-[#15121b] text-white border-t border-white/5"
      aria-labelledby="howTitle"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Cabecera */}
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a98be0]">
            Tu ciudad, tu estilo
          </p>
          <h2
            id="howTitle"
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]"
          >
            Encuentra lo que buscas{' '}
            <span className="text-[#b9b9ca] font-normal italic">
              sin cruzar Bogotá a ciegas.
            </span>
          </h2>
          <p className="text-base md:text-lg text-[#d1ced7] leading-relaxed">
            Mira qué tiendas tienen tu talla en stock hoy, pruébate prendas en el maniquí virtual y
            sal con un plan claro hacia la tienda más cercana.
          </p>
        </div>

        {/* Grid de interacción: Imagen editorial a la izquierda + Pasos a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center">
          {/* Imagen editorial */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden bg-[#211d29] shadow-2xl aspect-[4/5] border border-white/10 group">
            <img
              src="/prototipo/assets/img/paginas/imagen-5.jpg"
              alt="Moda urbana en las calles de Bogotá"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#15121b]/90 via-[#15121b]/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs tracking-widest uppercase font-bold text-white/90">
              <span>StyleRadar · Bogotá</span>
              <span className="text-[#a98be0]">Paso 0{activeStep + 1} de 04</span>
            </div>
          </div>

          {/* Lista interactiva de pasos */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
            <ol className="divide-y divide-white/10">
              {howItWorksSteps.map((step, index) => {
                const isSelected = activeStep === index
                return (
                  <li
                    key={step.number}
                    onClick={() => setActiveStep(index)}
                    className={`py-6 px-4 rounded-xl cursor-pointer transition-all flex items-start gap-6 ${
                      isSelected
                        ? 'bg-white/10 border-l-4 border-[#48119a] pl-6'
                        : 'hover:bg-white/5 border-l-4 border-transparent'
                    }`}
                  >
                    <span
                      className={`text-sm font-black tracking-widest pt-0.5 transition-colors ${
                        isSelected ? 'text-[#a98be0]' : 'text-white/40'
                      }`}
                    >
                      {step.number}
                    </span>
                    <div className="space-y-1.5">
                      <h3
                        className={`text-xl font-bold tracking-tight transition-colors ${
                          isSelected ? 'text-white' : 'text-white/80'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-[#b9b9ca] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>

            <div className="pt-6">
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a98be0] hover:text-white transition-colors"
              >
                <span>Explorar catálogo ahora</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

