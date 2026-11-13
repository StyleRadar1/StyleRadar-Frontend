import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import './CategoriesGrid.css'

interface EditorialCategory {
  id: string
  number: string
  name: string
  subtitle: string
  badge: string
  description: string
  tags: string[]
  thumbnailSubtitle: string
  artColor: string
  image?: string
}

const categories: EditorialCategory[] = [
  {
    id: 'streetwear',
    number: '01',
    name: 'Streetwear',
    subtitle: 'Actitud de calle y autenticidad bogotana',
    badge: 'Estilo 01 · Tendencia urbana',
    description:
      'Inspirado en la cultura urbana de Bogotá: hoodies pesados, pantalones cargo, prendas estampadas y calzado deportivo de autor. Marcas independientes que visten la ciudad real.',
    tags: ['Hoodies oversized', 'Pantalones Cargo', 'Tenis de autor', 'Gorras y Beanies', 'Chaquetas bomber'],
    thumbnailSubtitle: 'Actitud de calle',
    artColor: '#30165c',
    image: '/img/representantes/C2.png',
  },
  {
    id: 'elegante',
    number: '02',
    name: 'Elegante',
    subtitle: 'Cortes estructurados y sobriedad contemporánea',
    badge: 'Estilo 02 · Sastrería & Formal',
    description:
      'Sastrería contemporánea hecha en Bogotá: blazers cruzados, pantalones de pinzas, abrigos de paño y marroquinería en cuero genuino. Siluetas nítidas para transitar de reuniones a planes nocturnos.',
    tags: ['Blazers sastre', 'Abrigos de paño', 'Pantalones de pinzas', 'Camisas lino/algodón', 'Marroquinería'],
    thumbnailSubtitle: 'Cortes estructurados',
    artColor: '#34204d',
    image: '/img/representantes/C1.png',
  },
  {
    id: 'casual',
    number: '03',
    name: 'Casual',
    subtitle: 'Básicos elevados y confort diario',
    badge: 'Estilo 03 · Esencial & Versátil',
    description:
      'Prendas versátiles diseñadas para el día a día en Bogotá: denim resistente, camisetas de alto gramaje, cárdigans y sobrecamisas en tonos neutros. Elegancia sin esfuerzo para cualquier clima.',
    tags: ['Jeans rectos', 'Sobrecamisas', 'Camisetas pesadas', 'Cárdigans', 'Buzos de cuello alto'],
    thumbnailSubtitle: 'Básicos elevados',
    artColor: '#29203c',
    image: '/img/representantes/C5.png',
  },
  {
    id: 'vintage',
    number: '04',
    name: 'Vintage',
    subtitle: 'Piezas con historia, carácter y nostalgia',
    badge: 'Estilo 04 · Retro & Segunda mano',
    description:
      'Moda rescatada de décadas pasadas: chaquetas de cuero desgastado, cortes noventeros, prendas de lana gruesa y estampados icónicos con calidad y durabilidad que ya no se fabrican hoy.',
    tags: ['Chaquetas de cuero', 'Jeans vintage 90s', 'Suéteres de lana', 'Camisas estampadas', 'Botas clásicas'],
    thumbnailSubtitle: 'Piezas con historia, carácter',
    artColor: '#37204c',
    image: '/img/representantes/C4.png',
  },
  {
    id: 'techwear',
    number: '05',
    name: 'Techwear',
    subtitle: 'Rendimiento técnico y funcionalidad urbana',
    badge: 'Estilo 05 · Deportivo & Funcional',
    description:
      'Prendas utilitarias para enfrentar los cambios de clima de Bogotá: telas impermeables, cortavientos ripstop, capas térmicas ligeras y bolsillos modulares. Moda pensada para caminar la ciudad.',
    tags: ['Cortavientos ripstop', 'Chaquetas impermeables', 'Joggers técnicos', 'Bolsos cruzados', 'Calzado repelente'],
    thumbnailSubtitle: 'Rendimiento técnico',
    artColor: '#28223f',
    image: '/img/representantes/C3.png',
  },
]

const markPath = 'M237 6 L234 6 L209 23 L195 83 L193 85 L147 30 L108 40 L138 147 L58 233 L68 496 L68 544 L62 621 L86 629 L128 639 L160 643 L190 643 L225 636 L245 627 L264 614 L284 594 L298 576 L292 568 L192 477 L210 347 L210 329 L194 169Z'
const lowerPathOne = 'M410 646 L380 631 L347 610 L344 610 L321 639 L295 663 L274 677 L258 685 L225 696 L189 701 L147 700 L108 694 L54 680 L43 749 L97 767 L128 774 L163 779 L221 779 L264 771 L283 765 L310 753 L330 741 L351 725 L369 708 L389 684 L407 656Z'
const lowerPathTwo = 'M549 696 L467 671 L452 699 L425 736 L396 766 L378 781 L345 803 L321 815 L286 828 L258 835 L202 841 L144 838 L75 824 L29 809 L20 845 L6 888 L43 905 L74 915 L117 924 L154 928 L214 928 L259 923 L303 914 L348 900 L403 875 L431 858 L467 830 L490 807 L507 786 L525 758 L541 724Z'

export function CategoriesGrid() {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const current = categories[selectedCategory]

  return (
    <section
      id="categorias"
      data-seccion="categorias"
      className="pe-sec pe-categorias pe-anchor"
      aria-labelledby="catHeading"
    >
      <div className="pe-in">
        <p className="pe-kicker">Explora por estilo · Bogotá</p>
        <h2 className="pe-h2" id="catHeading">
          Descubre tu identidad: <span>cinco estilos de la ciudad.</span>
        </h2>
        <p className="pe-lead">
          Elige el estilo que mejor te representa y te mostramos qué almacenes locales tienen
          prendas disponibles hoy en tu talla.
        </p>

        <div className="cat-showcase" id="cat-showcase-panel" role="tabpanel" aria-labelledby={`cat-tab-${current.id}`}>
          <div
            className="cat-media"
            data-art={current.id}
            style={{ '--cat-art-color': current.artColor } as CSSProperties}
          >
            {current.image ? (
              <img
                className="cat-big-img"
                src={current.image}
                alt={`Estilo ${current.name} en StyleRadar`}
              />
            ) : (
              <div className="cat-placeholder">
                <svg className="cat-placeholder-logo" viewBox="0 0 556 935" aria-hidden="true">
                  <path fill="#E8DCCB" d={markPath} />
                  <path fill="#B9B9CA" d={lowerPathOne} />
                  <path fill="#48119A" d={lowerPathTwo} />
                </svg>
                <span className="cat-placeholder-style">{current.name}</span>
                <span className="cat-placeholder-note">
                  Espacio para foto editorial de Kevin
                  <br />
                  <b>800 × 1000 px · Formato 4:5</b>
                </span>
              </div>
            )}
          </div>

          <div className="cat-info">
            <div className="cat-kicker-wrap">
              <span className="cat-badge">{current.badge}</span>
              <span className="cat-num">{current.number} / 05</span>
            </div>
            <h3 className="cat-title">{current.name}</h3>
            <p className="cat-subtitle">{current.subtitle}</p>
            <p className="cat-desc">{current.description}</p>

            <div className="cat-tags-wrap">
              <span className="cat-tags-label">Prendas clave en el radar:</span>
              <div className="cat-tags">
                {current.tags.map((tag) => (
                  <span className="cat-tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="cat-actions">
              <Link
                to={`/catalogo?estilo=${encodeURIComponent(current.name)}`}
                className="pe-explore-btn pe-big focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                <span>Ver prendas {current.name} en el catálogo</span>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="cat-thumbs-wrap">
          <div className="cat-thumbs-header">
            <h4 className="cat-thumbs-title">Explora los cinco estilos</h4>
            <span className="cat-thumbs-hint">Selecciona uno para destacarlo al centro</span>
          </div>
          <div
            className="cat-thumbs-grid"
            role="tablist"
            aria-label="Selector de estilos de StyleRadar"
          >
            {categories.map((category, index) => {
              const isActive = selectedCategory === index
              return (
                <button
                  className={`cat-thumb${isActive ? ' is-active' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]`}
                  key={category.id}
                  type="button"
                  id={`cat-tab-${category.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="cat-showcase-panel"
                  onClick={() => setSelectedCategory(index)}
                >
                  <figure className="cat-thumb-fig" data-art={category.id}>
                    {category.image ? (
                      <img src={category.image} alt="" aria-hidden="true" />
                    ) : (
                      <span className="cat-thumb-placeholder">{category.number}</span>
                    )}
                  </figure>
                  <span className="cat-thumb-body">
                    <span className="cat-thumb-meta">
                      <span className="cat-thumb-num">Estilo {category.number}</span>
                    </span>
                    <span className="cat-thumb-name">{category.name}</span>
                    <span className="cat-thumb-sub">{category.thumbnailSubtitle}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
