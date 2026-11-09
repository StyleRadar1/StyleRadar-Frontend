import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Logo } from '@/modules/core/design-system'

export interface StyleCategory {
  id: string
  num: string
  name: string
  subtitle: string
  badge: string
  desc: string
  tags: string[]
  stores: string
  catalogUrl: string
  image?: string
}

export const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: 'streetwear',
    num: '01',
    name: 'Streetwear',
    subtitle: 'Actitud de calle y autenticidad bogotana',
    badge: 'Estilo 01 · Tendencia urbana',
    desc: 'Inspirado en la cultura urbana de Bogotá: hoodies pesados, pantalones cargo, prendas estampadas y calzado deportivo de autor. Marcas independientes que visten la ciudad real.',
    tags: ['Hoodies oversized', 'Pantalones Cargo', 'Tenis de autor', 'Gorras y Beanies', 'Chaquetas bomber'],
    stores: 'The Local Lab · Luna Store · Kicks Local',
    catalogUrl: '/catalogo?estilo=Streetwear',
  },
  {
    id: 'elegante',
    num: '02',
    name: 'Elegante',
    subtitle: 'Cortes estructurados y sobriedad contemporánea',
    badge: 'Estilo 02 · Sastrería & Formal',
    desc: 'Sastrería contemporánea hecha en Bogotá: blazers cruzados, pantalones de pinzas, abrigos de paño y marroquinería en cuero genuino. Siluetas nítidas para transitar de reuniones a planes nocturnos.',
    tags: ['Blazers sastre', 'Abrigos de paño', 'Pantalones de pinzas', 'Camisas lino/algodón', 'Marroquinería'],
    stores: 'Nómada Studio · Sastrería Bogotá · Luna Store',
    catalogUrl: '/catalogo?estilo=Elegante',
  },
  {
    id: 'casual',
    num: '03',
    name: 'Casual',
    subtitle: 'Básicos elevados y confort diario',
    badge: 'Estilo 03 · Esencial & Versátil',
    desc: 'Prendas versátiles diseñadas para el día a día en Bogotá: denim resistente, camisetas de alto gramaje, cárdigans y sobrecamisas en tonos neutros. Elegancia sin esfuerzo para cualquier clima.',
    tags: ['Jeans rectos', 'Sobrecamisas', 'Camisetas pesadas', 'Cárdigans', 'Buzos de cuello alto'],
    stores: 'Norte Denim · The Local Lab · Ropero 57',
    catalogUrl: '/catalogo?estilo=Casual',
  },
  {
    id: 'vintage',
    num: '04',
    name: 'Vintage',
    subtitle: 'Piezas con historia, carácter y nostalgia',
    badge: 'Estilo 04 · Retro & Segunda mano',
    desc: 'Moda rescatada de décadas pasadas: chaquetas de cuero desgastado, cortes noventeros, prendas de lana gruesa y estampados icónicos con calidad y durabilidad que ya no se fabrican hoy.',
    tags: ['Chaquetas de cuero', 'Jeans vintage 90s', 'Suéteres de lana', 'Camisas estampadas', 'Botas clásicas'],
    stores: 'Ropero 57 · Segunda Vida · Catálogo Circular',
    catalogUrl: '/catalogo?estilo=Vintage',
  },
  {
    id: 'techwear',
    num: '05',
    name: 'Techwear',
    subtitle: 'Rendimiento técnico y funcionalidad urbana',
    badge: 'Estilo 05 · Deportivo & Funcional',
    desc: 'Prendas utilitarias para enfrentar los cambios de clima de Bogotá: telas impermeables, cortavientos ripstop, capas térmicas ligeras y bolsillos modulares. Moda pensada para caminar la ciudad.',
    tags: ['Cortavientos ripstop', 'Chaquetas impermeables', 'Joggers técnicos', 'Bolsos cruzados', 'Calzado repelente'],
    stores: 'Luna Store · Kicks Local · The Local Lab',
    catalogUrl: '/catalogo?estilo=Techwear',
  },
]

interface CategoriesSectionProps {
  categories?: StyleCategory[]
  onSelectCategory?: (category: StyleCategory) => void
}

export function CategoriesSection({ categories = STYLE_CATEGORIES, onSelectCategory }: CategoriesSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const activeCategory = categories[selectedIndex] ?? categories[0]

  const handleSelect = (index: number) => {
    setSelectedIndex(index)
    onSelectCategory?.(categories[index])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % categories.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + categories.length) % categories.length
    }

    if (nextIndex !== null) {
      e.preventDefault()
      handleSelect(nextIndex)
      const btn = document.getElementById(`cat-thumb-${nextIndex}`)
      btn?.focus()
    }
  }

  return (
    <section id="categorias" aria-labelledby="catSectionTitle" className="relative overflow-hidden bg-gradient-to-b from-[#151022] via-[#1a122e] to-[#1c1c1c] py-20 md:py-28">
      {/* Halos visuales de ambientación */}
      <div
        className="pointer-events-none absolute -left-36 top-1/4 h-[500px] w-[500px] rounded-full bg-violeta/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-1/4 h-[480px] w-[480px] rounded-full bg-arena/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Cabecera */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#B9B9CA]">Explora por estilo · Bogotá</p>
          <h2 id="catSectionTitle" className="mt-3 text-3xl font-extrabold tracking-tight text-blanco sm:text-4xl md:text-5xl">
            Descubre tu identidad: <span className="text-arena">cinco estilos de la ciudad.</span>
          </h2>
          <p className="mt-4 text-base text-[#cfcfdc]">
            Elige el estilo que mejor te representa y te mostramos qué almacenes locales tienen prendas disponibles hoy en tu talla.
          </p>
        </div>

        {/* Showcase principal (2 columnas: Izquierda imagen 4:5, Derecha explicación) */}
        <div className="mt-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)] lg:gap-14">
          {/* Columna Izquierda: Imagen grande o placeholder preparado para Kevin */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[22px] border border-arena/25 bg-[#241d35] shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
            {activeCategory.image ? (
              <img
                src={activeCategory.image}
                alt={`Estilo ${activeCategory.name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              /* Espacio reservado para foto editorial de Kevin (800x1000px, 4:5) */
              <div className="flex h-full w-full flex-col items-center justify-center bg-radial from-[#30165c] to-[#170d29] p-8 text-center text-blanco">
                <Logo className="h-16 w-auto opacity-80" />
                <span className="mt-5 text-2xl font-extrabold tracking-tight text-arena">{activeCategory.name}</span>
                <span className="mt-3 rounded-full border border-dashed border-arena/40 bg-white/5 px-4 py-1.5 text-xs text-[#B9B9CA]">
                  Espacio para foto editorial (4:5 · 800 × 1000 px)
                </span>
              </div>
            )}
          </div>

          {/* Columna Derecha: Explicación corta y detalles */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Badge tone="violeta">{activeCategory.badge}</Badge>
              <span className="text-xs font-extrabold text-[#B9B9CA]">{activeCategory.num} / 05</span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight text-blanco sm:text-4xl">{activeCategory.name}</h3>
            <p className="text-lg font-semibold text-arena">{activeCategory.subtitle}</p>
            <p className="text-sm leading-relaxed text-[#cfcfdc]">{activeCategory.desc}</p>

            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B9B9CA]">Prendas clave en el radar:</span>
              <div className="flex flex-wrap gap-2">
                {activeCategory.tags.map((tag, i) => (
                  <span key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-blanco">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link to={activeCategory.catalogUrl}>
                <Button variant="primario" className="gap-2">
                  <span>Ver prendas {activeCategory.name} en el catálogo</span>
                  <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Fila de miniaturas abajo */}
        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="mb-5 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#B9B9CA]">Explora los cinco estilos</h4>
            <span className="text-xs text-white/40">Selecciona uno para destacarlo al centro</span>
          </div>

          <div
            role="tablist"
            aria-label="Selector de estilos de StyleRadar"
            className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5"
          >
            {categories.map((cat, idx) => {
              const isActive = idx === selectedIndex
              return (
                <button
                  key={cat.id}
                  id={`cat-thumb-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelect(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`flex flex-col gap-2.5 rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? 'border-arena bg-[#2a1645] shadow-[0_8px_24px_rgba(72,17,154,0.45)]'
                      : 'border-white/10 bg-white/[0.03] text-[#B9B9CA] hover:-translate-y-1 hover:border-arena/40 hover:bg-violeta/20'
                  }`}
                >
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#231938]">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-radial from-[#381b69] to-[#190f2d] text-base font-extrabold text-arena">
                        {cat.num}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-[#B9B9CA]">Estilo {cat.num}</span>
                    <b className={`text-sm font-bold leading-tight ${isActive ? 'text-arena' : 'text-blanco'}`}>{cat.name}</b>
                    <span className="mt-0.5 truncate text-[11px] text-[#B9B9CA]">{cat.subtitle}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

