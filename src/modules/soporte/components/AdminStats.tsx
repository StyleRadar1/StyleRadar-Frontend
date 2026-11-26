import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { formatCOP } from '@/modules/core/utils/format'
import {
  usePlatformBuyersByPlan,
  usePlatformGarmentPublications,
  usePlatformMonthlyDonations,
  usePlatformPlaylistsCreated,
  usePlatformStoresByPlan,
  usePlatformSubscriptionRevenue,
  usePlatformUserRegistrations,
} from '../hooks/useStatistics'
import type { CategoryCode, DistributionResponse } from '../types/statistics.dto'
import {
  calcRealDelta,
  formatDayShort,
  formatMonthLong,
  formatMonthShort,
  getCurrentYearMonth,
  getRecentMonthOptions,
} from '../utils/statsFormat'
import { KpiCard } from './stats/KpiCard'
import { TrendChart, type TrendPoint } from './stats/TrendChart'

const num = (n: number) => n.toLocaleString('es-CO')

function sumEntries<C extends CategoryCode>(res: DistributionResponse<C> | null): number {
  if (!res) return 0
  return (res.entries ?? []).reduce((sum, entry) => sum + entry.count, 0)
}

/**
 * Estadísticas del administrador (/admin/estadisticas):
 * muestra exclusivamente las métricas reales de ms-estadisticas con totales y tendencias.
 */
export function AdminStatsView() {
  const navigate = useNavigate()
  const monthOptions = useMemo(() => getRecentMonthOptions(6), [])
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentYearMonth())

  const registrations = usePlatformUserRegistrations(selectedMonth)
  const buyers = usePlatformBuyersByPlan()
  const stores = usePlatformStoresByPlan()
  const garments = usePlatformGarmentPublications()
  const playlists = usePlatformPlaylistsCreated()
  const donations = usePlatformMonthlyDonations()
  const revenue = usePlatformSubscriptionRevenue()

  const has401 =
    registrations.status === 401 ||
    buyers.status === 401 ||
    stores.status === 401 ||
    garments.status === 401 ||
    playlists.status === 401 ||
    donations.status === 401 ||
    revenue.status === 401

  useEffect(() => {
    if (has401) {
      guardarRetorno()
      navigate('/?login', { replace: true })
    }
  }, [has401, navigate])

  const regPoints = registrations.data?.points ?? []
  const registeredTotal = regPoints.reduce((sum, point) => sum + point.value, 0)
  const regPeriodLabel =
    formatMonthShort(registrations.data?.period?.startDate ?? `${selectedMonth}-01`) || selectedMonth
  const regPeriodLong =
    formatMonthLong(registrations.data?.period?.startDate ?? `${selectedMonth}-01`) || regPeriodLabel

  const buyersTotal = sumEntries(buyers.data)
  const storesTotal = sumEntries(stores.data)

  const donationsPeriodLabel =
    formatMonthShort(donations.data?.period?.startDate) || 'Mes en curso'

  const revenueRawPoints = revenue.data?.points ?? []
  const revenueTrendPoints: TrendPoint[] = revenueRawPoints.map((point) => {
    const label = formatMonthShort(point.date)
    return {
      key: point.date,
      axisLabel: label,
      fullLabel: label,
      value: point.value,
    }
  })

  const revenueDelta =
    revenueRawPoints.length >= 2
      ? calcRealDelta(
          revenueRawPoints[revenueRawPoints.length - 1].value,
          revenueRawPoints[revenueRawPoints.length - 2].value,
          formatMonthShort(revenueRawPoints[revenueRawPoints.length - 2].date),
        )
      : null

  const registrationTrendPoints: TrendPoint[] = regPoints.map((point) => {
    const label = formatDayShort(point.date)
    return {
      key: point.date,
      axisLabel: label,
      fullLabel: label,
      value: point.value,
    }
  })

  const monthSelect = (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--sr-text-muted,var(--color-text-muted))]">
      <span>Mes</span>
      <select
        aria-label="Seleccionar mes de registros"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="rounded-lg border border-[var(--sr-border-subtle,var(--color-border))] bg-[var(--sr-surface,var(--color-surface))] px-3 py-1.5 text-xs font-semibold text-[var(--sr-text-primary,var(--color-text))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-violeta-claro,#7C3AED)]"
      >
        {monthOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="space-y-8 text-[var(--sr-text-primary,var(--color-text))]">
      {/* Encabezado: título grande, subtítulo corto y selector de periodo a la derecha */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-violeta-claro))]">
            Analítica de plataforma
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Estadísticas</h1>
          <p className="text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">
            Indicadores reales de StyleRadar · registros de {regPeriodLong}
          </p>
        </div>
        {monthSelect}
      </header>

      {/* Fila de tarjetas KPI: 6 totales reales de ms-estadisticas */}
      <section
        aria-label="Indicadores principales"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <KpiCard
          label="Usuarios registrados"
          value={num(registeredTotal)}
          subtitle={regPeriodLabel}
          loading={registrations.loading}
          empty={registrations.empty}
          emptyText={`Sin registros en ${regPeriodLabel}`}
          error={registrations.error}
          status={registrations.status}
          onRetry={registrations.retry}
        />
        <KpiCard
          label="Compradores"
          value={num(buyersTotal)}
          subtitle="Total de cuentas registradas"
          loading={buyers.loading}
          empty={buyers.empty}
          emptyText="Aún no hay cuentas"
          error={buyers.error}
          status={buyers.status}
          onRetry={buyers.retry}
        />
        <KpiCard
          label="Almacenes aliados"
          value={num(storesTotal)}
          subtitle="Total de tiendas registradas"
          loading={stores.loading}
          empty={stores.empty}
          emptyText="Aún no hay cuentas"
          error={stores.error}
          status={stores.status}
          onRetry={stores.retry}
        />
        <KpiCard
          label="Prendas publicadas"
          value={num(garments.data?.total ?? 0)}
          subtitle="Total acumulado en catálogo"
          loading={garments.loading}
          empty={garments.empty}
          emptyText="Aún no hay prendas publicadas"
          error={garments.error}
          status={garments.status}
          onRetry={garments.retry}
        />
        <KpiCard
          label="Playlists creadas"
          value={num(playlists.data?.total ?? 0)}
          subtitle="Total acumulado de colecciones"
          loading={playlists.loading}
          empty={playlists.empty}
          emptyText="Aún no hay playlists creadas"
          error={playlists.error}
          status={playlists.status}
          onRetry={playlists.retry}
        />
        <KpiCard
          label="Donaciones del mes"
          value={num(donations.data?.total ?? 0)}
          subtitle={donationsPeriodLabel}
          loading={donations.loading}
          empty={donations.empty}
          emptyText="Aún no hay donaciones en este mes"
          error={donations.error}
          status={donations.status}
          onRetry={donations.retry}
        />
      </section>

      {/* Gráfica de tendencia 1: Ingresos por suscripciones (mensual, COP) */}
      <TrendChart
        title="Ingresos por suscripciones"
        subtitle="Evolución mensual del total recaudado en pesos colombianos"
        seriesLabel="Total en COP"
        tableColumnLabel="Total"
        tableDateHeader="Mes"
        points={revenueTrendPoints}
        variant="area"
        formatValue={formatCOP}
        delta={revenueDelta}
        headerControls={
          <span className="rounded-lg border border-[var(--sr-border-subtle,var(--color-border))] px-2.5 py-1 text-xs font-semibold text-[var(--sr-text-muted,var(--color-text-muted))]">
            Mensual
          </span>
        }
        note="La variación porcentual compara el último mes con el mes inmediatamente anterior de la misma serie."
        loading={revenue.loading}
        emptyText="Sin ingresos en el periodo"
        error={revenue.error}
        status={revenue.status}
        onRetry={revenue.retry}
      />

      {/* Gráfica de tendencia 2: Registros de usuarios por día (un mes calendario) */}
      <TrendChart
        title="Registros de usuarios por día"
        subtitle={`Nuevas cuentas registradas durante ${regPeriodLong}`}
        seriesLabel="Registros"
        tableColumnLabel="Registros"
        tableDateHeader="Día"
        points={registrationTrendPoints}
        variant="bars"
        headerControls={monthSelect}
        note="Serie diaria de nuevos registros del mes calendario seleccionado."
        loading={registrations.loading}
        emptyText={`Sin registros durante ${regPeriodLong}`}
        error={registrations.error}
        status={registrations.status}
        onRetry={registrations.retry}
      />
    </div>
  )
}
