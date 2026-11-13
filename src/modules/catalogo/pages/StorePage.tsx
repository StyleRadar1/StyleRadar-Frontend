import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { tiendaContacto } from '@/modules/soporte/utils/contacts'
import { storePublicService } from '../services/storePublicService'
import './StorePage.css'

function ShieldCheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function MapPinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ZapIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function ArrowDownIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

function ArrowRightIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function StoreIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function HeartIcon({ filled = false, className = 'h-4 w-4' }: { filled?: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? '#ef4444' : 'none'}
      stroke={filled ? '#ef4444' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function SparklesIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

function LeafIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

function MessageSquareIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ClockIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function PhoneIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function renderDistintivoIcon(icono: string) {
  if (icono === 'shield' || icono.includes('🛡')) {
    return <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
  }
  if (icono === 'pin' || icono.includes('📍')) {
    return <MapPinIcon className="h-4 w-4 text-violeta-claro" />
  }
  if (icono === 'zap' || icono.includes('⚡')) {
    return <ZapIcon className="h-4 w-4 text-amber-400" />
  }
  return <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
}

export default function StorePage() {
  const { id } = useParams<{ id: string }>()
  const store = useMemo(() => storePublicService.getById(id || ''), [id])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODAS')
  const [favoritos, setFavoritos] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<string | null>(null)

  // Si no existe la tienda, estado vacío claro con botón al catálogo
  if (!store) {
    return (
      <main className="sr-store-empty-wrap" role="main">
        <div className="sr-store-empty-card">
          <div className="sr-store-empty-icon" aria-hidden="true">
            <StoreIcon className="h-7 w-7 text-violeta-claro" />
          </div>
          <h1 className="sr-store-empty-title">Tienda no encontrada</h1>
          <p className="sr-store-empty-desc">
            No encontramos ninguna tienda activa con el identificador «{id}» en el radar local de Bogotá.
          </p>
          <div className="sr-store-empty-actions">
            <Link to="/catalogo" className="sr-store-btn sr-store-btn--primary">
              ← Volver al catálogo
            </Link>
            <Link to="/mapa" className="sr-store-btn sr-store-btn--outline">
              Explorar el mapa
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Filtrado de prendas por categoría seleccionada o colección
  const prendasFiltradas =
    categoriaSeleccionada === 'TODAS'
      ? store.prendas
      : categoriaSeleccionada.startsWith('col:')
      ? store.prendas
      : store.prendas.filter((p) => p.tipo.toLowerCase() === categoriaSeleccionada.toLowerCase())

  const handleToggleFavorito = (prendaId: string, prendaNombre: string) => {
    setFavoritos((prev) => {
      const next = !prev[prendaId]
      setFeedback(next ? `¡Guardaste «${prendaNombre}» en tus favoritos!` : `Quitaste «${prendaNombre}» de tus favoritos.`)
      setTimeout(() => setFeedback(null), 3000)
      return { ...prev, [prendaId]: next }
    })
  }

  return (
    <main className="sr-store-page" role="main">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. BARRA SUPERIOR DE AVISO (Horario e información real)   */}
      {/* ────────────────────────────────────────────────────────── */}
      {store.bannerNotice && (
        <aside className="sr-store-notice-bar" aria-label="Aviso de la tienda">
          <div className="sr-store-notice-inner">
            <span className="sr-store-notice-badge">HORARIO LOCAL</span>
            <span className="sr-store-notice-text">{store.bannerNotice}</span>
          </div>
        </aside>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. HERO: FOTOGRAFÍA EN TODO EL CUADRO, TÍTULO Y ACCIONES   */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="sr-store-hero" aria-label={`Portada de ${store.nombre}`}>
        <div className="sr-store-hero__container">
          {/* Foto de la tienda abarcando literalmente todo el cuadro */}
          <img
            src={store.foto}
            alt={`Local físico y vitrina de ${store.nombre} en ${store.barrio}`}
            className="sr-store-hero__bg-photo"
            loading="eager"
          />

          {/* Capa de degradado editorial para legibilidad del texto */}
          <div className="sr-store-hero__bg-overlay" aria-hidden="true" />

          {/* Letra de fondo gigante / marca de agua */}
          <div className="sr-store-hero__watermark" aria-hidden="true">
            {store.nombre}
          </div>

          <div className="sr-store-hero__grid">
            {/* Columna Izquierda: Kicker, Título, Descripción, Botones y Puntos de Valor */}
            <div className="sr-store-hero__content">
              <span className="sr-store-hero__kicker">
                TIENDA LOCAL · BOGOTÁ · {store.barrio.toUpperCase()}
              </span>

              <h1 className="sr-store-hero__title">{store.nombre}</h1>

              <p className="sr-store-hero__desc">{store.descripcion}</p>

              <div className="sr-store-hero__actions">
                <a href="#prendas" className="sr-store-btn sr-store-btn--primary">
                  <span>Ver prendas</span>
                  <ArrowDownIcon className="h-4 w-4" />
                </a>
                <Link to={`/mapa?tienda=${store.id}`} className="sr-store-btn sr-store-btn--outline">
                  <MapPinIcon className="h-4 w-4 text-violeta-claro" />
                  <span>Cómo llegar</span>
                </Link>
              </div>

              {/* 3 puntos de valor con iconos vectoriales limpios */}
              <div className="sr-store-hero__props" aria-label="Garantías de la tienda">
                {store.distintivos.map((prop, idx) => (
                  <div key={idx} className="sr-store-hero__prop-item">
                    <span className="sr-store-hero__prop-icon" aria-hidden="true">
                      {renderDistintivoIcon(prop.icono)}
                    </span>
                    <div>
                      <strong className="sr-store-hero__prop-title">{prop.titulo}</strong>
                      <span className="sr-store-hero__prop-sub">{prop.descripcion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna Derecha: Tarjeta flotante con colección destacada */}
            <div className="sr-store-hero__visual">
              <div className="sr-store-hero__floating-card" aria-label="Colección destacada">
                <span className="sr-store-hero__floating-tag">COLECCIÓN DESTACADA</span>
                <h3 className="sr-store-hero__floating-title">{store.coleccionDestacada.titulo}</h3>
                <p className="sr-store-hero__floating-desc">{store.coleccionDestacada.descripcion}</p>
                <a href="#prendas" className="sr-store-hero__floating-link" aria-label="Explorar prendas de la colección">
                  <span>Ver catálogo</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. EXPLORA POR CATEGORÍA (Tarjetas en arco romano)        */}
      {/* ────────────────────────────────────────────────────────── */}
      {store.categorias.length > 0 && (
        <section className="sr-store-cats-section" aria-label="Categorías de la tienda">
          <div className="sr-store-section-header">
            <span className="sr-store-section-kicker">EXPLORA POR CATEGORÍA</span>
            <h2 className="sr-store-section-title">Elige tu estilo favorito</h2>
            <p className="sr-store-section-sub">
              Toca una categoría para filtrar las prendas disponibles en {store.nombre}.
            </p>
          </div>

          <div className="sr-store-cats-row" role="region" aria-label="Carrusel de categorías en arco">
            {/* Botón para ver Todas */}
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada('TODAS')}
              className={`sr-store-arch-card ${categoriaSeleccionada === 'TODAS' ? 'is-active' : ''}`}
              aria-pressed={categoriaSeleccionada === 'TODAS'}
            >
              <div className="sr-store-arch-card__frame">
                <img
                  src={store.foto}
                  alt="Todas las categorías"
                  className="sr-store-arch-card__img"
                  loading="lazy"
                />
                <div className="sr-store-arch-card__overlay">
                  <span className="sr-store-arch-card__count">{store.prendas.length}</span>
                </div>
              </div>
              <div className="sr-store-arch-card__caption">
                <span className="sr-store-arch-card__name">Todas las prendas</span>
                <span className="sr-store-arch-card__arrow" aria-hidden="true">→</span>
              </div>
            </button>

            {/* Tarjetas individuales con silueta en arco romano */}
            {store.categorias.map((cat) => {
              const active = categoriaSeleccionada.toLowerCase() === cat.tipo.toLowerCase()
              return (
                <button
                  key={cat.tipo}
                  type="button"
                  onClick={() => setCategoriaSeleccionada(active ? 'TODAS' : cat.tipo)}
                  className={`sr-store-arch-card ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                >
                  <div className="sr-store-arch-card__frame">
                    <img
                      src={cat.imagen}
                      alt={cat.nombre}
                      className="sr-store-arch-card__img"
                      loading="lazy"
                    />
                    <div className="sr-store-arch-card__overlay">
                      <span className="sr-store-arch-card__count">{cat.cantidad}</span>
                    </div>
                  </div>
                  <div className="sr-store-arch-card__caption">
                    <span className="sr-store-arch-card__name">{cat.nombre}</span>
                    <span className="sr-store-arch-card__arrow" aria-hidden="true">→</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. PRENDAS DE LA TIENDA (Cuadrícula interactiva)          */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="prendas" className="sr-store-items-section" aria-label="Prendas de la tienda">
        <div className="sr-store-items-header">
          <div>
            <span className="sr-store-section-kicker">CATÁLOGO ACTIVO</span>
            <h2 className="sr-store-section-title">Prendas de {store.nombre}</h2>
            <p className="sr-store-section-sub">
              {prendasFiltradas.length}{' '}
              {prendasFiltradas.length === 1 ? 'prenda disponible' : 'prendas disponibles'}{' '}
              {categoriaSeleccionada !== 'TODAS' && `en ${categoriaSeleccionada}`}
            </p>
          </div>

          {categoriaSeleccionada !== 'TODAS' && (
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada('TODAS')}
              className="sr-store-btn sr-store-btn--sm sr-store-btn--outline"
            >
              Ver todas ({store.prendas.length})
            </button>
          )}
        </div>

        {/* Feedback accesible al marcar favoritos */}
        {feedback && (
          <div role="status" className="sr-store-toast">
            <span>{feedback}</span>
          </div>
        )}

        {prendasFiltradas.length === 0 ? (
          <div className="sr-store-empty-filter">
            <p className="font-semibold text-[var(--sr-text-primary,#ffffff)]">
              No hay prendas bajo la categoría seleccionada.
            </p>
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada('TODAS')}
              className="mt-3 sr-store-btn sr-store-btn--primary sr-store-btn--sm"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="sr-store-items-grid">
            {prendasFiltradas.map((item, idx) => {
              const isFav = !!favoritos[item.id]
              const isNew = idx === 0
              return (
                <article key={item.id} className="sr-store-item-card">
                  <div className="sr-store-item-card__media">
                    <Link to={`/catalogo/${item.id}`} className="sr-store-item-card__img-link">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="sr-store-item-card__img"
                        loading="lazy"
                      />
                    </Link>

                    {/* Badge de estado */}
                    <div className="sr-store-item-card__badges">
                      {isNew ? (
                        <span className="sr-store-item-card__badge is-new">NUEVA LLEGADA</span>
                      ) : (
                        <span className="sr-store-item-card__badge is-stock">DISPONIBLE</span>
                      )}
                    </div>

                    {/* Botón corazón de favoritos */}
                    <button
                      type="button"
                      onClick={() => handleToggleFavorito(item.id, item.nombre)}
                      className={`sr-store-item-card__fav-btn ${isFav ? 'is-active' : ''}`}
                      aria-label={isFav ? `Quitar ${item.nombre} de favoritos` : `Guardar ${item.nombre} en favoritos`}
                      title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      <HeartIcon filled={isFav} className={isFav ? 'h-4 w-4' : 'h-4 w-4 text-white/80'} />
                    </button>
                  </div>

                  <div className="sr-store-item-card__body">
                    <div className="sr-store-item-card__meta">
                      <span>{item.tipo}</span>
                      <span>·</span>
                      <span>{item.estilo}</span>
                    </div>

                    <h3 className="sr-store-item-card__title">
                      <Link to={`/catalogo/${item.id}`}>{item.nombre}</Link>
                    </h3>

                    {/* Tallas disponibles */}
                    <div className="sr-store-item-card__sizes" aria-label="Tallas disponibles">
                      {item.tallas.map((t) => (
                        <span key={t} className="sr-store-item-card__size-pill">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="sr-store-item-card__footer">
                      <strong className="sr-store-item-card__price">{formatCOP(item.precio)}</strong>
                      <Link
                        to={`/probador?prenda=${item.id}`}
                        className="sr-store-item-card__try-link"
                        title="Probar en avatar virtual"
                      >
                        <span>Probador</span>
                        <SparklesIcon className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. BLOQUE EDITORIAL «MÁS QUE UNA TIENDA»                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="sr-store-editorial" aria-label="Presentación editorial de la tienda">
        <div className="sr-store-editorial__grid">
          <div className="sr-store-editorial__media">
            <img
              src={store.fotoEditorial || store.foto}
              alt={`Espacio y curaduría de ${store.nombre}`}
              className="sr-store-editorial__img"
              loading="lazy"
            />
          </div>

          <div className="sr-store-editorial__content">
            <span className="sr-store-section-kicker">MÁS QUE UNA TIENDA</span>
            <h2 className="sr-store-editorial__title">Moda consciente con identidad bogotana</h2>
            <p className="sr-store-editorial__lead">
              {store.descripcion} Cada prenda registrada en StyleRadar está lista para probarse de forma virtual y recogerse de manera inmediata en {store.barrio}.
            </p>

            <div className="sr-store-editorial__features">
              <div className="sr-store-editorial__feature-item">
                <span className="sr-store-editorial__feature-icon" aria-hidden="true">
                  <SparklesIcon className="h-4 w-4 text-amber-300" />
                </span>
                <div>
                  <strong>Curaduría Local</strong>
                  <p>Prendas seleccionadas y producidas con estándares de confección en Bogotá.</p>
                </div>
              </div>

              <div className="sr-store-editorial__feature-icon-item">
                <span className="sr-store-editorial__feature-icon" aria-hidden="true">
                  <LeafIcon className="h-4 w-4 text-emerald-400" />
                </span>
                <div>
                  <strong>Moda Sostenible</strong>
                  <p>Fomentamos el uso prolongado y el consumo consciente de ropa duradera.</p>
                </div>
              </div>

              <div className="sr-store-editorial__feature-icon-item">
                <span className="sr-store-editorial__feature-icon" aria-hidden="true">
                  <MapPinIcon className="h-4 w-4 text-violeta-claro" />
                </span>
                <div>
                  <strong>Sede en {store.barrio}</strong>
                  <p>{store.direccion}. Entregas y visitas presenciales sin intermediarios.</p>
                </div>
              </div>

              <div className="sr-store-editorial__feature-icon-item">
                <span className="sr-store-editorial__feature-icon" aria-hidden="true">
                  <MessageSquareIcon className="h-4 w-4 text-sky-400" />
                </span>
                <div>
                  <strong>Atención Directa</strong>
                  <p>Contacto sin fricciones entre compradores y la creadora de la marca.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5A. COLECCIONES DE LA TIENDA                              */}
      {/* ────────────────────────────────────────────────────────── */}
      {store.colecciones && store.colecciones.length > 0 && (
        <section className="sr-store-collections-section" aria-label="Colecciones de la tienda">
          <div className="sr-store-section-header">
            <span className="sr-store-section-kicker">CURADURÍA Y ESTILO</span>
            <h2 className="sr-store-section-title">Colecciones de {store.nombre}</h2>
            <p className="sr-store-section-sub">
              Agrupaciones por temporada o estilo creadas por la tienda. Curaduría local verificada.
            </p>
          </div>

          <div className="sr-store-collections-grid" role="region" aria-label="Colecciones públicas de la tienda">
            {store.colecciones
              .filter((c) => c.visibility === 'Pública')
              .map((collection) => (
                <Link
                  className="sr-store-collection-card"
                  key={collection.id}
                  to={`/playlists/${collection.id}`}
                  state={{ collection }}
                  aria-label={`Abrir colección ${collection.title}`}
                >
                  <img src={collection.image} alt={collection.title} className="sr-store-collection-img" loading="lazy" />
                  <div className="sr-store-collection-shade" aria-hidden="true" />
                  <div className="sr-store-collection-badge">
                    <span className="sr-store-collection-name">{collection.title}</span>
                    <span className="sr-store-collection-meta">{collection.items || 0} prendas · {collection.visibility}</span>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5B. FOTOS DE LA TIENDA (Fachada, mostrador e instalaciones)*/}
      {/* ────────────────────────────────────────────────────────── */}
      {store.fotosGaleria && store.fotosGaleria.length > 0 && (
        <section className="sr-store-gallery-section" aria-label="Fotos del espacio y vitrinas">
          <div className="sr-store-section-header">
            <span className="sr-store-section-kicker">ESPACIO FÍSICO Y VITRINAS</span>
            <h2 className="sr-store-section-title">Fotos de {store.nombre}</h2>
            <p className="sr-store-section-sub">
              Fachada, vitrina e interior en {store.barrio}. Fotografías verificadas en el radar local de Bogotá.
            </p>
          </div>

          <div className="sr-store-gallery-grid" role="region" aria-label="Galería fotográfica de la tienda">
            {store.fotosGaleria.map((photo, pIdx) => (
              <div key={photo.id || pIdx} className="sr-store-gallery-card">
                <img
                  src={photo.url}
                  alt={`${photo.tag || 'Foto'} de ${store.nombre}`}
                  className="sr-store-gallery-img"
                  loading="lazy"
                />
                <div className="sr-store-gallery-shade" aria-hidden="true" />
                <div className="sr-store-gallery-badge">
                  <span className="sr-store-gallery-tag">{photo.tag || `Foto ${pIdx + 1}`}</span>
                  <span className="sr-store-gallery-store">{store.nombre}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. CIFRAS REALES DE LA TIENDA                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="sr-store-stats-section" aria-label="Métricas de la tienda en StyleRadar">
        <div className="sr-store-stats-grid">
          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">{store.cifras.prendasActivas}</span>
            <span className="sr-store-stat-label">Prendas activas</span>
          </div>

          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">{store.cifras.categoriasCount}</span>
            <span className="sr-store-stat-label">Categorías de estilo</span>
          </div>

          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">{store.cifras.playlists}</span>
            <span className="sr-store-stat-label">Playlists destacadas</span>
          </div>

          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">{store.aliadaDesde}</span>
            <span className="sr-store-stat-label">Aliada en StyleRadar</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. REPUTACIÓN Y VALORACIONES DE COMPRADORES               */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="sr-store-rating-section" aria-label="Calificación de la tienda">
        <div className="sr-store-rating-card">
          <div className="sr-store-rating-score">
            <span className="sr-store-rating-num">{store.rating}</span>
            <span className="sr-store-rating-stars">★★★★★</span>
          </div>
          <div className="sr-store-rating-text">
            <h3 className="sr-store-rating-title">Calificación de la comunidad</h3>
            <p className="sr-store-rating-sub">
              Basado en {store.reviews} valoraciones de compradores verificados en Bogotá que han visitado la tienda o coordinado prendas a través de StyleRadar.
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. INFORMACIÓN DE CONTACTO Y UBICACIÓN FÍSICA             */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="sr-store-info-section" aria-label="Información de contacto">
        <div className="sr-store-info-card">
          <div className="sr-store-info-header">
            <span className="sr-store-section-kicker">INFORMACIÓN Y CONTACTO</span>
            <h2 className="sr-store-section-title">Encuéntranos en {store.barrio}</h2>
            <p className="sr-store-section-sub">
              Visítanos para probarte las prendas en tienda física o comunícate directamente con nuestro equipo.
            </p>
          </div>

          <div className="sr-store-info-grid">
            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <MapPinIcon className="h-5 w-5 text-violeta-claro" />
              </span>
              <div>
                <strong>Dirección</strong>
                <p>{store.direccion}</p>
              </div>
            </div>

            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <ClockIcon className="h-5 w-5 text-amber-300" />
              </span>
              <div>
                <strong>Horario de atención</strong>
                <p>{store.horario}</p>
              </div>
            </div>

            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <PhoneIcon className="h-5 w-5 text-emerald-400" />
              </span>
              <div>
                <strong>Teléfono</strong>
                <p>{store.telefono}</p>
              </div>
            </div>

            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <MailIcon className="h-5 w-5 text-sky-400" />
              </span>
              <div>
                <strong>Correo</strong>
                <p>{store.correo}</p>
              </div>
            </div>
          </div>

          <div className="sr-store-info-actions">
            <Link to={`/mapa?tienda=${store.id}`} className="sr-store-btn sr-store-btn--primary">
              Ver tienda en el mapa interactivo →
            </Link>
            <ContactButton
              label={`Escribir a ${store.nombre}`}
              contacto={tiendaContacto(store.nombre)}
              asunto={`Consulta sobre ${store.nombre}`}
              className="sr-store-btn sr-store-btn--outline"
            />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 9. CIERRE Y NAVEGACIÓN HACIA EL CATÁLOGO                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="sr-store-closure-section" aria-label="Navegación de retorno">
        <div className="sr-store-closure-inner">
          <h2 className="sr-store-closure-title">¿Buscas más opciones de moda local?</h2>
          <p className="sr-store-closure-desc">
            Explora las colecciones de todas las tiendas aliadas de Bogotá en nuestro catálogo general.
          </p>
          <Link to="/catalogo" className="sr-store-btn sr-store-btn--primary sr-store-btn--lg">
            ← Volver a explorar el catálogo completo
          </Link>
        </div>
      </section>
    </main>
  )
}
