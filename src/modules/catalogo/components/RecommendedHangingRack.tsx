import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { formatCOP } from '@/modules/core/utils/format'
import { env } from '@/configs/env'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorMessage } from '@/modules/core/api/errors'
import { ErrorBanner } from '@/modules/core/components/ErrorFeedback'
import { PARA_TI_SIZE } from '@/modules/identidad/components/ParaTiSections'
import { feedService, motivoDe } from '@/modules/identidad/services/feedService'
import { usuarioService } from '@/modules/identidad/services/usuarioService'
import { TEXTOS_FEED, type FeedItemDto, type RecommendationsPageDto } from '@/modules/identidad/types/feed.dto'
import type { PerfilDto } from '@/modules/identidad/types/usuario.dto'
import type { ItemResponseDto } from '../types/item.dto'
import { ITEMS } from '../mocks/items'
import { ItemGridSkeleton } from './ItemCardSkeleton'
import './RecommendedHangingRack.css'

/* ============================================================================
 * Perchero interactivo con «Recomendado para ti» (SR-RF-06)
 * ============================================================================ */

const MOCK_CUTOUT_BY_ID = new Map(
  ITEMS.filter((it): it is ItemResponseDto & { recorte: string } => Boolean(it.recorte)).map((it) => [it.id, it])
)

const feedErrorText = (e: unknown) =>
  e instanceof ApiError && e.status === 503 ? TEXTOS_FEED.catalogoCaido : errorMessage(e)

function HangerBackSvg({ bajada = 0 }: { bajada?: number }) {
  const bajadaSvg = (bajada ?? 0) * 19.2
  const vbHeight = 60 + bajadaSvg

  return (
    <svg
      className="sr-rack-hanger sr-rack-hanger--back"
      viewBox={`0 0 160 ${vbHeight}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sr-wire-grad-back" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e2ea" />
          <stop offset="45%" stopColor="#8c8c98" />
          <stop offset="100%" stopColor="#26262e" />
        </linearGradient>
      </defs>
      {/* Tramo trasero del lazo metálico que pasa por detrás de la barra */}
      <path
        d="M68 20 C68 12, 71 5, 80 4"
        stroke="url(#sr-wire-grad-back)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShoulderHangerFrontSvg({ bajada = 0 }: { bajada?: number }) {
  const bajadaSvg = (bajada ?? 0) * 19.2
  const vbHeight = 60 + bajadaSvg

  return (
    <svg
      className="sr-rack-hanger sr-rack-hanger--shoulder"
      viewBox={`0 0 160 ${vbHeight}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sr-wire-grad-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#b4b4c0" />
          <stop offset="70%" stopColor="#5a5a66" />
          <stop offset="100%" stopColor="#1a1a20" />
        </linearGradient>
        <linearGradient id="sr-wood-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7a4620" />
          <stop offset="25%" stopColor="#b87b44" />
          <stop offset="50%" stopColor="#d49458" />
          <stop offset="75%" stopColor="#b87b44" />
          <stop offset="100%" stopColor="#7a4620" />
        </linearGradient>
      </defs>
      {/* Tramo frontal del lazo: corona sobre la barra y desciende por delante */}
      <path
        d="M80 4 C88 5, 89 13, 85 19 C82 22, 80 23, 80 27"
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Cuello del gancho que entra en la madera: se alarga con la bajada */}
      <line
        x1="80"
        y1="26"
        x2="80"
        y2={31 + bajadaSvg}
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Hombros de madera curvos y remache: bajan juntos */}
      <g transform={`translate(0, ${bajadaSvg})`}>
        <path
          d="M16 48 C40 40, 64 30, 80 28 C96 30, 120 40, 144 48 C146 49, 144 53, 141 53 C118 46, 96 37, 80 36 C64 37, 42 46, 19 53 C16 53, 14 49, 16 48 Z"
          fill="url(#sr-wood-grad)"
          stroke="#4a250a"
          strokeWidth="0.8"
        />
        {/* Detalle de remache central en el cuello */}
        <circle cx="80" cy="30" r="2.2" fill="#d4d4dc" stroke="#262626" strokeWidth="0.6" />
      </g>
    </svg>
  )
}

function ClipsHangerFrontSvg({ bajada = 0 }: { bajada?: number }) {
  const bajadaSvg = (bajada ?? 0) * 19.2
  const vbHeight = 60 + bajadaSvg

  return (
    <svg
      className="sr-rack-hanger sr-rack-hanger--clips"
      viewBox={`0 0 160 ${vbHeight}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sr-clips-rod-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#c8c8d2" />
          <stop offset="70%" stopColor="#5a5a66" />
          <stop offset="100%" stopColor="#222228" />
        </linearGradient>
      </defs>
      {/* Tramo frontal del lazo */}
      <path
        d="M80 4 C88 5, 89 13, 85 19 C82 22, 80 23, 80 27"
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Cuello del gancho */}
      <line
        x1="80"
        y1="26"
        x2="80"
        y2={31 + bajadaSvg}
        stroke="url(#sr-wire-grad-front)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Barra horizontal metálica con topes */}
      <g transform={`translate(0, ${bajadaSvg})`}>
        <rect
          x="24"
          y="29"
          width="112"
          height="4"
          rx="2"
          fill="url(#sr-clips-rod-grad)"
          stroke="#33333a"
          strokeWidth="0.6"
        />
        {/* Topes en los extremos de la barra */}
        <circle cx="24" cy="31" r="2.5" fill="#44444e" />
        <circle cx="136" cy="31" r="2.5" fill="#44444e" />
      </g>
    </svg>
  )
}

function HangerClipsFront() {
  return (
    <div className="sr-rack-clips-layer" aria-hidden="true">
      {/* Pinza izquierda */}
      <svg className="sr-rack-clip sr-rack-clip--left" viewBox="0 0 16 28" fill="none">
        <rect x="3" y="1" width="10" height="26" rx="2" fill="#a0a0ab" stroke="#222228" strokeWidth="1" />
        <line x1="4" y1="12" x2="12" y2="12" stroke="#222228" strokeWidth="1.5" />
        <rect x="2" y="18" width="12" height="8" rx="1.5" fill="#44444e" stroke="#111116" strokeWidth="0.8" />
      </svg>
      {/* Pinza derecha */}
      <svg className="sr-rack-clip sr-rack-clip--right" viewBox="0 0 16 28" fill="none">
        <rect x="3" y="1" width="10" height="26" rx="2" fill="#a0a0ab" stroke="#222228" strokeWidth="1" />
        <line x1="4" y1="12" x2="12" y2="12" stroke="#222228" strokeWidth="1.5" />
        <rect x="2" y="18" width="12" height="8" rx="1.5" fill="#44444e" stroke="#111116" strokeWidth="0.8" />
      </svg>
    </div>
  )
}

export function RecommendedHangingRack({ userId }: { userId: string }) {
  const [data, setData] = useState<RecommendationsPageDto | null>(null)
  const [perfil, setPerfil] = useState<PerfilDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  const versionRef = useRef(0)
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef<number>(0)
  const didDrag = useRef<boolean>(false)

  const cargar = useCallback(async () => {
    const v = ++versionRef.current
    setLoading(true)
    setError('')
    try {
      const r = await feedService.getRecommendations(userId, { page: 0, size: PARA_TI_SIZE })
      if (v !== versionRef.current) return
      setData(r)
      setActiveIndex(0)
      if (r.content.some((i) => !i.reason?.trim())) {
        const p = await usuarioService.get(userId).catch(() => null)
        if (v === versionRef.current) setPerfil(p)
      }
    } catch (e) {
      if (v === versionRef.current) setError(feedErrorText(e))
    } finally {
      if (v === versionRef.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const items = useMemo<FeedItemDto[]>(() => data?.content ?? [], [data])
  const total = items.length
  const safeActiveIndex = total > 0 ? activeIndex % total : 0

  const moveBy = useCallback(
    (delta: number) => {
      if (total <= 1) return
      setActiveIndex((prev) => (prev + delta + total) % total)
    },
    [total]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveBy(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveBy(1)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX
    dragDeltaX.current = 0
    didDrag.current = false
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return
    dragDeltaX.current = e.clientX - dragStartX.current
    if (Math.abs(dragDeltaX.current) > 10) {
      didDrag.current = true
    }
  }

  const handlePointerEnd = () => {
    if (dragStartX.current === null) return
    const dx = dragDeltaX.current
    dragStartX.current = null
    dragDeltaX.current = 0
    if (Math.abs(dx) > 36) {
      moveBy(dx < 0 ? 1 : -1)
    }
  }

  const visibleGarments = useMemo(() => {
    return items
      .map((item, index) => {
        let offset = index - safeActiveIndex
        if (total > 2) {
          if (offset > total / 2) offset -= total
          if (offset < -total / 2) offset += total
        }
        return { item, index, offset }
      })
      .filter(({ offset }) => offset >= -3 && offset <= 3)
  }, [safeActiveIndex, items, total])

  const header = (
    <header className="sr-rack-header">
      <span className="sr-rack-kicker">Según tu perfil de estilo</span>
      <span className="sr-rack-divider" aria-hidden="true" />
      <h2 id="recomendado-titulo" className="sr-rack-kicker sr-rack-kicker--muted m-0">
        Recomendado para ti
      </h2>
    </header>
  )

  if (loading) {
    return (
      <section className="sr-rack-section" aria-labelledby="recomendado-titulo">
        {header}
        <div className="px-4 sm:px-6">
          <ItemGridSkeleton count={4} />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="sr-rack-section" aria-labelledby="recomendado-titulo">
        {header}
        <div className="sr-rack-empty-box">
          <ErrorBanner
            tone="warn"
            icon="refresh"
            title={error}
            actions={
              <button
                type="button"
                onClick={cargar}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)]"
              >
                Reintentar
              </button>
            }
          />
        </div>
      </section>
    )
  }

  if (data?.generalWithoutPreferences || total === 0) {
    return (
      <section className="sr-rack-section" aria-labelledby="recomendado-titulo">
        {header}
        <div className="sr-rack-empty-box">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center text-sm text-[var(--color-text)]">
            <p>{data?.message || TEXTOS_FEED.sinPreferencias}</p>
            <Link to="/perfil" className="mt-3 inline-block font-semibold text-[var(--color-accent)] underline">
              Actualizar mi perfil
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const featured = items[safeActiveIndex] ?? items[0]
  const motivoFeatured = motivoDe(featured, perfil)

  return (
    <section
      className="sr-rack-section"
      aria-labelledby="recomendado-titulo"
      onKeyDown={handleKeyDown}
    >
      {header}
      {data?.message && (
        <p className="sr-rack-status" role="status">
          {data.message}
        </p>
      )}

      {/* Barra metálica horizontal fina + prendas colgadas */}
      <div
        className="sr-rack-viewport"
        tabIndex={0}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Perchero interactivo de prendas recomendadas para ti"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => moveBy(-1)}
              aria-label="Prenda recomendada anterior"
              className="sr-rack-nav-btn sr-rack-nav-btn--prev"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => moveBy(1)}
              aria-label="Siguiente prenda recomendada"
              className="sr-rack-nav-btn sr-rack-nav-btn--next"
            >
              ›
            </button>
          </>
        )}

        {/* Tramo trasero de los lazos de los ganchos (z-index por detrás de la barra) */}
        <div className="sr-rack-stage sr-rack-stage--back" aria-hidden="true">
          {visibleGarments.map(({ item, offset, index }) => {
            const mockMeta = env.useMocks ? MOCK_CUTOUT_BY_ID.get(item.itemId) : undefined
            const bajada = mockMeta?.bajada ?? 0
            return (
              <div
                key={`back-${item.itemId}`}
                data-offset={offset}
                className="sr-rack-item sr-rack-item--back"
                style={
                  {
                    '--rack-delay': `${(index * 0.42) % 2.5}s`,
                    '--bajada': `${bajada}rem`,
                  } as React.CSSProperties
                }
              >
                <div className="sr-rack-sway">
                  <div className="sr-rack-sway-inner">
                    <HangerBackSvg bajada={bajada} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Barra metálica horizontal de lado a lado */}
        <div className="sr-rack-bar" aria-hidden="true" />

        {/* Prendas colgadas */}
        <div className="sr-rack-stage">
          {visibleGarments.map(({ item, index, offset }) => {
            const isCenter = offset === 0
            const mockMeta = env.useMocks ? MOCK_CUTOUT_BY_ID.get(item.itemId) : undefined
            const isClips = mockMeta ? mockMeta.tipoGancho === 'pinzas' : item.garmentType === 'BOTTOM'
            const bajada = mockMeta?.bajada ?? 0
            const anclaY = mockMeta?.anclaY ?? (isClips ? 0 : 0.05)
            const photoUrl = item.photos?.[0] ?? ''
            const showBrokenFallback = failedImages[item.itemId] || (!mockMeta && !photoUrl)

            return (
              <button
                key={item.itemId}
                type="button"
                data-offset={offset}
                aria-pressed={isCenter}
                aria-label={item.name}
                onClick={() => {
                  if (didDrag.current) {
                    didDrag.current = false
                    return
                  }
                  setActiveIndex(index)
                }}
                className="sr-rack-item"
                style={
                  {
                    '--rack-delay': `${(index * 0.42) % 2.5}s`,
                    '--ancla-y': anclaY,
                    '--bajada': `${bajada}rem`,
                  } as React.CSSProperties
                }
              >
                <div className="sr-rack-sway">
                  <div className="sr-rack-sway-inner">
                    {isClips ? (
                      <ClipsHangerFrontSvg bajada={bajada} />
                    ) : (
                      <ShoulderHangerFrontSvg bajada={bajada} />
                    )}

                    {mockMeta ? (
                      <div className="sr-rack-garment-cutout">
                        <img
                          src={mockMeta.recorte}
                          alt={item.name}
                          draggable={false}
                          className="sr-rack-cutout-img"
                        />
                        {isClips && <HangerClipsFront />}
                      </div>
                    ) : (
                      <div className="sr-rack-garment-card">
                        {isClips && <HangerClipsFront />}
                        {showBrokenFallback ? (
                          <div className="sr-rack-card-fallback">
                            <span>{item.brand || 'StyleRadar'}</span>
                          </div>
                        ) : (
                          <img
                            src={photoUrl}
                            alt={item.name}
                            draggable={false}
                            className="sr-rack-card-img"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [item.itemId]: true }))
                            }
                          />
                        )}
                      </div>
                    )}

                    <span className="sr-rack-hover-title" aria-hidden="true">
                      {item.name}
                    </span>
                  </div>
                </div>

                <div className="sr-rack-shadow" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle inferior de la prenda recomendada + motivo (SR-RF-06) + botón "Ver prenda" */}
      <div className="sr-rack-footer">
        <p className="sr-rack-title">{featured.name}</p>
        <p className="sr-rack-meta">
          {featured.brand ? `${featured.brand} · ` : ''}{formatCOP(featured.price)}
        </p>
        {motivoFeatured && (
          <p className="sr-rack-reason">Por qué: {motivoFeatured}</p>
        )}

        <Link
          to={`/catalogo/${featured.itemId}`}
          className="sr-rack-cta"
        >
          Ver prenda
        </Link>
      </div>
    </section>
  )
}

export default RecommendedHangingRack
