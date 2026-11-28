import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartHandshake,
  ListMusic,
  Shirt,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react'
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
import {
  CATEGORY_UI_LABELS,
  type CategoryCode,
  type DistributionResponse,
} from '../types/statistics.dto'
import {
  calcRealDelta,
  formatDayShort,
  formatFullDateSpanish,
  formatMonthAbbr,
  formatMonthOnly,
  formatMonthShort,
  formatWeekdayDay,
  getCurrentYearMonth,
  getRecentMonthOptions,
  getYearFromIso,
} from '../utils/statsFormat'
import { DistributionCard, type DistributionRow } from './stats/DistributionCard'
import { KpiCard } from './stats/KpiCard'
import { TrendChart, type TrendPoint } from './stats/TrendChart'
import './stats/statsGlass.css'

const num = (n: number) => n.toLocaleString('es-CO')

const CATEGORY_COLORS: Record<CategoryCode, string> = {
  PLAN_RADAR: '#8b86a4',
  PLAN_RADAR_PLUS: '#9d5cff',
  PLAN_STORE_MONTHLY: '#9d5cff',
  SUSPENDED: '#fbbf24',
  AVAILABLE: '#4ade80',
  LOW_STOCK: '#fbbf24',
  OUT_OF_STOCK: '#f87171',
}

function sumEntries<C extends CategoryCode>(res: DistributionResponse<C> | null): number {
  if (!res) return 0
  return (res.entries ?? []).reduce((sum, entry) => sum + entry.count, 0)
}

function toDistributionRows<C extends CategoryCode>(
  res: DistributionResponse<C> | null,
): DistributionRow[] {
  if (!res) return []
  return (res.entries ?? []).map((entry) => ({
    key: entry.categoryCode,
    label: CATEGORY_UI_LABELS[entry.categoryCode] ?? 'Otra categoría',
    count: entry.count,
    percentage: entry.percentage,
    color: CATEGORY_COLORS[entry.categoryCode] ?? '#9d5cff',
  }))
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
      navigate('/login', { replace: true })
    }
  }, [has401, navigate])

  const regPoints = registrations.data?.points ?? []
  const registeredTotal = regPoints.reduce((sum, point) => sum + point.value, 0)

  const buyersTotal = sumEntries(buyers.data)
  const storesTotal = sumEntries(stores.data)
  const buyersRows = toDistributionRows(buyers.data)
  const storesRows = toDistributionRows(stores.data)

  const revenueRawPoints = revenue.data?.points ?? []
  const revenueYears = Array.from(
    new Set(
      revenueRawPoints
        .map((p) => getYearFromIso(p.date))
        .filter((y): y is number => y !== null),
    ),
  )
  const revenueTableNote =
    revenueYears.length === 1
      ? `Año ${revenueYears[0]}`
      : revenueYears.length > 1
        ? `Periodo: ${revenueYears[0]} – ${revenueYears[revenueYears.length - 1]}`
        : undefined

  const revenueTrendPoints: TrendPoint[] = revenueRawPoints.map((point, idx) => {
    const fullLabel = formatMonthShort(point.date)
    const monthOnly = formatMonthOnly(point.date)
    const yr = getYearFromIso(point.date)
    const prevYr = idx > 0 ? getYearFromIso(revenueRawPoints[idx - 1].date) : null
    const tableLabel =
      revenueYears.length > 1 && yr !== null && (idx === 0 || yr !== prevYr)
        ? `${monthOnly} ${yr}`
        : monthOnly
    return {
      key: point.date,
      axisLabel: formatMonthAbbr(point.date),
      fullLabel,
      tableLabel,
      tableAriaLabel: fullLabel,
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

  const registrationTrendPoints: TrendPoint[] = regPoints.map((point) => ({
    key: point.date,
    axisLabel: formatDayShort(point.date),
    fullLabel: formatFullDateSpanish(point.date),
    tableLabel: formatWeekdayDay(point.date),
    tableAriaLabel: formatFullDateSpanish(point.date),
    value: point.value,
  }))

  const monthSelect = (
    <label className="glass-pill inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-[var(--sr-text-muted,var(--color-text-muted))]">
      <span>Mes</span>
      <select
        aria-label="Seleccionar mes de registros"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="cursor-pointer bg-transparent text-xs font-semibold text-[var(--sr-text-primary,var(--color-text))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-violeta-claro,#7C3AED)]"
      >
        {monthOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#141021] text-[#f8fafc]">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="stats-glass-backdrop space-y-8 text-[var(--sr-text-primary,var(--color-text))]">
      <span aria-hidden="true" className="stats-glass-glow" />

      {/* Encabezado: título grande, subtítulo corto y selector de periodo a la derecha */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--sr-accent-text,var(--color-violeta-claro))]">
            Analítica de plataforma
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Estadísticas</h1>
          <p className="text-sm text-[var(--sr-text-muted,var(--color-text-muted))]">
            Indicadores reales de StyleRadar
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
          numericValue={registeredTotal}
          subtitle="Nuevas cuentas del mes"
          icon={<Users className="h-4 w-4" />}
          loading={registrations.loading}
          empty={registrations.empty}
          emptyText="Sin registros en este mes"
          error={registrations.error}
          status={registrations.status}
          onRetry={registrations.retry}
        />
        <KpiCard
          label="Compradores"
          value={num(buyersTotal)}
          numericValue={buyersTotal}
          subtitle="Total de cuentas registradas"
          icon={<ShoppingBag className="h-4 w-4" />}
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
          numericValue={storesTotal}
          subtitle="Total de tiendas registradas"
          icon={<Store className="h-4 w-4" />}
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
          numericValue={garments.data?.total ?? 0}
          subtitle="Total acumulado en catálogo"
          icon={<Shirt className="h-4 w-4" />}
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
          numericValue={playlists.data?.total ?? 0}
          subtitle="Total acumulado de colecciones"
          icon={<ListMusic className="h-4 w-4" />}
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
          numericValue={donations.data?.total ?? 0}
          subtitle="Registradas en el mes"
          icon={<HeartHandshake className="h-4 w-4" />}
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
        tableNote={revenueTableNote}
        points={revenueTrendPoints}
        variant="area"
        views={['area', 'bars', 'table']}
        storageKey="sr_admin_revenue_view"
        highlightPeaks
        enableAverageToggle
        formatValue={formatCOP}
        delta={revenueDelta}
        headerControls={
          <span className="glass-pill px-2.5 py-1 text-xs font-semibold">
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
        subtitle="Nuevas cuentas registradas por día"
        seriesLabel="Registros"
        tableColumnLabel="Registros"
        tableDateHeader="Día"
        splitTable
        highlightTableActivity
        points={registrationTrendPoints}
        variant="bars"
        views={['activity', 'heatmap', 'area', 'table']}
        storageKey="sr_admin_registrations_view"
        headerControls={monthSelect}
        note="Serie diaria de nuevos registros del mes calendario seleccionado."
        loading={registrations.loading}
        emptyText="Sin registros en este mes"
        error={registrations.error}
        status={registrations.status}
        onRetry={registrations.retry}
      />

      {/* Distribuciones por plan: Compradores y Tiendas */}
      <section
        aria-label="Distribuciones por plan"
        className="grid grid-cols-1 gap-6 xl:grid-cols-2"
      >
        <DistributionCard
          title="Compradores por plan"
          subtitle="Distribución de cuentas de comprador según su plan actual"
          centerLabel="Compradores"
          rows={buyersRows}
          total={buyersTotal}
          storageKey="sr_admin_buyers_plan_view"
          note="Haz clic en un plan de la leyenda para ocultarlo o mostrarlo."
          loading={buyers.loading}
          empty={buyers.empty}
          emptyText="Aún no hay compradores registrados por plan"
          error={buyers.error}
          status={buyers.status}
          onRetry={buyers.retry}
        />
        <DistributionCard
          title="Tiendas por plan"
          subtitle="Estado actual de las suscripciones de almacenes aliados"
          centerLabel="Almacenes"
          rows={storesRows}
          total={storesTotal}
          storageKey="sr_admin_stores_plan_view"
          note="Haz clic en una categoría de la leyenda para ocultarla o mostrarla."
          loading={stores.loading}
          empty={stores.empty}
          emptyText="Aún no hay tiendas registradas por plan"
          error={stores.error}
          status={stores.status}
          onRetry={stores.retry}
        />
      </section>
    </div>
  )
}
