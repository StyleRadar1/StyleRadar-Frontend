import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorMessage } from '@/modules/core/api/errors'
import { ErrorBanner } from '@/modules/core/components/ErrorFeedback'
import { ItemCard } from '@/modules/catalogo/components/ItemCard'
import { ItemGridSkeleton } from '@/modules/catalogo/components/ItemCardSkeleton'
import { AuthContext } from '../states/authContext'
import { aTarjeta, feedService, motivoDe } from '../services/feedService'
import { usuarioService } from '../services/usuarioService'
import { TEXTOS_FEED, type FeedItemDto, type RecommendationsPageDto } from '../types/feed.dto'
import type { PerfilDto } from '../types/usuario.dto'

/** Prendas por página en cada sección (el documento permite de 1 a 20). */
export const PARA_TI_SIZE = 8

const textoError = (e: unknown) => (e instanceof ApiError && e.status === 503 ? TEXTOS_FEED.catalogoCaido : errorMessage(e))
const BTN = 'rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)] disabled:opacity-60'

/** SR-RF-05 y 06: «Para ti» y «Recomendado para ti». Solo para compradores con sesión. */
export function ParaTiSections() {
  const user = useContext(AuthContext)?.user
  if (!user || user.role !== 'BUYER') return null
  return <Secciones key={user.id} userId={String(user.id)} />
}

function Secciones({ userId }: { userId: string }) {
  return (
    <div className="mb-10 grid gap-10">
      <Recomendado userId={userId} />
      <ParaTiFeed userId={userId} />
    </div>
  )
}

function Titulo({ id, kicker, children }: { id: string; kicker: string; children: string }) {
  return (
    <div className="mb-4">
      <span className="text-[0.6875rem] font-bold uppercase tracking-[.2em] text-[var(--color-text-muted)]">{kicker}</span>
      <h2 id={id} className="mt-1 text-2xl font-black tracking-tight text-[var(--color-text)]">{children}</h2>
    </div>
  )
}

/** SR-RF-05: feed paginado, primero lo que coincide con su talla y estilo y luego lo más reciente. */
export function ParaTiFeed({ userId, showHeader = true }: { userId: string; showHeader?: boolean }) {
  const [items, setItems] = useState<FeedItemDto[]>([])
  const [page, setPage] = useState(0)
  const [last, setLast] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const version = useRef(0)

  const cargar = useCallback(async (p: number) => {
    const v = ++version.current
    setLoading(true); setError('')
    try {
      const r = await feedService.getFeed(userId, { page: p, size: PARA_TI_SIZE })
      if (v !== version.current) return
      setItems((prev) => (p === 0 ? r.content : [...prev, ...r.content.filter((n) => !prev.some((x) => x.itemId === n.itemId))]))
      setPage(r.page); setLast(r.last)
    } catch (e) {
      if (v === version.current) setError(textoError(e))
    } finally { if (v === version.current) setLoading(false) }
  }, [userId])

  useEffect(() => { cargar(0) }, [cargar])

  return (
    <section {...(showHeader ? { 'aria-labelledby': 'para-ti-titulo' } : { 'aria-label': 'Para ti' })}>
      {showHeader ? (
        <Titulo id="para-ti-titulo" kicker="En tu talla y tu estilo">Para ti</Titulo>
      ) : (
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          En tu talla y tu estilo: primero lo que coincide con tu perfil y luego lo más reciente.
        </p>
      )}
      {error && (
        <ErrorBanner className="mb-4" tone="warn" icon="refresh" title={error}
          actions={<button type="button" className={BTN} onClick={() => cargar(items.length ? page + 1 : 0)}>Reintentar</button>} />
      )}
      {loading && !items.length ? <ItemGridSkeleton count={4} /> : items.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((i) => <ItemCard key={i.itemId} item={aTarjeta(i)} />)}
        </div>
      ) : !error ? <p className="text-sm text-[var(--color-text-muted)]">Todavía no hay prendas disponibles en el catálogo.</p> : null}
      {!last && items.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button type="button" className={BTN} disabled={loading} onClick={() => cargar(page + 1)}>{loading ? 'Cargando…' : 'Ver más prendas'}</button>
        </div>
      )}
    </section>
  )
}

/** SR-RF-06: prendas que más se ajustan al perfil, cada una con su motivo (RN-03). */
function Recomendado({ userId }: { userId: string }) {
  const [data, setData] = useState<RecommendationsPageDto | null>(null)
  const [perfil, setPerfil] = useState<PerfilDto | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const r = await feedService.getRecommendations(userId, { page: 0, size: PARA_TI_SIZE })
      setData(r)
      // Mientras el back no envíe reason (P-04), el motivo se arma con el perfil.
      if (r.content.some((i) => !i.reason?.trim())) setPerfil(await usuarioService.get(userId).catch(() => null))
    } catch (e) { setError(textoError(e)) } finally { setLoading(false) }
  }, [userId])

  useEffect(() => { cargar() }, [cargar])

  return (
    <section aria-labelledby="recomendado-titulo">
      <Titulo id="recomendado-titulo" kicker="Según tu perfil de estilo">Recomendado para ti</Titulo>
      {loading ? <ItemGridSkeleton count={4} /> : error ? (
        <ErrorBanner tone="warn" icon="refresh" title={error} actions={<button type="button" className={BTN} onClick={cargar}>Reintentar</button>} />
      ) : data?.generalWithoutPreferences || !data?.content.length ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text)]">
          <p>{data?.message || TEXTOS_FEED.sinPreferencias}</p>
          <Link to="/perfil" className="mt-3 inline-block font-semibold text-[var(--color-accent)] underline">Actualizar mi perfil</Link>
        </div>
      ) : (
        <>
          {data.message && <p className="mb-3 text-sm text-[var(--color-text-muted)]" role="status">{data.message}</p>}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.content.map((i) => {
              const motivo = motivoDe(i, perfil)
              return (
                <li key={i.itemId} className="flex flex-col gap-2">
                  <ItemCard item={aTarjeta(i)} />
                  {motivo && <p className="text-xs font-semibold text-[var(--color-accent)]">Por qué: {motivo}</p>}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
