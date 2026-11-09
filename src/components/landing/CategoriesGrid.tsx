import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '@/data/landingData'

export function CategoriesGrid() {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const current = categories[selectedCategory]

  return (
    <section
      id="categorias"
      className="relative py-24 md:py-32 px-6 md:px-12 bg-[#15121b] text-white border-t border-white/5"
      aria-labelledby="categoriesTitle"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Cabecera */}
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a98be0]">
            Explora por estilo · Bogotá
          </p>
          <h2
            id="categoriesTitle"
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]"
          >
            Descubre tu identidad:{' '}
            <span className="text-[#b9b9ca] font-normal italic">
              cinco estilos de la ciudad.
            </span>
          </h2>
          <p className="text-base md:text-lg text-[#d1ced7] leading-relaxed">
            Elige el estilo que mejor te representa y encuentra prendas disponibles hoy en tu
            talla en tiendas locales.
          </p>
        </div>

        {/* Vitrina principal interactiva */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#1f1b26]/70 border border-white/10 rounded-3xl p-6 md:p-10">
          <figure className="lg:col-span-7 relative aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden bg-[#15121b] shadow-xl">
            <img
              src={current.image}
              alt={`Inspiración de estilo ${current.name}`}
              className="w-full h-full object-cover transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <figcaption className="absolute bottom-4 left-6 text-xs uppercase font-extrabold tracking-widest text-white/90">
              Estilo {current.name}
            </figcaption>
          </figure>

          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:pl-6">
            <div className="space-y-4">
              <span className="text-sm font-black tracking-widest text-[#a98be0]">
                0{selectedCategory + 1} / 0{categories.length}
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                {current.name}
              </h3>
              <p className="text-base text-[#b9b9ca] leading-relaxed">
                {current.note}
              </p>
            </div>

            <div>
              <Link
                to={`/catalogo?estilo=${encodeURIComponent(current.name)}`}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#48119a] hover:bg-[#5e18c8] text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md hover:translate-x-1"
              >
                <span>Ver prendas de este estilo</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Pestañas de categorías */}
        <div
          role="tablist"
          aria-label="Categorías de estilo"
          className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10"
        >
          {categories.map((item, index) => {
            const isSelected = selectedCategory === index
            return (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(index)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#15121b] shadow-lg scale-105'
                    : 'bg-white/5 border border-white/15 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={isSelected ? 'text-[#48119a] font-black' : 'text-white/40'}>
                  0{index + 1}
                </span>
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

