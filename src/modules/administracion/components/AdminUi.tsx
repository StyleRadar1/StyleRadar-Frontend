import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { iniciales } from '@/modules/core/components/UserMenu'

/** Encabezado de cada sección del módulo de administración (como el del prototipo). */
export function AdminHeader({ kicker, title, back, children }: { kicker: string; title: string; back?: { to: string; label: string }; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/60">{kicker}</p>
          <h1 className="mt-1 break-words text-5xl font-extrabold tracking-tight md:text-7xl">{title}</h1>
        </div>
        <p aria-hidden="true" className="text-right text-xl font-extrabold leading-none max-sm:hidden">StyleRadar<sup className="text-[10px]">®</sup><span className="mt-1 block border-t border-white/40 pt-1 text-[10px] font-bold uppercase tracking-[.2em] text-white/60">Bogotá</span></p>
      </div>
      {back && <Link to={back.to} className="mt-5 inline-block text-[11px] font-bold uppercase tracking-[.16em] text-white/65 hover:text-blanco"><span aria-hidden="true">← </span>{back.label}</Link>}
      {children}
    </div>
  )
}

const TONO: Record<string, string> = {
  Verificada: 'text-[#9be3b4] border-[#9be3b4]/45', Activa: 'text-[#9be3b4] border-[#9be3b4]/45',
  Pendiente: 'text-arena border-arena/50', 'Periodo gratuito': 'text-lavanda border-lavanda/50',
  Rechazada: 'text-[#ffb4b4] border-[#ffb4b4]/45', Vencida: 'text-[#ffb4b4] border-[#ffb4b4]/45', Inactiva: 'text-[#ffb4b4] border-[#ffb4b4]/45',
}

/** Estado con punto y texto (nunca solo color). */
export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.12em] ${TONO[value] ?? 'border-white/25 text-white/70'}`}>
      <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{value}
    </span>
  )
}

export function Who({ name, sub }: { name: string; sub?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violeta text-[11px] font-bold text-blanco">{iniciales(name)}</span>
      <span className="min-w-0"><b className="block truncate text-sm">{name}</b>{sub && <span className="block truncate text-xs text-white/55">{sub}</span>}</span>
    </span>
  )
}

export function AdminCard({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={`rounded-2xl border border-white/10 bg-white/[.03] p-5 ${className}`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function Dl({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}><dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/55">{k}</dt><dd className="mt-0.5 break-words">{v}</dd></div>
      ))}
    </dl>
  )
}

/** Barras horizontales con el número a la derecha (catálogo de una tienda, donaciones de una fundación). */
export function HBars({ items, unit = '' }: { items: [string, number][]; unit?: string }) {
  const max = Math.max(...items.map(([, v]) => v), 1)
  return (
    <ul className="space-y-3 text-sm">
      {items.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3">
          <span>{k}</span>
          <span aria-hidden="true" className="h-1.5 rounded-full bg-white/10"><span className="block h-full rounded-full bg-violeta-claro" style={{ width: `${(v / max) * 100}%` }} /></span>
          <b className="text-right tabular-nums">{v}{unit}</b>
        </li>
      ))}
    </ul>
  )
}

/* ─── Tabla del administrador: búsqueda, filtros, orden, paginación y tarjetas en celular (RNF-07) ─── */

export interface Columna<T> {
  label: string
  render: (r: T) => ReactNode
  /** Valor para ordenar; sin él la columna no se ordena. */
  sort?: (r: T) => string | number
  num?: boolean
  /** Se oculta en pantallas medianas (sigue en la tarjeta del celular). */
  secundaria?: boolean
}
interface Filtro<T> { label: string; opciones: string[]; get: (r: T) => string }

const POR_PAGINA = 10
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function AdminTable<T>({ rows, columnas, keyOf, titulo, buscar, filtros = [], acciones, herramientas, vacio }: {
  rows: T[]; columnas: Columna<T>[]; keyOf: (r: T) => string; titulo: (r: T) => string
  buscar?: { placeholder: string; texto: (r: T) => string }; filtros?: Filtro<T>[]
  acciones?: (r: T) => ReactNode; herramientas?: ReactNode; vacio: string
}) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string[]>(filtros.map(() => ''))
  const [orden, setOrden] = useState<{ col: number; asc: boolean } | null>(null)
  const [pagina, setPagina] = useState(0)

  const visibles = useMemo(() => {
    let l = rows.filter((r) => (!q || !buscar || norm(buscar.texto(r)).includes(norm(q))) && filtros.every((f, i) => !sel[i] || f.get(r) === sel[i]))
    if (orden) {
      const s = columnas[orden.col].sort!
      l = [...l].sort((a, b) => { const x = s(a), y = s(b); const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es'); return orden.asc ? c : -c })
    }
    return l
  }, [rows, q, sel, orden, buscar, filtros, columnas])
  const paginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA))
  const pag = Math.min(pagina, paginas - 1)
  const pagRows = visibles.slice(pag * POR_PAGINA, (pag + 1) * POR_PAGINA)
  const ordenar = (i: number) => { setOrden((o) => (o?.col === i ? { col: i, asc: !o.asc } : { col: i, asc: true })); setPagina(0) }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03]">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
        {herramientas}
        {buscar && (
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-3">
            <span className="sr-only">Buscar</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-white/50"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPagina(0) }} placeholder={buscar.placeholder} className="w-full bg-transparent py-2.5 text-sm outline-none" />
          </label>
        )}
        {filtros.map((f, i) => (
          <label key={f.label} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-white/60">
            {f.label}
            <select value={sel[i]} onChange={(e) => { setSel((s) => s.map((x, j) => (j === i ? e.target.value : x))); setPagina(0) }}
              className="rounded-lg border border-white/20 bg-grafito px-2 py-2 text-xs font-semibold normal-case tracking-normal text-blanco">
              <option value="">Todos</option>{f.opciones.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
      </div>

      {!visibles.length ? <p className="p-8 text-center text-sm text-white/65">{vacio}</p> : (
        <>
          {/* Escritorio: tabla */}
          <table className="w-full text-left text-sm max-md:hidden">
            <thead className="text-[11px] uppercase tracking-[.14em] text-white/55">
              <tr>
                {columnas.map((c, i) => (
                  <th key={c.label} scope="col" aria-sort={orden?.col === i ? (orden.asc ? 'ascending' : 'descending') : undefined}
                    className={`px-4 py-3 font-bold ${c.num ? 'text-right' : ''} ${c.secundaria ? 'max-lg:hidden' : ''}`}>
                    {c.sort ? <button type="button" onClick={() => ordenar(i)} className="inline-flex items-center gap-1 uppercase hover:text-blanco">{c.label}<span aria-hidden="true">{orden?.col === i ? (orden.asc ? '▲' : '▼') : '↕'}</span></button> : c.label}
                  </th>
                ))}
                {acciones && <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>}
              </tr>
            </thead>
            <tbody>
              {pagRows.map((r) => (
                <tr key={keyOf(r)} className="border-t border-white/10 hover:bg-white/[.03]">
                  {columnas.map((c) => <td key={c.label} className={`px-4 py-3 ${c.num ? 'text-right tabular-nums' : ''} ${c.secundaria ? 'max-lg:hidden' : ''}`}>{c.render(r)}</td>)}
                  {acciones && <td className="px-4 py-3 text-right">{acciones(r)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Celular: tarjetas (RNF-07) */}
          <ul className="divide-y divide-white/10 md:hidden" aria-label="Resultados">
            {pagRows.map((r) => (
              <li key={keyOf(r)} aria-label={titulo(r)} className="space-y-3 p-4">
                {columnas[0].render(r)}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {columnas.slice(1).map((c) => <div key={c.label}><dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/55">{c.label}</dt><dd className="mt-0.5">{c.render(r)}</dd></div>)}
                </dl>
                {acciones && <div>{acciones(r)}</div>}
              </li>
            ))}
          </ul>
          {paginas > 1 && (
            <nav aria-label="Páginas" className="flex justify-center gap-1 border-t border-white/10 p-3">
              {Array.from({ length: paginas }, (_, i) => (
                <button key={i} type="button" aria-current={i === pag ? 'page' : undefined} onClick={() => setPagina(i)}
                  className={`h-8 min-w-8 rounded-lg text-sm font-semibold ${i === pag ? 'bg-blanco text-grafito' : 'border border-white/20'}`}>{i + 1}</button>
              ))}
            </nav>
          )}
        </>
      )}
      <p className="sr-only" role="status">{visibles.length} resultado{visibles.length === 1 ? '' : 's'}</p>
    </div>
  )
}

/** Botón «Editar» que lleva al detalle. */
export function EditLink({ to, name }: { to: string; name: string }) {
  return (
    <Link to={to} aria-label={`Editar ${name}`} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[.05] px-3 py-2 text-sm font-semibold hover:bg-white/10">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M4 20h4L19 9l-4-4L4 16v4z" /></svg>Editar
    </Link>
  )
}

/** Ventana modal accesible (Escape cierra, foco en el primer campo y vuelve al cerrar). */
export function Modal({ open, kicker, title, onClose, children }: { open: boolean; kicker?: string; title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId()
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-2xl rounded-2xl border border-white/15 bg-grafito p-6 shadow-2xl">
        {kicker && <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/60">{kicker}</p>}
        <h2 id={titleId} className="mt-1 text-2xl font-bold">{title}</h2>
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
