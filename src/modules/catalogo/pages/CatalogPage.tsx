import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ItemCard } from '../components/ItemCard'
import { useItems } from '../hooks/useItems'
import type { Estilo } from '../types/item.dto'
import './CatalogPage.css'

const ESTILOS: Estilo[] = ['Sastre', 'Calle', 'Futuro', 'Rebelde', 'Esencial']
const DISC_COVERS: Record<Estilo, { image: string; tone: string }> = {
  Sastre: { image: '/img/productos/blazer-oversize.jpg', tone: '#8c63c7' },
  Calle: { image: '/img/productos/hoodie-azul-noche.jpg', tone: '#5426a2' },
  Futuro: { image: '/img/productos/chaqueta-de-nylon.jpg', tone: '#a17adc' },
  Rebelde: { image: '/img/productos/r2c3-chaqueta-cuero.jpg', tone: '#6f35b4' },
  Esencial: { image: '/img/productos/sueter-de-canale-crudo.jpg', tone: '#c1a1ec' },
}

/** RF-07 a RF-13: búsqueda y filtros. Ejemplo completo del patrón página → hook → servicio. */
export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const [texto, setTexto] = useState(params.get('q') ?? '')
  const estilo = (params.get('estilo') as Estilo | null) ?? undefined
  const { items, loading, error } = useItems({ texto: params.get('q') ?? undefined, estilo })

  const setEstilo = (e?: Estilo) => {
    const next = new URLSearchParams(params)
    if (e) next.set('estilo', e); else next.delete('estilo')
    setParams(next)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Catálogo</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Prendas en tiendas de Bogotá</h1>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); const n = new URLSearchParams(params); if (texto) n.set('q', texto); else n.delete('q'); setParams(n) }}
      >
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca una prenda, color o tienda" aria-label="Buscar"
          className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violeta-claro" />
        <button className="rounded-xl bg-violeta px-5 text-sm font-semibold">Buscar</button>
      </form>
      <section className="catalog-disc-section" aria-labelledby="catalog-disc-heading">
        <div className="catalog-disc-heading-row">
          <div>
            <p className="catalog-disc-eyebrow">Lado A · encuentra tu sonido</p>
            <h2 id="catalog-disc-heading">Explora por estilo</h2>
          </div>
          <span>Elige un disco para filtrar las prendas</span>
        </div>
        <div className="catalog-disc-list" role="group" aria-label="Filtrar prendas por estilo">
          <button type="button" aria-pressed={!estilo} onClick={() => setEstilo()} className={`catalog-disc-option${!estilo ? ' is-selected' : ''}`}>
            <span className="catalog-vinyl" style={{ '--disc-tone': '#48119a' } as React.CSSProperties}>
              <span className="catalog-vinyl-label catalog-vinyl-label-all"><b>SR</b></span>
            </span>
            <span className="catalog-disc-name">Todos</span>
            <span className="catalog-disc-caption">Catálogo completo</span>
          </button>
          {ESTILOS.map((e) => (
            <button key={e} type="button" aria-pressed={estilo === e} onClick={() => setEstilo(e)} className={`catalog-disc-option${estilo === e ? ' is-selected' : ''}`}>
              <span className="catalog-vinyl" style={{ '--disc-tone': DISC_COVERS[e].tone } as React.CSSProperties}>
                <span className="catalog-vinyl-label"><img src={DISC_COVERS[e].image} alt="" loading="lazy" /></span>
              </span>
              <span className="catalog-disc-name">{e}</span>
              <span className="catalog-disc-caption">Ver prendas</span>
            </button>
          ))}
        </div>
      </section>
      {error && <p role="alert" className="mt-8 text-[#ffb4b4]">{error}</p>}
      {loading ? (
        <p className="mt-8 text-white/60">Buscando prendas…</p>
      ) : items.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((it) => <ItemCard key={it.id} item={it} />)}</div>
      ) : (
        <p className="mt-8 text-white/70">No encontramos prendas con esa búsqueda. Prueba con otro estilo o palabra.</p>
      )}
    </section>
  )
}
