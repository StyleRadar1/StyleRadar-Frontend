import { useState } from 'react'
import { Card } from '@/modules/core/design-system'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import {
  useStatsRole, useStoreStats, useStoreInventory,
} from '../hooks/useStats'
import type { KpiDto, StatsPeriod } from '../types/stats.dto'
import { FoundationStatsView } from '../components/FoundationStats'
import { AdminStatsView } from '../components/AdminStats'
import '@/styles/verdelo-dashboard.css'

/* ─── Componentes auxiliares de Stats ─── */

function KpiCard({ label, kpi }: { label: string; kpi: KpiDto }) {
  const arrow = kpi.direccion === 'up' ? '▲' : kpi.direccion === 'down' ? '▼' : '—'
  const color = kpi.direccion === 'up' ? 'text-[var(--color-success)]' : kpi.direccion === 'down' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-sand)]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[var(--color-text)]">{kpi.valor.toLocaleString('es-CO')}</p>
      <p className={`mt-1 text-xs ${color}`}>
        {arrow} {kpi.variacionPct}% vs. periodo anterior
      </p>
    </Card>
  )
}

function ProgressBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="mt-3 text-[var(--color-text)]">
      <div className="flex justify-between text-sm"><span>{label}</span><strong>{value.toLocaleString('es-CO')} ({pct}%)</strong></div>
      <div className="mt-1 h-2 w-full rounded-full bg-[var(--color-border)]">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ─── Vistas por rol ─── */

function StoreStatsView() {
  const [periodo, setPeriodo] = useState<StatsPeriod>('30d')
  const { data: stats, loading, error, reload } = useStoreStats(periodo)
  const { data: inventory } = useStoreInventory()

  if (loading) return <Loading label="Cargando estadísticas de tu tienda…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!stats) return <EmptyState title="Sin datos">Cuando tu tienda tenga actividad, verás los indicadores aquí.</EmptyState>

  return (
    <div className="text-[var(--color-text)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Estadísticas de tu tienda</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Solo tú y StyleRadar ven estos datos.</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="radiogroup" aria-label="Periodo">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={periodo === p}
              className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${periodo === p ? 'bg-violeta text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'}`}
              onClick={() => setPeriodo(p)}
            >{p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}</button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Visitas a tu tienda" kpi={stats.kpis.visitas} />
        <KpiCard label="Mensajes recibidos" kpi={stats.kpis.mensajes} />
        <KpiCard label="Guardadas en wishlist" kpi={stats.kpis.wishlist} />
      </div>
      {inventory && (
        <Card className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-[.16em] text-[var(--color-sand)]">Inventario por estado</h3>
          <ProgressBar label="Disponibles" value={inventory.disponibles} total={inventory.total} tone="bg-[var(--color-success)]" />
          <ProgressBar label="Últimas unidades" value={inventory.ultimasUnidades} total={inventory.total} tone="bg-[var(--color-warning)]" />
          <ProgressBar label="Agotadas" value={inventory.agotadas} total={inventory.total} tone="bg-[var(--color-danger)]" />
        </Card>
      )}
    </div>
  )
}

/* ─── Página principal: despacha según el rol ─── */

export default function StatsPage() {
  const role = useStatsRole()

  if (!role) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState title="Estadísticas no disponibles">
          Tu rol no tiene estadísticas asignadas.
        </EmptyState>
      </section>
    )
  }

  return (
    <section className="sr-verdelo-page mx-auto max-w-6xl px-4 py-10">
      {role === 'store' && <StoreStatsView />}
      {role === 'foundation' && <FoundationStatsView />}
      {role === 'admin' && <AdminStatsView />}
    </section>
  )
}
