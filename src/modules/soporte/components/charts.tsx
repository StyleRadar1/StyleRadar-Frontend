import { useId, useState, type ReactNode } from 'react'
import { card, kicker, pct, SERIE, TEXTURA, tope } from '../utils/charts'

/*
 * Piezas de gráficos de las estadísticas (fundación y administrador), con el diseño del prototipo.
 * Colores de la marca por variable CSS: cambian solos con el tema claro. La paleta es apagada, así que el
 * color nunca va solo: leyenda, números visibles, textura en las porciones claras y vista de tabla.
 * Constantes y utilidades en utils/charts.ts.
 */
export function Kpi({ label, value, hint, delta }: { label: string; value: ReactNode; hint?: string; delta?: { pct: number; up: boolean; vs: string } }) {
  return (
    <div className={card}>
      <p className={kicker}>{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
      {delta && (
        <p className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${delta.up ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'}`}>
          <span aria-hidden="true">{delta.up ? '▲' : '▼'}&nbsp;</span><span className="sr-only">{delta.up ? 'Subió' : 'Bajó'} </span>{delta.pct}% vs. {delta.vs}
        </p>
      )}
      {hint && <p className="mt-1 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}

export function Panel({ title, text, action, children, className = '' }: { title: string; text?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={`${card} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={id} className="font-semibold">{title}</h2>
          {text && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{text}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Muestra de color de la leyenda; con textura cuando la serie la lleva. */
export function Swatch({ i }: { i: number }) {
  const t = TEXTURA[i]
  return <i aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: t ? `repeating-linear-gradient(${t === 'diag' ? 45 : 135}deg, ${SERIE[i]} 0 2px, var(--color-bg) 2px 3.4px)` : SERIE[i] }} />
}

export function Legend({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
      {items.map((label, i) => <li key={label} className="flex items-center gap-1.5"><Swatch i={i} />{label}</li>)}
    </ul>
  )
}

export function TableToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)} className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface)] text-[var(--color-text)]">
      {on ? 'Ver como gráfico' : 'Ver como tabla'}
    </button>
  )
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full text-left text-sm text-[var(--color-text)]">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-[var(--color-surface)] text-[11px] uppercase tracking-[.12em] text-[var(--color-text-muted)]">
          <tr>{head.map((h, i) => <th key={h} scope="col" className={`py-2 font-bold ${i ? 'text-right' : ''}`}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])} className="border-t border-[var(--color-border)]">
              {r.map((c, i) => i === 0
                ? <th key={i} scope="row" className="py-2 font-semibold">{c}</th>
                : <td key={i} className="py-2 text-right tabular-nums">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Barras agrupadas con eje, tooltip por grupo y foco con teclado ─── */

export interface Grupo { key: string; eje: string; titulo: string; valores: number[] }

export function GroupedBars({ grupos, series, fmt = (n) => n.toLocaleString('es-CO'), label, alto = 'h-48' }:
  { grupos: Grupo[]; series: string[]; fmt?: (n: number) => string; label: string; alto?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = tope(Math.max(...grupos.flatMap((g) => g.valores), 0))
  return (
    <>
      <Legend items={series} />
      <div className={`relative mt-3 grid ${alto} grid-cols-[auto_1fr] gap-2`}>
        <div aria-hidden="true" className="flex flex-col justify-between pb-5 text-right text-[10px] tabular-nums text-[var(--color-text-muted)]"><span>{fmt(max)}</span><span>{fmt(max / 2)}</span><span>0</span></div>
        <div className="relative">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--color-border)]" />
          <div aria-hidden="true" className="absolute inset-x-0 top-[calc(50%-10px)] border-t border-dashed border-[var(--color-border)]" />
          <ol className="absolute inset-0 flex items-stretch" aria-label={label}>
            {grupos.map((g, i) => (
              <li key={g.key} tabIndex={0} className="relative flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-violeta-claro"
                aria-label={`${g.titulo}: ${g.valores.map((v, s) => `${series[s]} ${fmt(v)}`).join(', ')}`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                <div className={`flex flex-1 items-end justify-center gap-1 border-b border-[var(--color-border)] px-1 py-1 rounded-t-xl transition ${hover === i ? 'bg-[var(--color-surface)]' : ''}`}>
                  {g.valores.map((v, s) => (
                    <span key={s} className="flex h-full w-3 items-end rounded-full bg-[var(--color-border)]/40 sm:w-4">
                      <span className="w-full rounded-full transition-all duration-300" style={{ height: `${(v / max) * 100}%`, background: SERIE[s], boxShadow: s === 1 ? '0 0 12px rgba(123,77,216,0.45)' : '0 0 10px rgba(232,220,203,0.28)' }} />
                    </span>
                  ))}
                </div>
                <span aria-hidden="true" className="h-5 pt-1 text-center text-[10px] text-[var(--color-text-muted)]">{g.eje}</span>
                {hover === i && (
                  <span role="tooltip" className={`pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2 text-xs shadow-lg ${i > grupos.length / 2 ? 'right-0' : 'left-0'}`}>
                    <b className="block">{g.titulo}</b>
                    {g.valores.map((v, s) => <span key={s} className="flex items-center gap-1.5"><Swatch i={s} />{series[s]} <b className="ml-auto pl-3 tabular-nums">{fmt(v)}</b></span>)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  )
}

/* ─── Medidor de marcas (meta del mes) ─── */

export function Gauge({ value, label, caption }: { value: number; label: string; caption: string }) {
  const marcas = 36
  const llenas = Math.round((Math.min(Math.max(value, 0), 100) / 100) * marcas)
  return (
    <div className="relative mx-auto aspect-square w-52">
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={label}>
        {Array.from({ length: marcas }, (_, i) => {
          // Arco de 270°, de abajo a la izquierda hasta abajo a la derecha
          const a = ((135 + (270 * i) / (marcas - 1)) * Math.PI) / 180
          return <line key={i} x1={100 + 72 * Math.cos(a)} y1={100 + 72 * Math.sin(a)} x2={100 + 92 * Math.cos(a)} y2={100 + 92 * Math.sin(a)}
            stroke={i < llenas ? 'var(--color-arena)' : 'currentColor'} strokeOpacity={i < llenas ? 1 : 0.15} strokeWidth={5} strokeLinecap="round" />
        })}
      </svg>
      <div aria-hidden="true" className="absolute inset-0 grid place-content-center text-center text-[var(--color-text)]">
        <p className="text-4xl font-extrabold">{value}%</p>
        <p className="mx-auto mt-1 max-w-28 text-[11px] leading-tight text-[var(--color-text-muted)]">{caption}</p>
      </div>
    </div>
  )
}

/* ─── Dona con textura y leyenda con porcentajes ─── */

const polar = (r: number, a: number) => [100 + r * Math.cos(a), 100 + r * Math.sin(a)] as const
function arco(a0: number, a1: number, r0: number, r1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1), [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0)
  return `M${x0} ${y0}A${r1} ${r1} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`
}

export function Donut({ data, label, detalle }: { data: { nombre: string; valor: number }[]; label: string; detalle?: (v: number) => string }) {
  const id = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((n, d) => n + d.valor, 0) || 1
  const inicio = (i: number) => -Math.PI / 2 + (data.slice(0, i).reduce((n, d) => n + d.valor, 0) / total) * Math.PI * 2
  const relleno = (i: number) => (TEXTURA[i] ? `url(#${id}-${TEXTURA[i]})` : SERIE[i])

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-[var(--color-text)]">
      <svg viewBox="0 0 200 200" className="w-44" role="img" aria-label={`${label}: ${data.map((d) => `${d.nombre} ${pct(d.valor, total)}%`).join(', ')}`}>
        <defs>
          <pattern id={`${id}-diag`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill={SERIE[2]} /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-bg)" strokeWidth="1.6" /></pattern>
          <pattern id={`${id}-cruz`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)"><rect width="6" height="6" fill={SERIE[3]} /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-bg)" strokeWidth="1.6" /></pattern>
        </defs>
        {data.map((d, i) => (
          <path key={d.nombre} d={arco(inicio(i), inicio(i + 1), 52, hover === i ? 96 : 90)} fill={relleno(i)} stroke="var(--color-bg)" strokeWidth={2}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <title>{`${d.nombre}: ${pct(d.valor, total)}%${detalle ? ` · ${detalle(d.valor)}` : ''}`}</title>
          </path>
        ))}
      </svg>
      <ul className="min-w-40 space-y-2 text-sm text-[var(--color-text)]" aria-label={label}>
        {data.map((d, i) => (
          <li key={d.nombre} className={`flex items-center gap-2 rounded-md px-1 ${hover === i ? 'bg-[var(--color-surface)]' : ''}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <Swatch i={i} />
            <span className="flex-1">{d.nombre}</span>
            {detalle && <span className="text-xs tabular-nums text-[var(--color-text-muted)]">{detalle(d.valor)}</span>}
            <b className="w-10 text-right tabular-nums">{pct(d.valor, total)}%</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
