import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCOP } from '@/modules/core/utils/format'

export type RackCategory = 'Todos' | 'Buzo' | 'Chaqueta' | 'Saco' | 'Pantalón'

export interface RackItem {
  id: string
  name: string
  price: number
  category: Exclude<RackCategory, 'Todos'>
  badge?: string
  image: string
}

export const MOCK_RACK_DATA: RackItem[] = [
  {
    id: 'p1',
    name: 'Blazer Oversize Grafito',
    price: 189000,
    category: 'Saco',
    image: '/img/productos/blazer-oversize.jpg',
  },
  {
    id: 'p3',
    name: 'Hoodie Azul Noche',
    price: 119000,
    category: 'Buzo',
    badge: '-20%',
    image: '/img/productos/hoodie-azul-noche.jpg',
  },
  {
    id: 'p5',
    name: 'Chaqueta de Nylon',
    price: 210000,
    category: 'Chaqueta',
    image: '/img/productos/chaqueta-de-nylon.jpg',
  },
  {
    id: 'p11',
    name: 'Hoodie Verde Bosque',
    price: 165000,
    category: 'Buzo',
    badge: 'QUEDAN 2',
    image: '/img/productos/hoodie-azul-noche.jpg',
  },
  {
    id: 'p8',
    name: 'Suéter de Canalé Crudo',
    price: 99000,
    category: 'Saco',
    image: '/img/productos/sueter-de-canale-crudo.jpg',
  },
  {
    id: 'p6',
    name: 'Chaqueta de Cuero Vintage',
    price: 320000,
    category: 'Chaqueta',
    badge: 'NUEVO',
    image: '/img/productos/r2c3-chaqueta-cuero.jpg',
  },
  {
    id: 'p2',
    name: 'Pantalón de Pinzas',
    price: 139000,
    category: 'Pantalón',
    image: '/img/productos/pantalon-de-pinzas.jpg',
  },
]

const CATEGORIES: { id: RackCategory; label: string }[] = [
  { id: 'Todos', label: 'NUEVA COLECCIÓN' },
  { id: 'Buzo', label: 'BUZOS' },
  { id: 'Chaqueta', label: 'CHAQUETAS' },
  { id: 'Saco', label: 'SACOS' },
  { id: 'Pantalón', label: 'PANTALONES' },
]

interface RackCarouselProps {
  items?: RackItem[]
  variant?: 'white' | 'arena'
  activeCategory?: string
  onCategoryChange?: (category: string) => void
}

export function RackCarousel({
  items = MOCK_RACK_DATA,
  variant = 'white',
  activeCategory,
  onCategoryChange,
}: RackCarouselProps) {
  const [internalCategory, setInternalCategory] = useState<RackCategory>('Todos')
  const [selectedId, setSelectedId] = useState<string>('p11')
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  const currentCategory = (activeCategory as RackCategory) ?? internalCategory

  const handleSelectCategory = (cat: RackCategory) => {
    setInternalCategory(cat)
    onCategoryChange?.(cat)
  }

  const filteredItems =
    currentCategory === 'Todos' ||
    !CATEGORIES.some((c) => c.id === currentCategory)
      ? items
      : items.filter((item) => item.category === currentCategory)

  const displayItems = filteredItems.length > 0 ? filteredItems : items

  const selectedItem =
    displayItems.find((item) => item.id === selectedId) ?? displayItems[0]

  return (
    <section
      aria-label="Perchero de colección"
      className={`w-full py-12 font-sans text-[#262626] ${
        variant === 'arena' ? 'bg-[#E8DCCB]' : 'bg-white'
      }`}
    >
      {/* 1. NAVEGACIÓN / FILTROS SUPERIORES MINIMALISTAS */}
      <nav
        aria-label="Categorías del perchero"
        className="mb-10 flex flex-wrap items-center justify-center gap-3 px-4 text-xs tracking-[0.18em] uppercase"
      >
        {CATEGORIES.map((cat, index) => {
          const isActive = currentCategory === cat.id
          return (
            <div key={cat.id} className="flex items-center gap-3">
              {index > 0 && (
                <span className="text-gray-300 select-none" aria-hidden="true">
                  |
                </span>
              )}
              <button
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`cursor-pointer transition-colors duration-200 focus:outline-none ${
                  isActive
                    ? 'font-semibold text-[#48119A]'
                    : 'font-normal text-gray-400 hover:text-[#262626]'
                }`}
              >
                {cat.label}
              </button>
            </div>
          )
        })}
      </nav>

      {/* 2. EL PERCHERO (LÍNEA CENTRAL DELGADA + CARRUSEL DE PRENDAS) */}
      <div className="relative w-full">
        {/* Línea horizontal continua y muy delgada de lado a lado */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-6 z-10 h-px w-full bg-gray-300"
        />

        {/* Contenedor con scroll horizontal suave sin barra de scroll */}
        <div className="relative z-20 flex items-start justify-start md:justify-center gap-6 sm:gap-10 overflow-x-auto scroll-smooth px-6 sm:px-12 pt-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <AnimatePresence mode="popLayout">
            {displayItems.map((item) => {
              const isSelected = selectedItem?.id === item.id

              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(item.id)
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={item.name}
                  className={`group relative shrink-0 cursor-pointer select-none transition-all duration-200 focus:outline-none ${
                    isSelected
                      ? 'w-44 sm:w-56 md:w-64'
                      : 'w-28 sm:w-32 md:w-36'
                  }`}
                >
                  {/* Marco plano 2D: borde fino y sólido en violeta (#48119A) al estar seleccionado o en hover */}
                  <div
                    className={`relative w-full bg-transparent p-2 transition-colors duration-150 ${
                      isSelected
                        ? 'border border-[#48119A]'
                        : 'border border-transparent hover:border-[#48119A]/50'
                    }`}
                  >
                    {/* Pestaña superior plana en violeta (#48119A) */}
                    {isSelected && (
                      <div className="absolute -top-6 -left-px bg-[#48119A] px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white">
                        Prenda
                      </div>
                    )}

                    {/* Etiqueta flotante superpuesta ("-20%", "QUEDAN 2", "NUEVO") */}
                    {item.badge && (
                      <span
                        className={`absolute top-3 left-1/2 z-20 -translate-x-1/2 -rotate-6 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          item.badge === 'NUEVO'
                            ? 'bg-[#E8DCCB] text-[#262626]'
                            : 'bg-[#262626] text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Imagen de la prenda alineada arriba tocando la línea horizontal */}
                    <div className="flex h-48 sm:h-60 md:h-72 w-full items-start justify-center">
                      {!failedImages[item.id] ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [item.id]: true,
                            }))
                          }
                          className="h-full w-full object-contain object-top"
                        />
                      ) : (
                        <div className="h-full w-24 bg-gray-100" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. DETALLE INFERIOR MINIMALISTA DE LA PRENDA SELECCIONADA */}
      {selectedItem && (
        <div className="mt-6 flex flex-col items-center justify-center px-4 text-center">
          <h3 className="text-sm sm:text-base font-medium text-[#262626]">
            {selectedItem.name}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatCOP(selectedItem.price)}
          </p>

          <Link
            to={`/catalogo/${selectedItem.id}`}
            className="mt-4 inline-block rounded-full border border-gray-300 bg-[#E8DCCB]/50 px-6 py-2 text-xs font-medium text-[#262626] transition-colors duration-150 hover:border-[#48119A] hover:text-[#48119A]"
          >
            Ver en Tienda
          </Link>
        </div>
      )}
    </section>
  )
}

export default RackCarousel
