import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '@/modules/core/design-system'

export type CyclePhase = 'tiendas' | 'segunda' | 'fundaciones'

interface PhaseData {
  key: CyclePhase
  num: string
  phaseTitle: string
  subtitle: string
  badge: string
  title: string
  description: string
  stats: { value: string; label: string }[]
  primaryAction: { label: string; to?: string; onClick?: () => void }
  secondaryAction: { label: string; to: string }
  previewCards: {
    title: string
    subtitle: string
    tag: string
    badgeRight: string
    image: string
  }[]
}

const PHASES: PhaseData[] = [
  {
    key: 'tiendas',
    num: '01',
    phaseTitle: 'Comprar local',
    subtitle: 'Boutiques y almacenes',
    badge: 'Comprar · Tiendas locales',
    title: 'Moda independiente en los barrios de Bogotá',
    description:
      'Conectamos boutiques y marcas emergentes de Chapinero, Usaquén, Teusaquillo y el Centro. Consulta su inventario real y pruébate las prendas en tu talla antes de desplazarte.',
    stats: [
      { value: '40+', label: 'Tiendas verificadas en el radar de Bogotá' },
      { value: '100%', label: 'Disponibilidad por talla en tiempo real' },
    ],
    primaryAction: { label: 'Registrar mi tienda', to: '/registro?rol=tienda' },
    secondaryAction: { label: 'Ver mapa de tiendas', to: '/mapa' },
    previewCards: [
      {
        title: 'Luna Store',
        subtitle: 'Chapinero · Ropa deportiva y técnica urbana',
        tag: 'A 1,2 km · Abierto hoy',
        badgeRight: '★ 4.8',
        image: '/assets/img/general/s-luna.jpg',
      },
      {
        title: 'Nómada Studio',
        subtitle: 'Usaquén · Sastrería contemporánea y cuero',
        tag: 'A 3,4 km · Marcas locales',
        badgeRight: '★ 4.7',
        image: '/assets/img/general/s-nomada.jpg',
      },
      {
        title: 'The Local Lab',
        subtitle: 'Zona G · Punto, denim y accesorios de autor',
        tag: 'A 0,8 km · Colección nueva',
        badgeRight: '★ 4.9',
        image: '/assets/img/general/s-lab.jpg',
      },
    ],
  },
  {
    key: 'segunda',
    num: '02',
    phaseTitle: 'Segunda vida',
    subtitle: 'Moda circular entre personas',
    badge: 'Circular · Segunda vida',
    title: 'Tu ropa merece seguir viviendo nuevas historias',
    description:
      'La ropa en excelente estado que ya no usas no tiene por qué acumularse en el clóset. Súbela con fotos, pon tu precio y acuerda la entrega por chat directo con compradores de tu ciudad.',
    stats: [
      { value: '-70%', label: 'Menos huella de carbono al alargar la vida útil' },
      { value: '0%', label: 'Sin comisiones ocultas: trato de persona a persona' },
    ],
    primaryAction: { label: 'Publicar prenda', to: '/segunda-mano/publicar' },
    secondaryAction: { label: 'Ver segunda mano', to: '/catalogo?origen=Segunda%20mano' },
    previewCards: [
      {
        title: 'Jean recto azul claro',
        subtitle: 'Levi’s · Talla 30 · Estado impecable',
        tag: 'Vendedor en Chapinero',
        badgeRight: '$85.000',
        image: '/assets/img/general/second.jpg',
      },
      {
        title: 'Chaqueta bomber vintage',
        subtitle: 'Cuero genuino · Talla M · Muy buen estado',
        tag: 'Vendedor en Teusaquillo',
        badgeRight: '$120.000',
        image: '/assets/img/general/r1.jpg',
      },
      {
        title: 'Suéter trenzado crudo',
        subtitle: 'Lana térmica · Talla S · Usado 2 veces',
        tag: 'Vendedor en Cedritos',
        badgeRight: '$65.000',
        image: '/assets/img/general/r3.jpg',
      },
    ],
  },
  {
    key: 'fundaciones',
    num: '03',
    phaseTitle: 'Donar con propósito',
    subtitle: 'Fundaciones aliadas',
    badge: 'Donar · Impacto social',
    title: 'Impacto social directo sin intermediarios',
    description:
      'Canalizamos donaciones solidarias hacia fundaciones aliadas en Bogotá. Consulta en tiempo real qué categorías y tallas necesitan con más urgencia y programa la recogida o entrega.',
    stats: [
      { value: '100%', label: 'Trazabilidad directa a comunidades vulnerables' },
      { value: '3', label: 'Fundaciones aliadas con puntos de recogida' },
    ],
    primaryAction: { label: 'Registrar fundación', to: '/registro?rol=fundacion' },
    secondaryAction: { label: 'Donar una prenda', to: '/donar' },
    previewCards: [
      {
        title: 'Fundación Abrigo',
        subtitle: 'Teusaquillo · Personas mayores y habitantes de calle',
        tag: 'Urgente: Chaquetas y sacos',
        badgeRight: 'Donación',
        image: '/assets/img/general/f-abrigo.jpg',
      },
      {
        title: 'Manos Limpias',
        subtitle: 'Kennedy · Madres cabeza de familia y niñez',
        tag: 'Urgente: Ropa infantil y tenis',
        badgeRight: 'Donación',
        image: '/assets/img/general/f-manos.jpg',
      },
      {
        title: 'Fundación Dignidad',
        subtitle: 'Suba · Familias en situación de vulnerabilidad',
        tag: 'Urgente: Pantalones y cobijas',
        badgeRight: 'Donación',
        image: '/assets/img/general/f-suba.jpg',
      },
    ],
  },
]

interface ClothingCycleSectionProps {
  onSelectPhase?: (phase: CyclePhase) => void
}

export function ClothingCycleSection({ onSelectPhase }: ClothingCycleSectionProps) {
  const [activeTab, setActiveTab] = useState<CyclePhase>('tiendas')

  const currentPhase = PHASES.find((p) => p.key === activeTab) ?? PHASES[0]

  const handleTabChange = (key: CyclePhase) => {
    setActiveTab(key)
    onSelectPhase?.(key)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % PHASES.length
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + PHASES.length) % PHASES.length
    }

    if (nextIndex !== null) {
      e.preventDefault()
      const nextKey = PHASES[nextIndex].key
      handleTabChange(nextKey)
      const tabEl = document.getElementById(`cycle-tab-${nextKey}`)
      tabEl?.focus()
    }
  }

  return (
    <section id="ciclo" aria-labelledby="cicloSectionTitle" className="relative overflow-hidden bg-[var(--sr-bg)] py-20 md:py-28">
      {/* Halo ambiental */}
      <div
        className="pointer-events-none absolute -right-36 -top-36 h-[31.25rem] w-[31.25rem] rounded-full bg-violeta/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Cabecera */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--sr-hero-text-muted)]">Moda circular · Bogotá</p>
          <h2 id="cicloSectionTitle" className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--sr-hero-text)] sm:text-4xl md:text-5xl">
            El ecosistema de StyleRadar: <span className="text-[var(--sr-accent-text)]">tres formas de vivir la moda.</span>
          </h2>
          <p className="mt-4 text-base text-[var(--sr-hero-text-muted)]">
            En StyleRadar ninguna prenda se pierde: puedes estrenar talento local en boutiques de barrio, hacer circular lo que ya no usas
            entre personas o donarlo con propósito a fundaciones de Bogotá.
          </p>
        </div>

        {/* Diagrama del ciclo continuo (Tabs) */}
        <div className="my-10 rounded-2xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)]/80 p-2.5 backdrop-blur-md">
          <div role="tablist" aria-label="Ciclo de la ropa en StyleRadar" className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {PHASES.map((p, i) => {
              const isActive = activeTab === p.key
              return (
                <button
                  key={p.key}
                  id={`cycle-tab-${p.key}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`cycle-panel-${p.key}`}
                  onClick={() => handleTabChange(p.key)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                    isActive
                      ? 'border border-[var(--sr-accent-text)]/40 bg-[var(--sr-surface-raised)] text-[var(--sr-hero-text)] shadow-[0_8px_24px_var(--color-shadow-color,rgba(72,17,154,0.35))]'
                      : 'text-[var(--sr-hero-text-muted)] hover:bg-white/5 hover:text-[var(--sr-hero-text)]'
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                      isActive ? 'bg-[var(--sr-accent)] text-[var(--sr-text-on-accent,#fff)]' : 'border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] text-[var(--sr-hero-text-muted)]'
                    }`}
                  >
                    {p.num}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight">{p.phaseTitle}</span>
                    <span className="text-xs opacity-75">{p.subtitle}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel del ciclo activo */}
        <div
          id={`cycle-panel-${currentPhase.key}`}
          role="tabpanel"
          aria-labelledby={`cycle-tab-${currentPhase.key}`}
          className="grid gap-8 lg:grid-cols-2"
        >
          {/* Detalles y Acciones */}
          <div className="flex flex-col gap-5 rounded-2xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] p-6 sm:p-8">
            <Badge tone="violeta">{currentPhase.badge}</Badge>
            <h3 className="text-2xl font-bold tracking-tight text-[var(--sr-hero-text)] sm:text-3xl">{currentPhase.title}</h3>
            <p className="text-sm leading-relaxed text-[var(--sr-hero-text-muted)]">{currentPhase.description}</p>

            <div className="grid grid-cols-1 gap-4 border-y border-[var(--sr-border-subtle)] py-5 sm:grid-cols-2">
              {currentPhase.stats.map((s, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-2xl font-extrabold text-[var(--sr-accent-text)] sm:text-3xl">{s.value}</span>
                  <span className="mt-1 text-xs text-[var(--sr-hero-text-muted)]">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {currentPhase.primaryAction.to ? (
                <Link to={currentPhase.primaryAction.to}>
                  <Button variant="primario">{currentPhase.primaryAction.label}</Button>
                </Link>
              ) : (
                <Button variant="primario" onClick={currentPhase.primaryAction.onClick}>
                  {currentPhase.primaryAction.label}
                </Button>
              )}
              <Link to={currentPhase.secondaryAction.to}>
                <Button variant="secundario">{currentPhase.secondaryAction.label}</Button>
              </Link>
            </div>
          </div>

          {/* Tarjetas preview representativas */}
          <div className="flex flex-col gap-3.5">
            {currentPhase.previewCards.map((card, idx) => (
              <article
                key={idx}
                className="flex items-center gap-4 rounded-xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] p-3 transition hover:translate-x-1 hover:border-[var(--sr-accent)]/40 hover:bg-[var(--sr-surface-raised)]"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                  <img src={card.image} alt={card.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-[var(--sr-hero-text)]">{card.title}</h4>
                  <p className="truncate text-xs text-[var(--sr-hero-text-muted)]">{card.subtitle}</p>
                  <span className="mt-2 inline-block rounded border border-[var(--sr-border-subtle)] bg-[var(--sr-surface-raised)] px-2 py-0.5 text-[0.625rem] font-semibold text-[var(--sr-accent-text)]">
                    {card.tag}
                  </span>
                </div>
                <div className="pr-2 text-xs font-bold text-[var(--sr-accent-text)]">{card.badgeRight}</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

