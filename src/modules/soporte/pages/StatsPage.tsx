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

function formatKpiVariationText(kpi: KpiDto, unidad: 'visitas' | 'mensajes'): string {
  const ant = kpi.periodoAnterior
  if (ant !== undefined) {
    if (kpi.valor === 0 && ant > 0) return '−100 %'
    if (kpi.valor === 0 && ant === 0) return `Sin variación: ambos periodos sin ${unidad}`
    if (ant === 0 && kpi.valor > 0) return `No calculable: periodo anterior con 0 ${unidad}`
  }
  const arrow = kpi.direccion === 'up' ? '▲' : kpi.direccion === 'down' ? '▼' : '—'
  return `${arrow} ${kpi.variacionPct}% vs periodo anterior`
}

function KpiCard({ label, kpi, unidad }: { label: string; kpi: KpiDto; unidad: 'visitas' | 'mensajes' }) {
  const color = kpi.direccion === 'up' ? 'text-[var(--sr-ok,var(--color-success))]' : kpi.direccion === 'down' ? 'text-[var(--sr-bad,var(--color-danger))]' : 'text-[var(--sr-text-muted,var(--color-text-muted))]'
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-accent))]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[var(--sr-text-primary,var(--color-text))]">{kpi.valor.toLocaleString('es-CO')}</p>
      <p className={`mt-1 text-xs ${color}`}>
        {formatKpiVariationText(kpi, unidad)}
      </p>
    </Card>
  )
}

function ProgressBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pctNum = total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0
  const pctStr = total > 0 ? pctNum.toFixed(2) : '0.0'
  return (
    <div className="mt-3 text-[var(--sr-text-primary,var(--color-text))]">
      <div className="flex justify-between text-sm"><span>{label}</span><strong>{value.toLocaleString('es-CO')} ({pctStr}%)</strong></div>
      <div className="mt-1 h-2 w-full rounded-full bg-[var(--sr-border-subtle,var(--color-border))]">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pctNum}%` }} />
      </div>
    </div>
  )
}

/* ─── Vistas por rol ─── */

function StoreStatsView() {
  const [periodo, setPeriodo] = useState<StatsPeriod>('30_DIAS')
  const { data: stats, loading, error, reload } = useStoreStats(periodo)
  const { data: inventory } = useStoreInventory()

  if (loading) return <Loading label="Cargando estadísticas de tu tienda…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!stats) return <EmptyState title="Sin datos">Cuando tu tienda tenga actividad, verás los indicadores aquí</EmptyState>

  const visitasPorDia = stats.visitasPorDia ?? []
  const mensajesPorDia = stats.mensajesPorDia ?? []
  const metaSemanal = stats.metaSemanal
  const hasMeta = !!metaSemanal && metaSemanal.meta !== null && metaSemanal.meta > 0

  return (
    <div className="text-[var(--sr-text-primary,var(--color-text))]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sr-text-primary,var(--color-text))]">Estadísticas de tu tienda</h2>
          <p className="text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">Solo tú y StyleRadar ven estos datos</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] p-1" role="radiogroup" aria-label="Periodo">
          {(['7_DIAS', '30_DIAS', '90_DIAS'] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={periodo === p}
              className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${periodo === p ? 'bg-[var(--sr-accent)] text-[var(--sr-text-on-accent)]' : 'text-[var(--sr-text-muted,var(--color-text-muted))] hover:bg-[var(--sr-surface-raised,var(--color-surface-muted))]'}`}
              onClick={() => setPeriodo(p)}
            >{p === '7_DIAS' ? '7 días' : p === '30_DIAS' ? '30 días' : '90 días'}</button>
          ))}
        </div>
      </div>

      {/* RF-76.1 y RF-76.2: Visitas y Mensajes */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <KpiCard label="Visitas a la página de la tienda" kpi={stats.kpis.visitas} unidad="visitas" />
        <KpiCard label="Mensajes recibidos" kpi={stats.kpis.mensajes} unidad="mensajes" />
      </div>

      {/* RF-77.1 y RF-77.3: Series por día */}
      {visitasPorDia.length > 0 && (
        <Card className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-accent))]">
            Actividad diaria ({periodo === '7_DIAS' ? '7 días' : periodo === '30_DIAS' ? '30 días' : '90 días'})
          </h3>
          <div className="mt-3 max-h-60 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--sr-border-subtle,var(--color-border))] text-[var(--sr-text-muted,var(--color-text-muted))]">
                  <th className="py-2">Fecha</th>
                  <th className="py-2 text-right">Visitas</th>
                  <th className="py-2 text-right">Mensajes</th>
                </tr>
              </thead>
              <tbody>
                {visitasPorDia.map((v, i) => (
                  <tr key={v.fecha} className="border-b border-[var(--sr-border-subtle,var(--color-border))]/40">
                    <td className="py-1.5 font-mono">{v.fecha}</td>
                    <td className="py-1.5 text-right tabular-nums">{v.visitas}</td>
                    <td className="py-1.5 text-right tabular-nums">{mensajesPorDia[i]?.mensajes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* RF-78 y RF-79: Visitantes ahora y Meta semanal */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-accent))]">Viendo tu tienda ahora</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--sr-text-primary,var(--color-text))]" aria-live="polite">
            {stats.visitantesAhora ?? 0}
          </p>
          <p className="mt-1 text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">Visitantes activos en tiempo real</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-accent))]">Meta semanal de visitas</p>
          {hasMeta && metaSemanal ? (
            <>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--sr-text-primary,var(--color-text))]">
                {metaSemanal.porcentajeAvance}%
              </p>
              <p className="mt-1 text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">
                {metaSemanal.visitasAcumuladas.toLocaleString('es-CO')} de {metaSemanal.meta?.toLocaleString('es-CO')} visitas alcanzadas
              </p>
            </>
          ) : (
            <>
              <p role="status" className="mt-1 text-xs font-semibold text-[var(--sr-text-muted,var(--color-text-muted))]">
                Tu tienda aún no tiene una meta semanal de visitas
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums text-[var(--sr-text-primary,var(--color-text))]">
                {(metaSemanal?.visitasAcumuladas ?? 0).toLocaleString('es-CO')} visitas acumuladas
              </p>
            </>
          )}
        </Card>
      </div>

      {/* RF-81: Inventario por estado */}
      {inventory && (
        <Card className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-accent))]">Inventario por estado</h3>
          <ProgressBar label="Disponibles" value={inventory.disponibles} total={inventory.total} tone="bg-[var(--sr-ok,var(--color-success))]" />
          <ProgressBar label="Últimas unidades" value={inventory.ultimasUnidades} total={inventory.total} tone="bg-[var(--sr-warn,var(--color-warning))]" />
          <ProgressBar label="Agotadas" value={inventory.agotadas} total={inventory.total} tone="bg-[var(--sr-bad,var(--color-danger))]" />
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
          Tu rol no tiene estadísticas asignadas
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
