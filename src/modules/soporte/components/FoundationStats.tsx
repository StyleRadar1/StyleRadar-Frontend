import { useId, useState, type ReactNode } from 'react'
import { ErrorState, EmptyState, Loading } from '@/modules/core/components/Status'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { useFoundationMonths, useFoundationStats } from '../hooks/useStats'
import type { FoundationMonthDto, FoundationStatsDto } from '../types/stats.dto'

/*
 * Estadísticas de la fundación (RF-82 a 85) con el diseño del prototipo.
 * Colores de la marca por variable CSS (cambian solos con el tema claro). Como la paleta es apagada,
 * el color nunca va solo: cada serie lleva leyenda, número visible, textura en la torta y vista de tabla.
 * Orden fijo de categorías validado para daltonismo: arena → violeta claro → lavanda → blanco.
 */
const SERIE = ['var(--color-arena)', 'var(--color-violeta-claro)', 'var(--color-lavanda)', 'var(--color-blanco)'] as const
const TEXTURA = [null, null, 'diag', 'cruz'] as const

const card = 'rounded-2xl border border-white/10 bg-white/[.03] p-5'
const kicker = 'text-[11px] font-bold uppercase tracking-[.16em] text-white/60'
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

export function FoundationStatsView() {
  const { user } = useAuth()
  const { data: stats, loading, error, reload } = useFoundationStats()
  const { data: months } = useFoundationMonths()
  const nombre = user?.name.replace(/^Fundación /, '') ?? 'tu fundación'

  if (loading) return <Loading label="Cargando estadísticas de tu fundación…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!stats) return <EmptyState title="Sin datos">Cuando recibas donaciones, verás los indicadores aquí.</EmptyState>

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Estadísticas de tu fundación</h1>
          <p className="mt-2 text-sm text-white/70">Donaciones y solicitudes recibidas por {nombre} · Solo tú y StyleRadar ven estos datos.</p>
        </div>
        <button type="button" onClick={() => exportar(nombre, stats, months)} className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">
          Exportar a Excel
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Prendas recibidas en total" value={stats.totalPrendasRecibidas} hint="Impacto acumulado" />
        <Kpi label="Donaciones de tiendas aliadas" value={stats.donaciones.deTiendas} hint="Lotes de prendas nuevas y saldos" />
        <Kpi label="Donaciones de personas" value={stats.donaciones.dePersonas} hint="Ropa entregada por la comunidad" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {months.length > 0 && <MonthlyRequests months={months} />}
        <MonthlyGoal meta={stats.meta} />
        <ByType data={stats.porTipo} />
        <ByStatus data={stats.porEstado} />
      </div>
    </>
  )
}

function Kpi({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className={card}>
      <p className={kicker}>{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value.toLocaleString('es-CO')}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/55">{hint}</p>
    </div>
  )
}

function Panel({ title, text, action, children }: { title: string; text: string; action?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={id} className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-white/60">{text}</p>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/75">
      {items.map((i) => <li key={i.label} className="flex items-center gap-1.5"><i aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />{i.label}</li>)}
    </ul>
  )
}

/* ─── Solicitudes por mes: barras agrupadas (personas y tiendas) con tooltip y vista de tabla ─── */

function MonthlyRequests({ months }: { months: FoundationMonthDto[] }) {
  const [tabla, setTabla] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...months.flatMap((m) => [m.personas, m.tiendas]), 1)
  // Tope par para que la marca del medio sea un número entero
  const tope = Math.ceil(max / 10) * 10

  return (
    <Panel title="Solicitudes por mes" text={`Origen de las solicitudes de donación en los últimos ${months.length} meses.`}
      action={<button type="button" aria-pressed={tabla} onClick={() => setTabla((t) => !t)} className="shrink-0 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">{tabla ? 'Ver como gráfico' : 'Ver como tabla'}</button>}>
      {tabla ? (
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Detalle de solicitudes mensuales</caption>
          <thead className="text-[11px] uppercase tracking-[.12em] text-white/55">
            <tr><th scope="col" className="py-2 font-bold">Mes</th><th scope="col" className="py-2 text-right font-bold">De personas</th><th scope="col" className="py-2 text-right font-bold">De tiendas</th><th scope="col" className="py-2 text-right font-bold">Total</th></tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.mes} className="border-t border-white/10">
                <th scope="row" className="py-2 font-semibold">{m.etiqueta}</th>
                <td className="py-2 text-right tabular-nums">{m.personas}</td>
                <td className="py-2 text-right tabular-nums">{m.tiendas}</td>
                <td className="py-2 text-right font-semibold tabular-nums">{m.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <Legend items={[{ label: 'De personas', color: SERIE[0] }, { label: 'De tiendas', color: SERIE[1] }]} />
          <div className="relative mt-3 grid h-48 grid-cols-[auto_1fr] gap-2">
            <div aria-hidden="true" className="flex flex-col justify-between pb-5 text-right text-[10px] tabular-nums text-white/45"><span>{tope}</span><span>{tope / 2}</span><span>0</span></div>
            <div className="relative">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-white/10" />
              <div aria-hidden="true" className="absolute inset-x-0 top-[calc(50%-10px)] border-t border-dashed border-white/10" />
              <ol className="absolute inset-0 flex items-stretch" aria-label="Solicitudes por mes">
                {months.map((m, i) => (
                  <li key={m.mes} className="relative flex flex-1 flex-col"
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                    tabIndex={0} aria-label={`${m.etiqueta}: ${m.personas} de personas y ${m.tiendas} de tiendas`}>
                    <div className={`flex flex-1 items-end justify-center gap-[2px] border-b border-white/25 ${hover === i ? 'bg-white/[.04]' : ''}`}>
                      {[m.personas, m.tiendas].map((v, s) => (
                        <span key={s} className="w-3 rounded-t-[4px] sm:w-4" style={{ height: `${(v / tope) * 100}%`, background: SERIE[s] }} />
                      ))}
                    </div>
                    <span aria-hidden="true" className="h-5 pt-1 text-center text-[10px] text-white/55">{m.mes}</span>
                    {hover === i && (
                      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-grafito px-3 py-2 text-xs shadow-lg">
                        <b className="block">{m.etiqueta}</b>
                        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: SERIE[0] }} />Personas {m.personas}</span>
                        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: SERIE[1] }} />Tiendas {m.tiendas}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}

/* ─── Meta mensual: medidor de marcas (como el prototipo), sin el «NaN%» que mostraba el HTML ─── */

function MonthlyGoal({ meta }: { meta: FoundationStatsDto['meta'] }) {
  const p = pct(meta.recibidas, meta.objetivo)
  const marcas = 36
  const llenas = Math.round((Math.min(p, 100) / 100) * marcas)
  return (
    <Panel title="Meta mensual de prendas" text={`${meta.recibidas} de ${meta.objetivo} prendas recibidas en ${meta.etiqueta} (${p}%).`}>
      <div className="relative mx-auto aspect-square w-52">
        <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`Meta de prendas de ${meta.etiqueta}: ${p}% alcanzado`}>
          {Array.from({ length: marcas }, (_, i) => {
            // Arco de 270°, desde abajo a la izquierda hasta abajo a la derecha
            const a = ((135 + (270 * i) / (marcas - 1)) * Math.PI) / 180
            const [r0, r1] = [72, 92]
            return <line key={i} x1={100 + r0 * Math.cos(a)} y1={100 + r0 * Math.sin(a)} x2={100 + r1 * Math.cos(a)} y2={100 + r1 * Math.sin(a)}
              stroke={i < llenas ? 'var(--color-arena)' : 'currentColor'} strokeOpacity={i < llenas ? 1 : 0.15} strokeWidth={5} strokeLinecap="round" />
          })}
        </svg>
        <div aria-hidden="true" className="absolute inset-0 grid place-content-center text-center">
          <p className="text-4xl font-extrabold">{p}%</p>
          <p className="mx-auto mt-1 max-w-28 text-[11px] leading-tight text-white/60">de la meta de {meta.etiqueta}</p>
        </div>
      </div>
    </Panel>
  )
}

/* ─── Prendas por tipo: dona con textura y leyenda con porcentajes ─── */

const polar = (r: number, a: number) => [100 + r * Math.cos(a), 100 + r * Math.sin(a)] as const
function arco(a0: number, a1: number, r0: number, r1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1), [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0)
  return `M${x0} ${y0}A${r1} ${r1} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`
}

function ByType({ data }: { data: FoundationStatsDto['porTipo'] }) {
  const id = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((n, d) => n + d.pct, 0) || 1
  const inicio = (i: number) => -Math.PI / 2 + (data.slice(0, i).reduce((n, d) => n + d.pct, 0) / total) * Math.PI * 2
  const slices = data.map((d, i) => ({ ...d, i, a0: inicio(i), a1: inicio(i + 1) }))

  return (
    <Panel title="Prendas por tipo" text="Qué tipo de ropa llega con más frecuencia a la fundación.">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <svg viewBox="0 0 200 200" className="w-44" role="img" aria-label={`Prendas por tipo: ${data.map((d) => `${d.tipo} ${d.pct}%`).join(', ')}`}>
          <defs>
            <pattern id={`${id}-diag`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill={SERIE[2]} /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-fondo)" strokeWidth="1.6" /></pattern>
            <pattern id={`${id}-cruz`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)"><rect width="6" height="6" fill={SERIE[3]} /><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-fondo)" strokeWidth="1.6" /></pattern>
          </defs>
          {slices.map((s) => (
            <path key={s.tipo} d={arco(s.a0, s.a1, 52, hover === s.i ? 96 : 90)} fill={TEXTURA[s.i] ? `url(#${id}-${TEXTURA[s.i]})` : SERIE[s.i]}
              stroke="var(--color-fondo)" strokeWidth={2} onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)}>
              <title>{`${s.tipo}: ${s.pct}%`}</title>
            </path>
          ))}
        </svg>
        <ul className="min-w-40 space-y-2 text-sm" aria-label="Prendas por tipo">
          {data.map((d, i) => (
            <li key={d.tipo} className={`flex items-center gap-2 rounded-md px-1 ${hover === i ? 'bg-white/[.06]' : ''}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* La muestra lleva la misma textura de su porción */}
              <i aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: TEXTURA[i]
                ? `repeating-linear-gradient(${TEXTURA[i] === 'diag' ? 45 : 135}deg, ${SERIE[i]} 0 2px, var(--color-fondo) 2px 3.4px)` : SERIE[i] }} />
              <span className="flex-1">{d.tipo}</span><b className="tabular-nums">{d.pct}%</b>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

/* ─── Solicitudes por estado: anillos concéntricos con el total y lista con barras ─── */

function ByStatus({ data }: { data: FoundationStatsDto['porEstado'] }) {
  const total = data.reduce((n, d) => n + d.cantidad, 0)
  return (
    <Panel title="Solicitudes por estado" text="Avance operativo de las donaciones en curso.">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="relative w-44">
          <svg viewBox="0 0 200 200" className="w-full -rotate-90" role="img" aria-label={`${total} solicitudes: ${data.map((d) => `${d.estado} ${d.cantidad}`).join(', ')}`}>
            {data.map((d, i) => {
              const r = 90 - i * 13
              const c = 2 * Math.PI * r
              return (
                <g key={d.estado}>
                  <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={8} />
                  <circle cx="100" cy="100" r={r} fill="none" stroke={SERIE[i]} strokeWidth={8} strokeLinecap="round"
                    strokeDasharray={`${(pct(d.cantidad, total) / 100) * c} ${c}`} />
                </g>
              )
            })}
          </svg>
          <div aria-hidden="true" className="absolute inset-0 grid place-content-center text-center">
            <p className="text-3xl font-extrabold">{total}</p>
            <p className="text-[11px] text-white/60">Solicitudes</p>
          </div>
        </div>
        <ul className="min-w-44 flex-1 space-y-3 text-sm" aria-label="Solicitudes por estado">
          {data.map((d, i) => (
            <li key={d.estado}>
              <div className="flex items-center gap-2">
                <i aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: SERIE[i] }} />
                <span className="flex-1">{d.estado}</span>
                <b className="tabular-nums">{d.cantidad}</b>
                <span className="w-10 text-right text-xs tabular-nums text-white/55">{pct(d.cantidad, total)}%</span>
              </div>
              <div aria-hidden="true" className="mt-1 h-1 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${pct(d.cantidad, total)}%`, background: SERIE[i] }} /></div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

/* ─── Exportar a Excel: CSV con separador «;» y BOM para que Excel en español lo abra con tildes ─── */

function exportar(nombre: string, s: FoundationStatsDto, months: FoundationMonthDto[]) {
  const filas: (string | number)[][] = [
    [`Estadísticas de ${nombre}`],
    [],
    ['Indicador', 'Valor'],
    ['Prendas recibidas en total', s.totalPrendasRecibidas],
    ['Donaciones de tiendas aliadas', s.donaciones.deTiendas],
    ['Donaciones de personas', s.donaciones.dePersonas],
    [`Meta de ${s.meta.etiqueta}`, `${s.meta.recibidas} de ${s.meta.objetivo}`],
    [],
    ['Mes', 'De personas', 'De tiendas', 'Total'],
    ...months.map((m) => [m.etiqueta, m.personas, m.tiendas, m.total]),
    [],
    ['Tipo de prenda', 'Porcentaje'],
    ...s.porTipo.map((t) => [t.tipo, `${t.pct}%`]),
    [],
    ['Estado', 'Solicitudes'],
    ...s.porEstado.map((e) => [e.estado, e.cantidad]),
  ]
  const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `estadisticas-${nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
