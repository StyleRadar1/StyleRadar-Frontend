import { useState } from 'react'
import { ErrorState, EmptyState, Loading } from '@/modules/core/components/Status'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { useFoundationMonths, useFoundationStats } from '../hooks/useStats'
import type { FoundationMonthDto, FoundationStatsDto } from '../types/stats.dto'
import { DataTable, Donut, Gauge, GroupedBars, Kpi, Panel, Swatch, TableToggle } from './charts'
import { descargarCsv, pct, SERIE } from '../utils/charts'

/** Estadísticas de la fundación (RF-82 a 85) con el diseño del prototipo. */
export function FoundationStatsView() {
  const { user } = useAuth()
  const { data: stats, loading, error, reload } = useFoundationStats()
  const { data: months } = useFoundationMonths()
  const nombre = user?.name.replace(/^Fundación /, '') ?? 'tu fundación'

  if (loading) return <Loading label="Cargando estadísticas de tu fundación…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!stats) return <EmptyState title="Sin datos">Cuando recibas donaciones, verás los indicadores aquí.</EmptyState>
  const meta = pct(stats.meta.recibidas, stats.meta.objetivo)

  return (
    <section className="text-[var(--color-text)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-[var(--color-text)]">Estadísticas de tu fundación</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Donaciones y solicitudes recibidas por {nombre} · Solo tú y StyleRadar ven estos datos.</p>
        </div>
        <button type="button" onClick={() => exportar(nombre, stats, months)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface)] text-[var(--color-text)]">
          Exportar a Excel
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Prendas recibidas en total" value={stats.totalPrendasRecibidas.toLocaleString('es-CO')} hint="Impacto acumulado" />
        <Kpi label="Donaciones de tiendas aliadas" value={stats.donaciones.deTiendas.toLocaleString('es-CO')} hint="Lotes de prendas nuevas y saldos" />
        <Kpi label="Donaciones de personas" value={stats.donaciones.dePersonas.toLocaleString('es-CO')} hint="Ropa entregada por la comunidad" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {months.length > 0 && <MonthlyRequests months={months} />}
        <Panel title="Meta mensual de prendas" text={`${stats.meta.recibidas} de ${stats.meta.objetivo} prendas recibidas en ${stats.meta.etiqueta} (${meta}%).`}>
          <Gauge value={meta} label={`Meta de prendas de ${stats.meta.etiqueta}: ${meta}% alcanzado`} caption={`de la meta de ${stats.meta.etiqueta}`} />
        </Panel>
        <Panel title="Prendas por tipo" text="Qué tipo de ropa llega con más frecuencia a la fundación.">
          <Donut label="Prendas por tipo" data={stats.porTipo.map((t) => ({ nombre: t.tipo, valor: t.pct }))} />
        </Panel>
        <ByStatus data={stats.porEstado} />
      </div>
    </section>
  )
}

function MonthlyRequests({ months }: { months: FoundationMonthDto[] }) {
  const [tabla, setTabla] = useState(false)
  return (
    <Panel title="Solicitudes por mes" text={`Origen de las solicitudes de donación en los últimos ${months.length} meses.`} action={<TableToggle on={tabla} onChange={setTabla} />}>
      {tabla
        ? <DataTable caption="Detalle de solicitudes mensuales" head={['Mes', 'De personas', 'De tiendas', 'Total']} rows={months.map((m) => [m.etiqueta, m.personas, m.tiendas, m.total])} />
        : <GroupedBars label="Solicitudes por mes" series={['De personas', 'De tiendas']} grupos={months.map((m) => ({ key: m.mes, eje: m.mes, titulo: m.etiqueta, valores: [m.personas, m.tiendas] }))} />}
    </Panel>
  )
}

/** Solicitudes por estado: anillos concéntricos con el total y lista con barras. */
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
                  <circle cx="100" cy="100" r={r} fill="none" stroke={SERIE[i]} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${(pct(d.cantidad, total) / 100) * c} ${c}`} />
                </g>
              )
            })}
          </svg>
          <div aria-hidden="true" className="absolute inset-0 grid place-content-center text-center">
            <p className="text-3xl font-extrabold">{total}</p>
            <p className="text-[0.6875rem] text-white/60">Solicitudes</p>
          </div>
        </div>
        <ul className="min-w-44 flex-1 space-y-3 text-sm" aria-label="Solicitudes por estado">
          {data.map((d, i) => (
            <li key={d.estado}>
              <div className="flex items-center gap-2">
                <Swatch i={i} />
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

function exportar(nombre: string, s: FoundationStatsDto, months: FoundationMonthDto[]) {
  descargarCsv(`estadisticas-${nombre}`, [
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
  ])
}
