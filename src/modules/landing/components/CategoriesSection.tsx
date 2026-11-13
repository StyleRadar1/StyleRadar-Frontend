import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Logo } from '@/modules/core/design-system'

export interface StyleCategory {
  id: string
  name: string
  subtitle: string
  badge: string
  num: string
  desc: string
  tags: string[]
  catalogUrl: string
  image?: string
}

export const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: 'streetwear',
    name: 'Streetwear',
    subtitle: 'Actitud de calle y autenticidad bogotana',
    badge: 'Estilo 01 · Tendencia urbana',
    num: '01',
    desc: 'Inspirado en la cultura urbana de Bogotá: hoodies oversized, pantalones cargo, prendas estampadas y tenis de autor. Marcas locales independientes que visten la ciudad real.',
    tags: ['Hoodies oversized', 'Pantalones Cargo', 'Tenis de autor', 'Gorras y Beanies', 'Chaquetas bomber'],
    catalogUrl: '/catalogo?estilo=Streetwear',
    image: '/img/representantes/C2.png',
  },
  {
    id: 'elegante',
    name: 'Elegante',
    subtitle: 'Cortes estructurados y sobriedad contemporánea',
    badge: 'Estilo 02 · Sastrería & Formal',
    num: '02',
    desc: 'Sastrería contemporánea hecha en Bogotá: blazers cruzados, pantalones de pinzas, abrigos de paño y marroquinería en cuero genuino. Siluetas nítidas para transitar de reuniones a planes nocturnos.',
    tags: ['Blazers sastre', 'Abrigos de paño', 'Pantalones de pinzas', 'Camisas lino/algodón', 'Marroquinería'],
    catalogUrl: '/catalogo?estilo=Elegante',
    image: '/img/representantes/C1.png',
  },
  {
    id: 'casual',
    name: 'Casual',
    subtitle: 'Básicos elevados y confort diario',
    badge: 'Estilo 03 · Esencial & Versátil',
    num: '03',
    desc: 'Prendas versátiles diseñadas para el día a día en Bogotá: denim resistente, camisetas de alto gramaje, cárdigans y sobrecamisas en tonos neutros. Elegancia sin esfuerzo para cualquier clima.',
    tags: ['Jeans rectos', 'Sobrecamisas', 'Camisetas pesadas', 'Cárdigans', 'Buzos de cuello alto'],
    catalogUrl: '/catalogo?estilo=Casual',
    image: '/img/representantes/C5.png',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    subtitle: 'Piezas con historia, carácter y nostalgia',
    badge: 'Estilo 04 · Retro & Segunda mano',
    num: '04',
    desc: 'Moda rescatada de décadas pasadas: chaquetas de cuero desgastado, cortes noventeros, prendas de lana gruesa y estampados icónicos con calidad y durabilidad que ya no se fabrican hoy.',
    tags: ['Chaquetas de cuero', 'Jeans vintage 90s', 'Suéteres de lana', 'Camisas estampadas', 'Botas clásicas'],
    catalogUrl: '/catalogo?estilo=Vintage',
    image: '/img/representantes/C4.png',
  },
  {
    id: 'techwear',
    name: 'Techwear',
    subtitle: 'Rendimiento técnico y funcionalidad urbana',
    badge: 'Estilo 05 · Deportivo & Funcional',
    num: '05',
    desc: 'Prendas utilitarias para enfrentar los cambios de clima de Bogotá: telas impermeables, cortavientos ripstop, capas térmicas ligeras y bolsillos modulares. Moda pensada para caminar la ciudad.',
    tags: ['Cortavientos ripstop', 'Chaquetas impermeables', 'Joggers técnicos', 'Bolsos cruzados', 'Calzado repelente'],
    catalogUrl: '/catalogo?estilo=Techwear',
    image: '/img/representantes/C3.png',
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
    <section id="categorias" aria-labelledby="catSectionTitle" className="relative overflow-hidden bg-[var(--sr-bg,transparent)] py-20 md:py-28">
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
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--sr-hero-text-muted)]">Explora por estilo · Bogotá</p>
          <h2 id="catSectionTitle" className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--sr-hero-text)] sm:text-4xl md:text-5xl">
            Descubre tu identidad: <span className="text-[var(--sr-accent-text)]">cinco estilos de la ciudad.</span>
          </h2>
          <p className="mt-4 text-base text-[var(--sr-hero-text-muted)]">
            Elige el estilo que mejor te representa y te mostramos qué almacenes locales tienen prendas disponibles hoy en tu talla.
          </p>
        </div>

        {/* Showcase principal (2 columnas: Izquierda imagen 4:5, Derecha explicación) */}
        <div className="mt-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)] lg:gap-14">
          {/* Columna Izquierda: Imagen grande o placeholder preparado para Kevin */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] shadow-[0_20px_50px_var(--color-shadow-color,rgba(0,0,0,0.65))]">
            {activeCategory.image ? (
              <img
                src={activeCategory.image}
                alt={`Estilo ${activeCategory.name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              /* Espacio reservado para foto editorial de Kevin (800x1000px, 4:5) */
              <div className="flex h-full w-full flex-col items-center justify-center bg-radial from-[var(--sr-surface-raised)] to-[var(--sr-surface)] p-8 text-center text-[var(--sr-hero-text)]">
                <Logo className="h-16 w-auto opacity-80" />
                <span className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--sr-accent-text)]">{activeCategory.name}</span>
                <span className="mt-3 rounded-full border border-dashed border-[var(--sr-border-subtle)] bg-white/5 px-4 py-1.5 text-xs text-[var(--sr-hero-text-muted)]">
                  Espacio para foto editorial (4:5 · 800 × 1000 px)
                </span>
              </div>
            )}
          </div>

          {/* Columna Derecha: Explicación corta y detalles */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Badge tone="violeta">{activeCategory.badge}</Badge>
              <span className="text-xs font-extrabold text-[var(--sr-hero-text-muted)]">{activeCategory.num} / 05</span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight text-[var(--sr-hero-text)] sm:text-4xl">{activeCategory.name}</h3>
            <p className="text-lg font-semibold text-[var(--sr-accent-text)]">{activeCategory.subtitle}</p>
            <p className="text-sm leading-relaxed text-[var(--sr-hero-text-muted)]">{activeCategory.desc}</p>

            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--sr-hero-text-muted)]">Prendas clave en el radar:</span>
              <div className="flex flex-wrap gap-2">
                {activeCategory.tags.map((tag, i) => (
                  <span key={i} className="rounded-lg border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] px-3 py-1 text-xs text-[var(--sr-hero-text)]">
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
        <div className="mt-14 border-t border-[var(--sr-border-subtle)] pt-8">
          <div className="mb-5 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sr-hero-text-muted)]">Explora los cinco estilos</h4>
            <span className="text-xs text-[var(--sr-hero-text-muted)] opacity-60">Selecciona uno para destacarlo al centro</span>
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
                  className={`flex flex-col gap-2.5 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                    isActive
                      ? 'border-[var(--sr-accent)] bg-[var(--sr-surface-raised)] shadow-[0_8px_24px_var(--color-shadow-color,rgba(72,17,154,0.45))]'
                      : 'border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] text-[var(--sr-hero-text-muted)] hover:-translate-y-1 hover:border-[var(--sr-accent)]/40 hover:bg-[var(--sr-surface-raised)]'
                  }`}
                >
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-[var(--sr-surface-raised)]">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-radial from-[var(--sr-surface-raised)] to-[var(--sr-surface)] text-base font-extrabold text-[var(--sr-accent-text)]">
                        {cat.num}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-[var(--sr-hero-text-muted)]">Estilo {cat.num}</span>
                    <b className={`text-sm font-bold leading-tight ${isActive ? 'text-[var(--sr-accent-text)]' : 'text-[var(--sr-hero-text)]'}`}>{cat.name}</b>
                    <span className="mt-0.5 truncate text-[11px] text-[var(--sr-hero-text-muted)]">{cat.subtitle}</span>
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
