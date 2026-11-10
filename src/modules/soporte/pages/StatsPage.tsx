import { useState } from 'react'
import { Card, Badge } from '@/modules/core/design-system'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { formatCOP } from '@/modules/core/utils/format'
import {
  useStatsRole, useStoreStats, useStoreInventory,
  useFoundationStats, useFoundationMonths,
  useAdminIndicators, useAdminIncome, useAdminAccounts,
} from '../hooks/useStats'
import type { KpiDto, StatsPeriod } from '../types/stats.dto'

/* ─── Componentes auxiliares de Stats ─── */

function KpiCard({ label, kpi }: { label: string; kpi: KpiDto }) {
  const arrow = kpi.direccion === 'up' ? '▲' : kpi.direccion === 'down' ? '▼' : '—'
  const color = kpi.direccion === 'up' ? 'text-green-400' : kpi.direccion === 'down' ? 'text-[#ff8a8a]' : 'text-white/50'
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{kpi.valor.toLocaleString('es-CO')}</p>
      <p className={`mt-1 text-xs ${color}`}>
        {arrow} {kpi.variacionPct}% vs. periodo anterior
      </p>
    </Card>
  )
}

function ProgressBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="mt-3">
      <div className="flex justify-between text-sm"><span>{label}</span><strong>{value.toLocaleString('es-CO')} ({pct}%)</strong></div>
      <div className="mt-1 h-2 w-full rounded-full bg-white/10">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function BarChart({ data, labelKey, valueKey, unit }: { data: readonly Record<string, string | number>[]; labelKey: string; valueKey: string; unit?: string }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1)
  return (
    <div className="flex items-end gap-2" style={{ height: 160 }} role="img" aria-label="Gráfico de barras">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0
        const h = Math.max(4, (val / max) * 140)
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-white/60">{val}{unit}</span>
            <div className="w-full rounded-t bg-violeta" style={{ height: h }} />
            <span className="text-[10px] text-white/50">{String(d[labelKey])}</span>
          </div>
        )
      })}
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
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas de tu tienda</h2>
          <p className="text-sm text-white/60">Solo tú y StyleRadar ven estos datos.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1" role="radiogroup" aria-label="Periodo">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={periodo === p}
              className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${periodo === p ? 'bg-violeta' : 'hover:bg-white/10'}`}
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
          <h3 className="text-sm font-bold uppercase tracking-[.16em] text-arena">Inventario por estado</h3>
          <ProgressBar label="Disponibles" value={inventory.disponibles} total={inventory.total} tone="bg-green-500" />
          <ProgressBar label="Últimas unidades" value={inventory.ultimasUnidades} total={inventory.total} tone="bg-yellow-500" />
          <ProgressBar label="Agotadas" value={inventory.agotadas} total={inventory.total} tone="bg-[#ff8a8a]" />
        </Card>
      )}
    </>
  )
}

function FoundationStatsView() {
  const { data: stats, loading, error, reload } = useFoundationStats()
  const { data: months } = useFoundationMonths()

  if (loading) return <Loading label="Cargando estadísticas de tu fundación…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!stats) return <EmptyState title="Sin datos">Cuando recibas donaciones, verás los indicadores aquí.</EmptyState>

  return (
    <>
      <h2 className="text-2xl font-bold">Estadísticas de tu fundación</h2>
      <p className="text-sm text-white/60">Solo tú y StyleRadar ven estos datos.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Prendas recibidas</p>
          <p className="mt-1 text-2xl font-extrabold">{stats.totalPrendasRecibidas.toLocaleString('es-CO')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">De tiendas</p>
          <p className="mt-1 text-2xl font-extrabold">{stats.donaciones.deTiendas.toLocaleString('es-CO')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">De personas</p>
          <p className="mt-1 text-2xl font-extrabold">{stats.donaciones.dePersonas.toLocaleString('es-CO')}</p>
        </Card>
      </div>
      {months.length > 0 && (
        <Card className="mt-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[.16em] text-arena">Solicitudes mensuales</h3>
          <BarChart data={months as unknown as Record<string, string | number>[]} labelKey="mes" valueKey="total" />
        </Card>
      )}
    </>
  )
}

function AdminStatsView() {
  const { data: indicators, loading, error, reload } = useAdminIndicators()
  const { data: income } = useAdminIncome()
  const { data: accounts } = useAdminAccounts()

  if (loading) return <Loading label="Cargando estadísticas de la plataforma…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!indicators) return <EmptyState title="Sin datos">No hay indicadores disponibles.</EmptyState>

  return (
    <>
      <h2 className="text-2xl font-bold">Estadísticas generales</h2>
      <p className="text-sm text-white/60">Indicadores globales de StyleRadar.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Usuarios activos</p>
          <p className="mt-1 text-2xl font-extrabold">{indicators.usuariosActivos.toLocaleString('es-CO')}</p>
          <p className={`text-xs ${indicators.variacionUsuarios.direccion === 'up' ? 'text-green-400' : 'text-[#ff8a8a]'}`}>
            {indicators.variacionUsuarios.direccion === 'up' ? '▲' : '▼'} {indicators.variacionUsuarios.pct}%
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Tiendas verificadas</p>
          <p className="mt-1 text-2xl font-extrabold">{indicators.tiendas.verificadas}</p>
          <p className="text-xs text-white/50">{indicators.tiendas.pendientes} pendientes · {indicators.tiendas.total} total</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Ingresos del mes</p>
          <p className="mt-1 text-2xl font-extrabold">{formatCOP(indicators.ingresosMes)}</p>
          <p className={`text-xs ${indicators.variacionIngresos.direccion === 'up' ? 'text-green-400' : 'text-[#ff8a8a]'}`}>
            {indicators.variacionIngresos.direccion === 'up' ? '▲' : '▼'} {indicators.variacionIngresos.pct}%
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Fundaciones activas</p>
          <p className="mt-1 text-2xl font-extrabold">{indicators.fundacionesActivas}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Prendas publicadas</p>
          <p className="mt-1 text-2xl font-extrabold">{indicators.prendasPublicadas.toLocaleString('es-CO')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Playlists creadas</p>
          <p className="mt-1 text-2xl font-extrabold">{indicators.playlistsCreadas.toLocaleString('es-CO')}</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Donaciones del mes</p>
          <p className="mt-1 text-2xl font-extrabold">{indicators.donacionesMes}</p>
        </Card>
      </div>

      {/* Ingresos */}
      {income && (
        <Card className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-[.16em] text-arena">Ingresos por suscripciones</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-white/50">Netos este mes</p>
              <p className="text-xl font-bold">{formatCOP(income.mesActual.ingresosNetos)}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Reembolsos descontados</p>
              <p className="text-xl font-bold text-[#ff8a8a]">−{formatCOP(income.mesActual.reembolsosDescontados)}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Meta</p>
              <p className="text-xl font-bold">{income.mesActual.porcentajeAvance}% de {formatCOP(income.mesActual.meta)}</p>
            </div>
          </div>
          {income.historico.length > 0 && (
            <div className="mt-4">
              <BarChart data={income.historico} labelKey="mes" valueKey="total" />
            </div>
          )}
        </Card>
      )}

      {/* Cuentas por plan */}
      {accounts && (
        <Card className="mt-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[.16em] text-arena">Cuentas por plan</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {accounts.resumen.map((r) => (
              <div key={r.plan} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm">{r.plan}</span>
                <Badge tone="violeta">{r.cuentas.toLocaleString('es-CO')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
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
    <section className="mx-auto max-w-6xl px-4 py-10">
      {role === 'store' && <StoreStatsView />}
      {role === 'foundation' && <FoundationStatsView />}
      {role === 'admin' && <AdminStatsView />}
    </section>
  )
}
