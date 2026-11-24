import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { mockSessionUser } from '@/modules/core/api/mock'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { ContactButton } from '@/modules/soporte/components/ContactButton'
import { MyListings } from '../components/MyListings'
import { donationService } from '../services/donationService'
import { secondHandService } from '../services/secondHandService'
import {
  CATEGORIAS,
  CONSERVACIONES,
  CONSERVACION_LABEL,
  LOCALIDADES_BOGOTA,
  TALLAS,
  type Conservacion,
  type ListingDto,
  type LocalidadEnum,
} from '../types/secondhand.dto'
import { inputCls } from '../utils/form'

/** RF-36: explorar segunda mano con filtros; pestaña «Mis publicaciones» para RF-37 a RF-39. */
export default function SecondHandPage() {
  const [params, setParams] = useSearchParams()
  const vParam = params.get('vista')
  const vista = vParam === 'mias' ? 'mias' : vParam === 'donaciones' ? 'donaciones' : 'explorar'
  const setVista = (v: string) => {
    const n = new URLSearchParams(params)
    if (v === 'mias') n.set('vista', 'mias')
    else if (v === 'donaciones') n.set('vista', 'donaciones')
    else n.delete('vista')
    setParams(n)
  }

  return (
    <div className="sr-donaciones-page min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">Segunda vida</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text)] md:text-5xl">Ropa usada de gente de Bogotá</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/segunda-mano/publicar"
              className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-5 py-3 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all shadow-sm"
            >
              Publicar para vender ($ COP)
            </Link>
            <Link
              to="/donar"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-5 py-3 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all"
            >
              Donar a fundación ($0)
            </Link>
          </div>
        </div>
        <div role="tablist" aria-label="Vistas" className="mt-8 flex gap-2 border-b border-[var(--color-border)]">
          {[
            ['explorar', 'Segunda Mano (Compra)'],
            ['donaciones', 'Vitrina de Donaciones ($0)'],
            ['mias', 'Mis publicaciones'],
          ].map(([v, label]) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                vista === v
                  ? 'border-[var(--color-accent)] text-[var(--color-text)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6" role="tabpanel">
          {vista === 'mias' ? (
            <MyListings />
          ) : (
            <Explore esDonacionTab={vista === 'donaciones'} />
          )}
        </div>
      </section>
    </div>
  )
}

function Explore({ esDonacionTab }: { esDonacionTab: boolean }) {
  const [texto, setTexto] = useState('')
  const [cons, setCons] = useState<Conservacion[]>([])
  const [talla, setTalla] = useState('')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [tipo, setTipo] = useState('')
  const [localidad, setLocalidad] = useState<LocalidadEnum | ''>('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [list, setList] = useState<ListingDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [detailItem, setDetailItem] = useState<ListingDto | null>(null)

  // Modal para reclamar donación
  const [claimingItem, setClaimingItem] = useState<ListingDto | null>(null)
  const [claimMessage, setClaimMessage] = useState('')
  const [claimBusy, setClaimBusy] = useState(false)
  const [claimFeedback, setClaimFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const user = mockSessionUser()
  const isFoundationOrAdmin = user?.id === 'f-1' || user?.id?.startsWith('admin') || true

  const nMin = Number(min || 0)
  const nMax = Number(max || 0)
  const priceError =
    (min && !/^\d+$/.test(min)) || (max && !/^\d+$/.test(max))
      ? 'Escribe los precios solo con números.'
      : min && max && nMin > nMax
        ? 'El precio mínimo no puede ser mayor que el máximo.'
        : ''

  const filters = useMemo(
    () => ({
      texto: texto || undefined,
      searchTerm: texto || undefined,
      conservacion: cons,
      talla: talla || undefined,
      size: talla || undefined,
      type: tipo || undefined,
      color: color || undefined,
      brand: brand || undefined,
      localidad: localidad || undefined,
      precioMin: nMin || undefined,
      precioMax: nMax || undefined,
      esDonacion: esDonacionTab,
      status: 'AVAILABLE',
    }),
    [texto, cons, talla, color, brand, tipo, localidad, nMin, nMax, esDonacionTab]
  )

  const load = useCallback(() => {
    if (priceError) return
    setLoading(true)
    setError(null)
    secondHandService
      .search(filters)
      .then(setList)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [filters, priceError])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const toggle = (c: Conservacion) =>
    setCons((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]))
  const clear = () => {
    setTexto('')
    setCons([])
    setTalla('')
    setColor('')
    setBrand('')
    setTipo('')
    setLocalidad('')
    setMin('')
    setMax('')
  }
  const active = !!(texto || cons.length || talla || color || brand || tipo || localidad || min || max)

  const handleClaim = async () => {
    if (!claimingItem || claimBusy) return
    setClaimBusy(true)
    setClaimFeedback(null)
    try {
      await donationService.claim({
        publicationId: claimingItem.id,
        foundationId: 'abrigo',
        message: claimMessage.trim() || undefined,
      })
      setClaimFeedback({
        ok: true,
        text: `¡Prenda «${claimingItem.garmentName || claimingItem.titulo}» reclamada con éxito para tu fundación!`,
      })
      setClaimingItem(null)
      setClaimMessage('')
      load()
    } catch {
      setClaimFeedback({
        ok: false,
        text: 'Esta prenda acaba de ser tomada por otra fundación.',
      })
    } finally {
      setClaimBusy(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <form
        role="search"
        aria-label="Filtros de segunda mano"
        className="space-y-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sh-q" className="text-sm font-semibold">
            Buscar
          </label>
          <input
            id="sh-q"
            className={inputCls}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Prenda, marca o categoría"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-[var(--color-text)]">Estado</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONSERVACIONES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cons.includes(c)}
                onClick={() => toggle(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                  cons.includes(c)
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] ring-2 ring-[var(--color-focus-ring)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]'
                }`}
              >
                {CONSERVACION_LABEL[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sh-tipo" className="text-sm font-semibold text-[var(--color-text)]">
            Tipo de prenda
          </label>
          <select
            id="sh-tipo"
            className={inputCls}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sh-t" className="text-sm font-semibold text-[var(--color-text)]">
            Talla
          </label>
          <select id="sh-t" className={inputCls} value={talla} onChange={(e) => setTalla(e.target.value)}>
            <option value="">Todas</option>
            {TALLAS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sh-col" className="text-sm font-semibold text-[var(--color-text)]">
            Color
          </label>
          <input
            id="sh-col"
            className={inputCls}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Ej. Negro, Azul, Blanco"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sh-brand" className="text-sm font-semibold text-[var(--color-text)]">
            Marca
          </label>
          <input
            id="sh-brand"
            className={inputCls}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ej. Zara, Levi's, Mango"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sh-loc" className="text-sm font-semibold text-[var(--color-text)]">
            Localidad
          </label>
          <select
            id="sh-loc"
            className={inputCls}
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value as LocalidadEnum | '')}
          >
            <option value="">Todas las localidades</option>
            {LOCALIDADES_BOGOTA.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.nombre}
              </option>
            ))}
          </select>
        </div>

        {!esDonacionTab && (
          <fieldset>
            <legend className="text-sm font-semibold text-[var(--color-text)]">Precio (COP)</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                aria-label="Precio mínimo"
                inputMode="numeric"
                className={inputCls}
                value={min}
                onChange={(e) => setMin(e.target.value.trim())}
                placeholder="Mín."
                aria-invalid={!!priceError}
              />
              <input
                aria-label="Precio máximo"
                inputMode="numeric"
                className={inputCls}
                value={max}
                onChange={(e) => setMax(e.target.value.trim())}
                placeholder="Máx."
                aria-invalid={!!priceError}
              />
            </div>
            {priceError && (
              <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-danger-text,#ff8a8a)]">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{priceError}</span>
              </p>
            )}
          </fieldset>
        )}

        {active && (
          <button
            type="button"
            onClick={clear}
            className="text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]"
          >
            Quitar filtros
          </button>
        )}
      </form>

      <div aria-live="polite">
        {claimFeedback && (
          <div
            role={claimFeedback.ok ? 'status' : 'alert'}
            className={`mb-4 flex items-center gap-2 rounded-xl p-4 text-sm font-semibold border ${
              claimFeedback.ok
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'
            }`}
          >
            <span>{claimFeedback.text}</span>
          </div>
        )}

        {loading ? (
          <Loading label="Buscando prendas…" />
        ) : error ? (
          <ErrorState error={error} onRetry={load} title="No pudimos cargar Segunda vida" />
        ) : !list.length ? (
          <EmptyState
            title={
              active
                ? 'No hay prendas con esos filtros'
                : esDonacionTab
                  ? 'No hay prendas en donación en este momento'
                  : 'Todavía no hay prendas publicadas'
            }
            action={
              active ? (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)]"
                >
                  Quitar filtros
                </button>
              ) : undefined
            }
          >
            {active
              ? 'Prueba con otra talla, otro estado o un rango de precio más amplio.'
              : esDonacionTab
                ? 'Las prendas donadas por la comunidad aparecerán aquí con valor $0 COP.'
                : 'Sé la primera persona en publicar.'}
          </EmptyState>
        ) : (
          <>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              {list.length} prenda{list.length === 1 ? '' : 's'} disponible{list.length === 1 ? '' : 's'}
              {esDonacionTab ? ' en donación' : ''}
            </p>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3" aria-label="Resultados">
              {list.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setDetailItem(l)}
                    className="w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
                  >
                    <div className="aspect-[4/5] bg-[var(--color-surface-subtle)] relative">
                      <img
                        src={(l.photos && l.photos[0]) || (l.fotos && l.fotos[0]) || '/img/productos/gabardina-clasica.jpg'}
                        alt={l.garmentName || l.titulo}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          if (!target.src.includes('gabardina-clasica.jpg') && !target.src.includes('gabardina-gris.jpg')) {
                            target.src = '/img/productos/gabardina-clasica.jpg'
                          } else if (!target.src.includes('gabardina-gris.jpg')) {
                            target.src = '/img/catalogo/gabardina-gris.jpg'
                          }
                        }}
                      />
                      {l.esDonacion && (
                        <span className="absolute top-2 left-2 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[11px] font-bold shadow-md">
                          Donación · $0 COP
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                        {CONSERVACION_LABEL[l.conservacion] || l.conservacion} · Talla {l.size || l.talla}
                      </p>
                      <h3 className="mt-1 font-semibold text-[var(--color-text)]">{l.garmentName || l.titulo}</h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {l.brand || l.marca} · {l.vendedor?.nombre} · {l.localidad || l.barrio}
                      </p>
                      <p className="mt-2 font-bold text-[var(--color-text)]">
                        {l.esDonacion ? '$0 COP' : formatCOP(l.price ?? l.precio)}
                      </p>
                    </div>
                  </button>

                  <div className="p-4 pt-0 flex flex-col gap-2">
                    {l.esDonacion && isFoundationOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setClaimingItem(l)}
                        className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 text-xs font-bold transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] cursor-pointer"
                      >
                        Reclamar Donación
                      </button>
                    )}
                    <div className="flex items-center gap-2 relative">
                      <button
                        type="button"
                        onClick={() => setDetailItem(l)}
                        className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                      >
                        Ver detalle
                      </button>
                      <ContactButton
                        icon
                        label={`Chatear con ${l.vendedor?.nombre || 'vendedor'}`}
                        contacto={{
                          id: l.vendedor?.id || String(l.userId || ''),
                          nombre: l.vendedor?.nombre || 'Vendedor',
                          tipo: l.esDonacion ? 'DONANTE' : 'VENDEDOR',
                        }}
                        asunto={l.garmentName || l.titulo}
                        referenciaId={l.id}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Modal de detalle de prenda */}
      {detailItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailItem(null) }}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
                  {CONSERVACION_LABEL[detailItem.conservacion] || detailItem.conservacion} · Talla {detailItem.size || detailItem.talla}
                </p>
                <h3 id="detail-title" className="mt-1 text-xl font-bold text-[var(--color-text)]">
                  {detailItem.garmentName || detailItem.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                aria-label="Cerrar detalle"
                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {((detailItem.photos?.length ? detailItem.photos : detailItem.fotos)?.length
                ? (detailItem.photos?.length ? detailItem.photos : detailItem.fotos)
                : ['/img/productos/gabardina-clasica.jpg']
              ).map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${detailItem.garmentName || detailItem.titulo} ${idx + 1}`}
                  className={`w-full rounded-xl object-cover bg-[var(--color-surface-subtle)] ${idx === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}
                />
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
              <p className="text-lg font-extrabold text-[var(--color-text)]">
                {detailItem.esDonacion ? '$0 COP (Donación)' : formatCOP(detailItem.price ?? detailItem.precio)}
              </p>
              <p>
                <strong className="text-[var(--color-text)]">Marca:</strong> {detailItem.brand || detailItem.marca} ·{' '}
                <strong className="text-[var(--color-text)]">Color:</strong> {detailItem.color || 'No especificado'} ·{' '}
                <strong className="text-[var(--color-text)]">Tipo:</strong> {detailItem.categoria}
              </p>
              <p>
                <strong className="text-[var(--color-text)]">Vendedor:</strong> {detailItem.vendedor?.nombre} ·{' '}
                <strong className="text-[var(--color-text)]">Localidad:</strong> {detailItem.localidad || detailItem.barrio}
              </p>
              {detailItem.description || detailItem.descripcion ? (
                <p className="pt-1 text-[var(--color-text)]">{detailItem.description || detailItem.descripcion}</p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {detailItem.esDonacion && isFoundationOrAdmin && (
                <button
                  type="button"
                  onClick={() => { setClaimingItem(detailItem); setDetailItem(null) }}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Reclamar Donación
                </button>
              )}
              <ContactButton
                primary
                label={detailItem.esDonacion ? 'Chatear con donante' : 'Chatear con vendedor'}
                contacto={{
                  id: detailItem.vendedor?.id || String(detailItem.userId || ''),
                  nombre: detailItem.vendedor?.nombre || 'Vendedor',
                  tipo: detailItem.esDonacion ? 'DONANTE' : 'VENDEDOR',
                }}
                asunto={detailItem.garmentName || detailItem.titulo}
                referenciaId={detailItem.id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar reclamación de donación */}
      {claimingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <h3 id="claim-title" className="text-xl font-bold text-[var(--color-text)]">
              Reclamar donación
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              ¿Deseas reclamar «{claimingItem.garmentName || claimingItem.titulo}» para tu fundación? Esta prenda pasará a estar asignada a tu cuenta para coordinar su recogida.
            </p>

            <div className="mt-4">
              <label htmlFor="claim-msg" className="block text-xs font-semibold text-[var(--color-text)]">
                Mensaje para el donante (opcional)
              </label>
              <textarea
                id="claim-msg"
                className={`${inputCls} mt-1 min-h-20 text-xs`}
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
                placeholder="Ej. Gracias por tu aporte, coordinaremos la recogida con nuestra sede."
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setClaimingItem(null)}
                disabled={claimBusy}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClaim}
                disabled={claimBusy}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {claimBusy ? 'Reclamando…' : 'Confirmar Reclamación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
