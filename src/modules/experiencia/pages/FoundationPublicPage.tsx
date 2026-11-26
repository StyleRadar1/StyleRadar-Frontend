import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { env } from '@/configs/env'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { recordRecentLocation } from '@/modules/mapa/utils/recentLocations'
import {
  foundationPublicService,
  type FoundationPublicDto,
} from '../services/foundationPublicService'
import '@/modules/catalogo/pages/StorePage.css'

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

function HeartIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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

function renderDistintivoIcon(icono: 'shield' | 'pin' | 'heart') {
  if (icono === 'pin') return <MapPinIcon className="h-4 w-4 text-[var(--sr-accent-text)]" />
  if (icono === 'heart') return <HeartIcon className="h-4 w-4 text-[var(--sr-bad)]" />
  return <ShieldCheckIcon className="h-4 w-4 text-[var(--sr-ok)]" />
}

export default function FoundationPublicPage() {
  const { id } = useParams<{ id: string }>()
  const initialFoundation = useMemo(
    () => (env.useMocks ? foundationPublicService.getById(id || '') : null),
    [id],
  )
  const [foundation, setFoundation] = useState<FoundationPublicDto | null>(initialFoundation)
  const [loading, setLoading] = useState<boolean>(() => !env.useMocks)
  const [error, setError] = useState<unknown>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const reload = () => setReloadTick((t) => t + 1)

  useEffect(() => {
    if (foundation?.id) recordRecentLocation(String(foundation.id))
  }, [foundation?.id])

  useEffect(() => {
    if (env.useMocks) {
      setFoundation(initialFoundation)
      setLoading(false)
      setError(null)
      return
    }
    let active = true
    setFoundation(null)
    setLoading(true)
    setError(null)
    foundationPublicService
      .getByIdAsync(id || '')
      .then((res) => {
        if (!active) return
        setFoundation(res)
      })
      .catch((err) => {
        if (!active) return
        setError(err)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, initialFoundation, reloadTick])

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12" role="main">
        <Loading label="Cargando fundación…" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12" role="main">
        <ErrorState error={error} onRetry={reload} title="No pudimos cargar la fundación" />
      </main>
    )
  }

  if (!foundation) {
    return (
      <main className="sr-store-empty-wrap" role="main">
        <div className="sr-store-empty-card">
          <div className="sr-store-empty-icon" aria-hidden="true">
            <HeartIcon className="h-7 w-7 text-[var(--sr-bad)]" />
          </div>
          <h1 className="sr-store-empty-title">Fundación no encontrada</h1>
          <p className="sr-store-empty-desc">
            No encontramos ninguna fundación activa con el identificador «{id}» en el radar solidario de Bogotá.
          </p>
          <div className="sr-store-empty-actions">
            <Link to="/donar" className="sr-store-btn sr-store-btn--primary">
              Ir a donar prendas
            </Link>
            <Link to="/mapa" className="sr-store-btn sr-store-btn--outline">
              Explorar el mapa
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="sr-store-page" role="main">
      {/* 1. BARRA SUPERIOR DE AVISO */}
      {foundation.bannerNotice && (
        <aside className="sr-store-notice-bar" aria-label="Aviso de la fundación">
          <div className="sr-store-notice-inner">
            <span className="sr-store-notice-badge">
              {foundation.activa ? 'RECEPCIÓN ACTIVA' : 'RECEPCIÓN PAUSADA'}
            </span>
            <span className="sr-store-notice-text">{foundation.bannerNotice}</span>
          </div>
        </aside>
      )}

      {/* 2. HERO DE LA FUNDACIÓN */}
      <section className="sr-store-hero" aria-label={`Portada de ${foundation.nombre}`}>
        <div className="sr-store-hero__container">
          <img
            src={foundation.foto}
            alt={`Labor social de ${foundation.nombre} en ${foundation.barrio}`}
            className="sr-store-hero__bg-photo"
            loading="eager"
          />
          <div className="sr-store-hero__bg-overlay" aria-hidden="true" />
          <div className="sr-store-hero__watermark" aria-hidden="true">
            {foundation.nombre}
          </div>

          <div className="sr-store-hero__grid">
            <div className="sr-store-hero__content">
              <span className="sr-store-hero__kicker">
                FUNDACIÓN ALIADA · BOGOTÁ · {foundation.barrio.toUpperCase()}
              </span>

              <h1 className="sr-store-hero__title">{foundation.nombre}</h1>

              <p className="sr-store-hero__desc">{foundation.descripcion}</p>

              <div className="sr-store-hero__actions">
                <Link to="/donar" className="sr-store-btn sr-store-btn--primary">
                  <span>Donar prendas</span>
                  <HeartIcon className="h-4 w-4" />
                </Link>
                <a href="#necesidades" className="sr-store-btn sr-store-btn--outline">
                  <span>Qué reciben</span>
                  <ArrowDownIcon className="h-4 w-4" />
                </a>
                <Link to={`/mapa?fundacion=${foundation.id}`} className="sr-store-btn sr-store-btn--outline">
                  <MapPinIcon className="h-4 w-4 text-[var(--sr-accent-text)]" />
                  <span>Cómo llegar</span>
                </Link>
              </div>

              <div className="sr-store-hero__props" aria-label="Garantías de la fundación">
                {foundation.distintivos.map((prop, idx) => (
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

            <div className="sr-store-hero__visual">
              <div className="sr-store-hero__floating-card" aria-label="Estado de recepción">
                <span className="sr-store-hero__floating-tag">IMPACTO SOCIAL</span>
                <h3 className="sr-store-hero__floating-title">{foundation.destacado.titulo}</h3>
                <p className="sr-store-hero__floating-desc">{foundation.destacado.descripcion}</p>
                <Link to="/donar" className="sr-store-hero__floating-link" aria-label="Iniciar solicitud de donación">
                  <span>Programar donación</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUÉ RECIBIMOS Y NECESIDADES PRIORITARIAS */}
      <section id="necesidades" className="sr-store-items-section" aria-label="Prendas que recibe la fundación">
        <div className="sr-store-items-header">
          <div>
            <span className="sr-store-section-kicker">QUÉ RECIBIMOS</span>
            <h2 className="sr-store-section-title">Prendas que transforman vidas</h2>
            <p className="sr-store-section-sub">
              Categorías aceptadas y necesidades prioritarias del mes en {foundation.nombre}.
            </p>
          </div>
          <Link to="/donar" className="sr-store-btn sr-store-btn--primary">
            Donar a esta fundación →
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-2.5">
          {foundation.queRecibimos.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] px-4 py-2 text-sm font-semibold text-[var(--sr-text-primary)] shadow-xs"
            >
              ♥ {cat}
            </span>
          ))}
        </div>

        {foundation.necesidades.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {foundation.necesidades.map((nec) => (
              <article
                key={nec.nombre}
                className="rounded-2xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface)] p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--sr-accent-text)]">
                    Meta mensual
                  </span>
                  <span className="text-sm font-extrabold text-[var(--sr-text-primary)]">
                    {nec.avance}%
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--sr-text-primary)] mb-3">{nec.nombre}</h3>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--sr-border-subtle)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--sr-accent)] to-[var(--sr-ok)] transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, nec.avance))}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 4. BLOQUE EDITORIAL «MÁS QUE UNA FUNDACIÓN» */}
      <section className="sr-store-editorial" aria-label="Labor social de la fundación">
        <div className="sr-store-editorial__grid">
          <div className="sr-store-editorial__media">
            <img
              src={foundation.fotoEditorial || foundation.foto}
              alt={`Trabajo comunitario de ${foundation.nombre}`}
              className="sr-store-editorial__img"
              loading="lazy"
            />
          </div>

          <div className="sr-store-editorial__content">
            <span className="sr-store-section-kicker">MÁS QUE UNA FUNDACIÓN</span>
            <h2 className="sr-store-editorial__title">A quién ayudamos y cómo trabajamos</h2>
            <p className="sr-store-editorial__lead">{foundation.aQuienAyudamos}</p>

            <div className="sr-store-editorial__features">
              {foundation.queHacemos.map((accion, idx) => (
                <div key={idx} className="sr-store-editorial__feature-item">
                  <span className="sr-store-editorial__feature-icon" aria-hidden="true">
                    {idx % 2 === 0 ? (
                      <SparklesIcon className="h-4 w-4 text-[var(--sr-warn)]" />
                    ) : (
                      <LeafIcon className="h-4 w-4 text-[var(--sr-ok)]" />
                    )}
                  </span>
                  <div>
                    <strong>Iniciativa {idx + 1}</strong>
                    <p>{accion}</p>
                  </div>
                </div>
              ))}

              <div className="sr-store-editorial__feature-item">
                <span className="sr-store-editorial__feature-icon" aria-hidden="true">
                  <MapPinIcon className="h-4 w-4 text-[var(--sr-accent-text)]" />
                </span>
                <div>
                  <strong>Sede en {foundation.barrio}</strong>
                  <p>{foundation.direccion}. Recepción presencial o recogida programada.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GALERÍA DE LA FUNDACIÓN */}
      {foundation.fotosGaleria.length > 0 && (
        <section className="sr-store-gallery-section" aria-label="Fotos de la fundación">
          <div className="sr-store-section-header">
            <span className="sr-store-section-kicker">ESPACIO Y JORNADAS</span>
            <h2 className="sr-store-section-title">Así trabaja {foundation.nombre}</h2>
            <p className="sr-store-section-sub">
              Puntos de acopio, jornadas comunitarias y entregas verificadas en {foundation.barrio}.
            </p>
          </div>

          <div className="sr-store-gallery-grid" role="region" aria-label="Galería de la fundación">
            {foundation.fotosGaleria.map((photo, pIdx) => (
              <div key={photo.id || pIdx} className="sr-store-gallery-card">
                <img
                  src={photo.url}
                  alt={`${photo.tag} de ${foundation.nombre}`}
                  className="sr-store-gallery-img"
                  loading="lazy"
                />
                <div className="sr-store-gallery-shade" aria-hidden="true" />
                <div className="sr-store-gallery-badge">
                  <span className="sr-store-gallery-tag">{photo.tag}</span>
                  <span className="sr-store-gallery-store">{foundation.nombre}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. CIFRAS DE IMPACTO */}
      <section className="sr-store-stats-section" aria-label="Métricas de impacto">
        <div className="sr-store-stats-grid">
          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">
              {foundation.cifras.prendasEntregadas.toLocaleString('es-CO')}
            </span>
            <span className="sr-store-stat-label">Prendas entregadas</span>
          </div>

          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">
              {foundation.cifras.donacionesRecibidas.toLocaleString('es-CO')}
            </span>
            <span className="sr-store-stat-label">Donaciones recibidas</span>
          </div>

          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">{foundation.cifras.voluntarios}</span>
            <span className="sr-store-stat-label">Voluntarios activos</span>
          </div>

          <div className="sr-store-stat-item">
            <span className="sr-store-stat-num">{foundation.aliadaDesde}</span>
            <span className="sr-store-stat-label">Aliada en StyleRadar</span>
          </div>
        </div>
      </section>

      {/* 7. VERIFICACIÓN Y TRANSPARENCIA */}
      <section className="sr-store-rating-section" aria-label="Transparencia de la fundación">
        <div className="sr-store-rating-card">
          <div className="sr-store-rating-score">
            <span className="sr-store-rating-num">100%</span>
            <span className="sr-store-rating-stars">♥ VERIFICADA</span>
          </div>
          <div className="sr-store-rating-text">
            <h3 className="sr-store-rating-title">Donaciones con trazabilidad real</h3>
            <p className="sr-store-rating-sub">
              Cada entrega registrada a través de StyleRadar cuenta con seguimiento de estado y comprobante oficial cuando {foundation.nombre} confirma la recepción.
            </p>
          </div>
        </div>
      </section>

      {/* 8. INFORMACIÓN DE CONTACTO Y PUNTOS DE ENTREGA */}
      <section className="sr-store-info-section" aria-label="Información de contacto y puntos">
        <div className="sr-store-info-card">
          <div className="sr-store-info-header">
            <span className="sr-store-section-kicker">INFORMACIÓN Y PUNTOS DE ENTREGA</span>
            <h2 className="sr-store-section-title">Encuéntranos en {foundation.barrio}</h2>
            <p className="sr-store-section-sub">
              Entrega tus prendas directamente en nuestros puntos habilitados o solicita recogida desde el formulario de donación.
            </p>
          </div>

          <div className="sr-store-info-grid">
            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <MapPinIcon className="h-5 w-5 text-[var(--sr-accent-text)]" />
              </span>
              <div>
                <strong>Dirección principal</strong>
                <p>{foundation.direccion}</p>
              </div>
            </div>

            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <ClockIcon className="h-5 w-5 text-[var(--sr-warn)]" />
              </span>
              <div>
                <strong>Horario de recepción</strong>
                <p>{foundation.horario}</p>
              </div>
            </div>

            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <PhoneIcon className="h-5 w-5 text-[var(--sr-ok)]" />
              </span>
              <div>
                <strong>Teléfono</strong>
                <p>{foundation.telefono}</p>
              </div>
            </div>

            <div className="sr-store-info-item">
              <span className="sr-store-info-icon" aria-hidden="true">
                <MailIcon className="h-5 w-5 text-[var(--sr-info)]" />
              </span>
              <div>
                <strong>Correo</strong>
                <p>{foundation.correo}</p>
              </div>
            </div>
          </div>

          {foundation.puntos.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[var(--sr-border-subtle)] bg-[var(--sr-bg-2,var(--color-surface-muted))] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--sr-text-muted)]">
                Puntos de acopio habilitados
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {foundation.puntos.map((pt) => (
                  <li key={pt.id} className="text-sm text-[var(--sr-text-primary)]">
                    <strong>{pt.nombre}:</strong>{' '}
                    <span className="text-[var(--sr-text-secondary)]">{pt.direccion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="sr-store-info-actions">
            <Link to={`/mapa?fundacion=${foundation.id}`} className="sr-store-btn sr-store-btn--primary">
              Ver fundación en el mapa interactivo →
            </Link>
            <Link to="/donar" className="sr-store-btn sr-store-btn--outline">
              Donar a {foundation.nombre} ♥
            </Link>
          </div>
        </div>
      </section>

      {/* 9. CIERRE */}
      <section className="sr-store-closure-section" aria-label="Navegación de retorno">
        <div className="sr-store-closure-inner">
          <h2 className="sr-store-closure-title">¿Tienes prendas en buen estado para darles segunda vida?</h2>
          <p className="sr-store-closure-desc">
            Registra tu donación en segundos o sigue explorando tiendas y fundaciones aliadas en el mapa de Bogotá.
          </p>
          <Link to="/mapa" className="sr-store-btn sr-store-btn--primary sr-store-btn--lg">
            ← Volver al mapa interactivo
          </Link>
        </div>
      </section>
    </main>
  )
}
