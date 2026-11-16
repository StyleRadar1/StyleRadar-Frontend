import { useState, useRef, useEffect } from 'react'

export interface SubCategoryFilter {
  label: string
  tipo?: string
  estilo?: string
  origen?: string
  texto?: string
}

export interface MegaMenuGroup {
  id: string
  label: string
  allLabel: string
  allFilter: { tipo?: string; estilo?: string; origen?: string; texto?: string }
  items: SubCategoryFilter[]
}

export interface MegaMenuTab {
  id: string
  label: string
  groups: MegaMenuGroup[]
}

const MEGA_MENU_TABS: MegaMenuTab[] = [
  {
    id: 'mujer',
    label: 'Mujer',
    groups: [
      {
        id: 'm-ropa',
        label: 'Ropa',
        allLabel: 'Ver todo en Ropa',
        allFilter: {},
        items: [
          { label: 'Buzos & Hoodies', tipo: 'Buzo' },
          { label: 'Chaquetas', tipo: 'Chaqueta' },
          { label: 'Sacos & Blazers', tipo: 'Saco' },
          { label: 'Pantalones & Jeans', tipo: 'Pantalón' },
          { label: 'Camisas & Blusas', texto: 'Camisa' },
          { label: 'Camisetas & Tops', texto: 'Camiseta' },
          { label: 'Vestidos & Faldas', texto: 'Vestido' },
          { label: 'Abrigos', texto: 'Abrigo' },
          { label: 'Conjuntos', texto: 'Conjunto' },
          { label: 'Ropa deportiva', estilo: 'Techwear' },
          { label: 'Sudaderas', texto: 'Sudadera' },
          { label: 'Trajes formales', estilo: 'Elegante' },
        ],
      },
      {
        id: 'm-acc',
        label: 'Accesorios',
        allLabel: 'Ver todo en Accesorios',
        allFilter: { tipo: 'Accesorio' },
        items: [
          { label: 'Bolsos & Totes', tipo: 'Accesorio', texto: 'Bolso' },
          { label: 'Gorras & Gorros', tipo: 'Accesorio', texto: 'Gorra' },
          { label: 'Gafas de sol', tipo: 'Accesorio', texto: 'Gafas' },
          { label: 'Billeteras', tipo: 'Accesorio', texto: 'Billetera' },
          { label: 'Cinturones', tipo: 'Accesorio', texto: 'Cinturón' },
          { label: 'Morrales & Mochilas', tipo: 'Accesorio', texto: 'Morral' },
          { label: 'Bufandas', tipo: 'Accesorio', texto: 'Bufanda' },
          { label: 'Cangureras', tipo: 'Accesorio', texto: 'Cangurera' },
        ],
      },
      {
        id: 'm-calzado',
        label: 'Zapatos',
        allLabel: 'Ver todo en Zapatos',
        allFilter: { tipo: 'Calzado' },
        items: [
          { label: 'Tenis & Sneakers', tipo: 'Calzado', texto: 'Tenis' },
          { label: 'Botas & Botines', tipo: 'Calzado', texto: 'Bota' },
          { label: 'Zapatos casuales', tipo: 'Calzado', texto: 'Casual' },
          { label: 'Mocasines & Sandalias', tipo: 'Calzado', texto: 'Mocasín' },
        ],
      },
      {
        id: 'm-estilos',
        label: 'Top estilos',
        allLabel: 'Ver todos los estilos',
        allFilter: {},
        items: [
          { label: 'Streetwear urbano', estilo: 'Streetwear' },
          { label: 'Vintage & Retro', estilo: 'Vintage' },
          { label: 'Casual esencial', estilo: 'Casual' },
          { label: 'Elegante & Sastre', estilo: 'Elegante' },
          { label: 'Techwear & Técnico', estilo: 'Techwear' },
        ],
      },
    ],
  },
  {
    id: 'hombre',
    label: 'Hombre',
    groups: [
      {
        id: 'h-ropa',
        label: 'Ropa',
        allLabel: 'Ver todo en Ropa',
        allFilter: {},
        items: [
          { label: 'Buzos & Hoodies', tipo: 'Buzo' },
          { label: 'Chaquetas', tipo: 'Chaqueta' },
          { label: 'Sacos & Blazers', tipo: 'Saco' },
          { label: 'Pantalones & Jeans', tipo: 'Pantalón' },
          { label: 'Camisas', texto: 'Camisa' },
          { label: 'Camisetas', texto: 'Camiseta' },
          { label: 'Bermudas', texto: 'Bermuda' },
          { label: 'Abrigos', texto: 'Abrigo' },
          { label: 'Conjuntos', texto: 'Conjunto' },
          { label: 'Ropa deportiva', estilo: 'Techwear' },
          { label: 'Sudaderas', texto: 'Sudadera' },
          { label: 'Trajes formales', estilo: 'Elegante' },
        ],
      },
      {
        id: 'h-acc',
        label: 'Accesorios',
        allLabel: 'Ver todo en Accesorios',
        allFilter: { tipo: 'Accesorio' },
        items: [
          { label: 'Gorras', tipo: 'Accesorio', texto: 'Gorra' },
          { label: 'Gorros & Beanies', tipo: 'Accesorio', texto: 'Gorro' },
          { label: 'Gafas de sol', tipo: 'Accesorio', texto: 'Gafas' },
          { label: 'Billeteras', tipo: 'Accesorio', texto: 'Billetera' },
          { label: 'Cinturones', tipo: 'Accesorio', texto: 'Cinturón' },
          { label: 'Morrales & Mochilas', tipo: 'Accesorio', texto: 'Morral' },
          { label: 'Cangureras', tipo: 'Accesorio', texto: 'Cangurera' },
          { label: 'Relojes', tipo: 'Accesorio', texto: 'Reloj' },
        ],
      },
      {
        id: 'h-calzado',
        label: 'Zapatos',
        allLabel: 'Ver todo en Zapatos',
        allFilter: { tipo: 'Calzado' },
        items: [
          { label: 'Sneakers & Tenis', tipo: 'Calzado', texto: 'Tenis' },
          { label: 'Botas de combate & cuero', tipo: 'Calzado', texto: 'Bota' },
          { label: 'Zapatos casuales', tipo: 'Calzado', texto: 'Casual' },
          { label: 'Mocasines', tipo: 'Calzado', texto: 'Mocasín' },
        ],
      },
      {
        id: 'h-estilos',
        label: 'Top estilos',
        allLabel: 'Ver todos los estilos',
        allFilter: {},
        items: [
          { label: 'Streetwear urbano', estilo: 'Streetwear' },
          { label: 'Vintage auténtico', estilo: 'Vintage' },
          { label: 'Casual esencial', estilo: 'Casual' },
          { label: 'Elegante & Blazer', estilo: 'Elegante' },
          { label: 'Techwear futurista', estilo: 'Techwear' },
        ],
      },
    ],
  },
  {
    id: 'ropa',
    label: 'Ropa',
    groups: [
      {
        id: 'r-superior',
        label: 'Prendas superiores',
        allLabel: 'Ver todo en Superiores',
        allFilter: {},
        items: [
          { label: 'Buzos & Hoodies', tipo: 'Buzo' },
          { label: 'Sacos & Blazers', tipo: 'Saco' },
          { label: 'Camisas', texto: 'Camisa' },
          { label: 'Camisetas gráficas', texto: 'Camiseta' },
          { label: 'Suéteres de lana', texto: 'Suéter' },
        ],
      },
      {
        id: 'r-inferior',
        label: 'Prendas inferiores',
        allLabel: 'Ver todo en Inferiores',
        allFilter: { tipo: 'Pantalón' },
        items: [
          { label: 'Pantalones de pinzas', tipo: 'Pantalón' },
          { label: 'Jeans & Denim', tipo: 'Pantalón', texto: 'Jean' },
          { label: 'Pantalones cargo', tipo: 'Pantalón', texto: 'Cargo' },
          { label: 'Bermudas & Shorts', texto: 'Bermuda' },
          { label: 'Sudaderas', texto: 'Sudadera' },
        ],
      },
      {
        id: 'r-abrigos',
        label: 'Chaquetas & Abrigos',
        allLabel: 'Ver todo en Chaquetas',
        allFilter: { tipo: 'Chaqueta' },
        items: [
          { label: 'Chaquetas de cuero vintage', tipo: 'Chaqueta', texto: 'Cuero' },
          { label: 'Bombers & Nylon', tipo: 'Chaqueta', texto: 'Nylon' },
          { label: 'Abrigos de paño', tipo: 'Chaqueta', texto: 'Abrigo' },
          { label: 'Cortavientos deportivos', tipo: 'Chaqueta' },
        ],
      },
    ],
  },
  {
    id: 'accesorios',
    label: 'Accesorios',
    groups: [
      {
        id: 'acc-cabeza',
        label: 'Para la cabeza',
        allLabel: 'Ver todo en Gorras y Gorros',
        allFilter: { tipo: 'Accesorio' },
        items: [
          { label: 'Gorras street', tipo: 'Accesorio', texto: 'Gorra' },
          { label: 'Gorros & Beanies', tipo: 'Accesorio', texto: 'Gorro' },
          { label: 'Sombreros', tipo: 'Accesorio', texto: 'Sombrero' },
        ],
      },
      {
        id: 'acc-bolsos',
        label: 'Bolsos & Billeteras',
        allLabel: 'Ver todo en Bolsos',
        allFilter: { tipo: 'Accesorio' },
        items: [
          { label: 'Morrales de ciudad', tipo: 'Accesorio', texto: 'Morral' },
          { label: 'Billeteras de cuero', tipo: 'Accesorio', texto: 'Billetera' },
          { label: 'Tote bags', tipo: 'Accesorio', texto: 'Tote' },
          { label: 'Cangureras urbanas', tipo: 'Accesorio', texto: 'Cangurera' },
        ],
      },
      {
        id: 'acc-complementos',
        label: 'Complementos',
        allLabel: 'Ver todos los complementos',
        allFilter: { tipo: 'Accesorio' },
        items: [
          { label: 'Gafas de sol', tipo: 'Accesorio', texto: 'Gafas' },
          { label: 'Cinturones', tipo: 'Accesorio', texto: 'Cinturón' },
          { label: 'Bufandas de invierno', tipo: 'Accesorio', texto: 'Bufanda' },
          { label: 'Relojes urbanos', tipo: 'Accesorio', texto: 'Reloj' },
        ],
      },
    ],
  },
  {
    id: 'calzado',
    label: 'Calzado',
    groups: [
      {
        id: 'c-todo',
        label: 'Tipos de calzado',
        allLabel: 'Ver todo en Calzado',
        allFilter: { tipo: 'Calzado' },
        items: [
          { label: 'Sneakers & Tenis urbanos', tipo: 'Calzado', texto: 'Tenis' },
          { label: 'Botas de combate & cuero', tipo: 'Calzado', texto: 'Bota' },
          { label: 'Zapatos formales', tipo: 'Calzado', estilo: 'Elegante' },
          { label: 'Mocasines casuales', tipo: 'Calzado' },
          { label: 'Sandalias de verano', tipo: 'Calzado' },
        ],
      },
    ],
  },
  {
    id: 'estilos',
    label: 'Estilos',
    groups: [
      {
        id: 'e-todos',
        label: 'Líneas de estilo',
        allLabel: 'Ver todos los estilos',
        allFilter: {},
        items: [
          { label: 'Streetwear (Cultura de calle)', estilo: 'Streetwear' },
          { label: 'Vintage (Prendas con historia)', estilo: 'Vintage' },
          { label: 'Casual (Esenciales versátiles)', estilo: 'Casual' },
          { label: 'Elegante (Sastrería contemporánea)', estilo: 'Elegante' },
          { label: 'Techwear (Diseño técnico y funcional)', estilo: 'Techwear' },
        ],
      },
    ],
  },
  {
    id: 'segunda-mano',
    label: 'Segunda Mano',
    groups: [
      {
        id: 'sm-todo',
        label: 'Segunda vida',
        allLabel: 'Ver todo Segunda Mano',
        allFilter: { origen: 'segunda-mano' },
        items: [
          { label: 'Prendas vintage únicas', origen: 'segunda-mano', estilo: 'Vintage' },
          { label: 'Streetwear circular', origen: 'segunda-mano', estilo: 'Streetwear' },
          { label: 'Chaquetas rescatadas', origen: 'segunda-mano', tipo: 'Chaqueta' },
          { label: 'Jeans de segunda vida', origen: 'segunda-mano', tipo: 'Pantalón' },
          { label: 'Sacos y Blazers vintage', origen: 'segunda-mano', tipo: 'Saco' },
        ],
      },
    ],
  },
  {
    id: 'descuentos',
    label: 'Descuentos & Especiales',
    groups: [
      {
        id: 'desc-todo',
        label: 'Oportunidades',
        allLabel: 'Ver todas las ofertas y piezas especiales',
        allFilter: {},
        items: [
          { label: 'Prendas con 20% y 30% OFF', texto: 'cuero' },
          { label: 'Drops exclusivos de tiendas', texto: 'nylon' },
          { label: 'Bajo stock (Últimas piezas)', texto: 'verde' },
          { label: 'Favoritos de la comunidad', estilo: 'Streetwear' },
        ],
      },
    ],
  },
]

interface CatalogMegaMenuProps {
  onSelectFilter: (filter: { tipo?: string; estilo?: string; origen?: string; texto?: string }) => void
  activeTipo?: string
  activeEstilo?: string
  activeOrigen?: string
}

export function CatalogMegaMenu({
  onSelectFilter,
  activeTipo,
  activeEstilo,
  activeOrigen,
}: CatalogMegaMenuProps) {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string>('')
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuContainerRef = useRef<HTMLDivElement>(null)

  const activeTab = MEGA_MENU_TABS.find((t) => t.id === hoveredTabId)

  // Cuando cambia la pestaña hover, sincronizar el primer grupo
  useEffect(() => {
    if (activeTab && activeTab.groups.length > 0) {
      setActiveGroupId(activeTab.groups[0].id)
    }
  }, [hoveredTabId, activeTab])

  const handleTabMouseEnter = (tabId: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setHoveredTabId(tabId)
  }

  const handleMouseLeaveContainer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = setTimeout(() => {
      setHoveredTabId(null)
    }, 180)
  }

  const handleMouseEnterDropdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handleItemClick = (filter: { tipo?: string; estilo?: string; origen?: string; texto?: string }) => {
    onSelectFilter(filter)
    setHoveredTabId(null)
  }

  const currentGroup =
    activeTab?.groups.find((g) => g.id === activeGroupId) ?? activeTab?.groups[0]

  return (
    <div
      ref={menuContainerRef}
      className="sr-megamenu-wrapper relative mb-5 z-40"
      onMouseLeave={handleMouseLeaveContainer}
    >
      {/* 1. BARRA HORIZONTAL DE CATEGORÍAS (ESTILO GOTRENDIER) */}
      <nav
        className="sr-megamenu-bar flex items-center gap-1 sm:gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-2.5 pt-1 px-1 text-sm font-medium text-[var(--color-text)] scrollbar-none"
        aria-label="Filtros rápidos por categoría"
      >
        {MEGA_MENU_TABS.map((tab) => {
          const isHovered = hoveredTabId === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onMouseEnter={() => handleTabMouseEnter(tab.id)}
              onClick={() => handleTabMouseEnter(tab.id)}
              className={`relative whitespace-nowrap px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-150 rounded-lg ${
                isHovered
                  ? 'text-[var(--color-accent)] bg-[var(--color-surface-raised)]/70'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              aria-expanded={isHovered}
            >
              <span>{tab.label}</span>
              {isHovered && (
                <span
                  className="absolute bottom-[-10px] left-0 right-0 h-[2.5px] bg-[var(--color-accent)] rounded-full transition-all"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* 2. MEGA-MENÚ DESPLEGABLE EN HOVER (FILTROS Y SUBFILTROS) */}
      {activeTab && currentGroup && (
        <div
          className="sr-megamenu-dropdown absolute left-0 right-0 top-full mt-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-2xl backdrop-blur-2xl p-5 text-[var(--color-text)] transition-all animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={handleMouseEnterDropdown}
          role="region"
          aria-label={`Subfiltros de ${activeTab.label}`}
        >
          <div className="flex flex-col md:flex-row gap-6 min-h-[14rem]">
            {/* Columna izquierda: Categorías padre / Grupos con flecha indicadora */}
            {activeTab.groups.length > 1 && (
              <div
                className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-[var(--color-border)]/60 pr-0 md:pr-4 space-y-1"
                role="tablist"
                aria-label="Grupos de categorías"
              >
                {activeTab.groups.map((grp) => {
                  const isSelected = grp.id === currentGroup.id
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onMouseEnter={() => setActiveGroupId(grp.id)}
                      onClick={() => setActiveGroupId(grp.id)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs sm:text-sm rounded-xl font-semibold transition-all ${
                        isSelected
                          ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] font-bold shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]/50'
                      }`}
                    >
                      <span>{grp.label}</span>
                      <svg
                        className={`h-4 w-4 transition-transform ${isSelected ? 'translate-x-0.5 text-[var(--color-accent)]' : 'text-transparent'}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Área derecha: Subcategorías en grid con enlace destacado "Ver todo" */}
            <div className="flex-1 min-w-0">
              {/* Enlace destacado en negrita "Ver todo en [Grupo]" */}
              <div className="mb-4 pb-2 border-b border-[var(--color-border)]/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleItemClick(currentGroup.allFilter)}
                  className="text-sm font-bold text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1.5"
                >
                  <span>{currentGroup.allLabel}</span>
                  <span className="text-xs text-[var(--color-accent)]">→</span>
                </button>
                <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                  {currentGroup.items.length} opciones
                </span>
              </div>

              {/* Grid de subfiltros (estilo GoTrendier) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2.5 gap-x-4">
                {currentGroup.items.map((subItem) => {
                  const isCurrent =
                    (subItem.tipo && subItem.tipo === activeTipo) ||
                    (subItem.estilo && subItem.estilo === activeEstilo) ||
                    (subItem.origen && subItem.origen === activeOrigen)

                  return (
                    <button
                      key={subItem.label}
                      type="button"
                      onClick={() => handleItemClick(subItem)}
                      className={`text-left text-xs sm:text-sm py-1.5 px-2 rounded-lg transition-colors truncate ${
                        isCurrent
                          ? 'font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                          : 'text-[var(--color-text)]/85 hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]/70'
                      }`}
                      title={subItem.label}
                    >
                      {subItem.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
