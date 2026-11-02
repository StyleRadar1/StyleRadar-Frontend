import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ItemCard } from '../components/ItemCard'
import { useItems } from '../hooks/useItems'
import type { Estilo } from '../types/item.dto'

const ESTILOS: Estilo[] = ['Sastre', 'Calle', 'Futuro', 'Rebelde', 'Esencial']

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
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setEstilo()} className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${!estilo ? 'border-arena bg-arena text-grafito' : 'border-white/20'}`}>Todos</button>
        {ESTILOS.map((e) => (
          <button key={e} onClick={() => setEstilo(e)} className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${estilo === e ? 'border-arena bg-arena text-grafito' : 'border-white/20'}`}>{e}</button>
        ))}
      </div>
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
