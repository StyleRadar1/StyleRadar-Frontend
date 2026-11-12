import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import { MyListings } from '../components/MyListings'
import { secondHandService } from '../services/secondHandService'
import { CONSERVACIONES, CONSERVACION_LABEL, TALLAS, type Conservacion, type ListingDto } from '../types/secondhand.dto'
import { inputCls } from '../utils/form'

/** RF-36: explorar segunda mano con filtros; pestaña «Mis publicaciones» para RF-37 a RF-39. */
export default function SecondHandPage() {
  const [params, setParams] = useSearchParams()
  const vista = params.get('vista') === 'mias' ? 'mias' : 'explorar'
  const setVista = (v: string) => { const n = new URLSearchParams(params); if (v === 'mias') n.set('vista', 'mias'); else n.delete('vista'); setParams(n) }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">Segunda vida</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text)] md:text-5xl">Ropa usada de gente de Bogotá</h1>
        <div className="flex gap-2">
          <Link
            to="/segunda-mano/publicar"
            className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-5 py-3 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all shadow-sm"
          >
            Vender una prenda
          </Link>
          <Link
            to="/donar"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-5 py-3 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all"
          >
            Donar
          </Link>
        </div>
      </div>
      <div role="tablist" aria-label="Vistas" className="mt-8 flex gap-2 border-b border-[var(--color-border)]">
        {[['explorar', 'Explorar'], ['mias', 'Mis publicaciones']].map(([v, label]) => (
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
      <div className="mt-6" role="tabpanel">{vista === 'mias' ? <MyListings /> : <Explore />}</div>
    </section>
  )
}

function Explore() {
  const [texto, setTexto] = useState('')
  const [cons, setCons] = useState<Conservacion[]>([])
  const [talla, setTalla] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [list, setList] = useState<ListingDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const nMin = Number(min || 0), nMax = Number(max || 0)
  const priceError = (min && !/^\d+$/.test(min)) || (max && !/^\d+$/.test(max)) ? 'Escribe los precios solo con números.'
    : min && max && nMin > nMax ? 'El precio mínimo no puede ser mayor que el máximo.' : ''
  const filters = useMemo(() => ({ texto: texto || undefined, conservacion: cons, talla: talla || undefined, precioMin: nMin || undefined, precioMax: nMax || undefined }), [texto, cons, talla, nMin, nMax])

  const load = useCallback(() => {
    if (priceError) return
    setLoading(true); setError(null)
    secondHandService.search(filters).then(setList).catch(setError).finally(() => setLoading(false))
  }, [filters, priceError])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const toggle = (c: Conservacion) => setCons((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]))
  const clear = () => { setTexto(''); setCons([]); setTalla(''); setMin(''); setMax('') }
  const active = !!(texto || cons.length || talla || min || max)

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <form role="search" aria-label="Filtros de segunda mano" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1.5"><label htmlFor="sh-q" className="text-sm font-semibold">Buscar</label>
          <input id="sh-q" className={inputCls} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Prenda, marca o categoría" /></div>
        <fieldset><legend className="text-sm font-semibold text-[var(--color-text)]">Estado</legend>
          <div className="mt-2 flex flex-wrap gap-2">{CONSERVACIONES.map((c) => (
            <button key={c} type="button" aria-pressed={cons.includes(c)} onClick={() => toggle(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                cons.includes(c)
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] ring-2 ring-[var(--color-focus-ring)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]'
              }`}>{CONSERVACION_LABEL[c]}</button>))}</div>
        </fieldset>
        <div className="flex flex-col gap-1.5"><label htmlFor="sh-t" className="text-sm font-semibold text-[var(--color-text)]">Talla</label>
          <select id="sh-t" className={inputCls} value={talla} onChange={(e) => setTalla(e.target.value)}><option value="">Todas</option>{TALLAS.map((t) => <option key={t}>{t}</option>)}</select></div>
        <fieldset><legend className="text-sm font-semibold text-[var(--color-text)]">Precio (COP)</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input aria-label="Precio mínimo" inputMode="numeric" className={inputCls} value={min} onChange={(e) => setMin(e.target.value.trim())} placeholder="Mín." aria-invalid={!!priceError} />
            <input aria-label="Precio máximo" inputMode="numeric" className={inputCls} value={max} onChange={(e) => setMax(e.target.value.trim())} placeholder="Máx." aria-invalid={!!priceError} />
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
        {active && <button type="button" onClick={clear} className="text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">Quitar filtros</button>}
      </form>

      <div aria-live="polite">
        {loading ? <Loading label="Buscando prendas…" /> : error ? <ErrorState error={error} onRetry={load} title="No pudimos cargar Segunda vida" />
          : !list.length ? <EmptyState title={active ? 'No hay prendas con esos filtros' : 'Todavía no hay prendas publicadas'}
              action={active ? <button type="button" onClick={clear} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)]">Quitar filtros</button> : undefined}>
              {active ? 'Prueba con otra talla, otro estado o un rango de precio más amplio.' : 'Sé la primera persona en publicar.'}</EmptyState>
          : (<>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">{list.length} prenda{list.length === 1 ? '' : 's'} disponible{list.length === 1 ? '' : 's'}</p>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3" aria-label="Resultados">
              {list.map((l) => (
                <li key={l.id} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                  <div className="aspect-[4/5] bg-[var(--color-surface-subtle)]"><img src={l.fotos[0]} alt={l.titulo} loading="lazy" className="h-full w-full object-cover" /></div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">{CONSERVACION_LABEL[l.conservacion]} · Talla {l.talla}</p>
                    <h3 className="mt-1 font-semibold text-[var(--color-text)]">{l.titulo}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{l.marca} · {l.vendedor.nombre} · {l.barrio}</p>
                    <p className="mt-2 font-semibold text-[var(--color-text)]">{formatCOP(l.precio)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>)}
      </div>
    </div>
  )
}
