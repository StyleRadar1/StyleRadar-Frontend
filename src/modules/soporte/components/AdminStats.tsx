import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { ErrorState, EmptyState, Loading } from '@/modules/core/components/Status'
import { Button } from '@/modules/core/design-system'
import { useResource } from '@/modules/core/hooks/useResource'
import { formatCOP } from '@/modules/core/utils/format'
import {
  usePlatformBuyersByPlan,
  usePlatformStoresByPlan,
  usePlatformSubscriptionRevenue,
  usePlatformUserRegistrations,
  type StatisticState,
} from '../hooks/useStatistics'
import { useAdminIndicators } from '../hooks/useStats'
import { statsService } from '../services/statsService'
import type {
  CategoryCode,
  DistributionResponse,
  TimeSeriesPoint,
  TimeSeriesResponse,
} from '../types/statistics.dto'
import type {
  AdminDailyDto,
  AdminIndicatorsDto,
  DecisionModeracion,
  PendientePorGrupoDto,
  ResultadoModeracion,
} from '../types/stats.dto'
import { DataTable, Kpi, Panel, Swatch, TableToggle } from './charts'
import { card, descargarCsv, SERIE, tope } from '../utils/charts'

const num = (n: number) => n.toLocaleString('es-CO')

const MESES_CORTO = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

/** Parsea YYYY-MM-DD separando año, mes y día para evitar desfases de zona horaria. */
function parseIsoDateLocal(raw?: string | null): Date | null {
  if (!raw) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day)
}

/** Formatea YYYY-MM-DD como "nov 2026". */
function formatMonthShort(raw: string): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return raw
  return `${MESES_CORTO[date.getMonth()]} ${date.getFullYear()}`
}

/** Formatea YYYY-MM-DD como "01 nov". */
function formatDayShort(raw: string): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return raw
  const day = String(date.getDate()).padStart(2, '0')
  return `${day} ${MESES_CORTO[date.getMonth()]}`
}

/** Formatea YYYY-MM-DD como "noviembre de 2026". */
function formatMonthLong(raw?: string | null): string {
  const date = parseIsoDateLocal(raw)
  if (!date) return 'este mes'
  return `${MESES_LARGO[date.getMonth()]} de ${date.getFullYear()}`
}

function sumEntries<C extends CategoryCode>(res: DistributionResponse<C> | null): number {
  if (!res) return 0
  return (res.entries ?? []).reduce((sum, entry) => sum + entry.count, 0)
}

interface DailyPoint {
  fecha: string
  etiqueta: string
  registros: number
  publicaciones: number
}

/**
 * Estadísticas del administrador (/admin/estadisticas):
 * conectado a ms-estadisticas con valores totalizados minimalistas.
 */
export function AdminStatsView() {
  const navigate = useNavigate()
  const { data: ind, loading, error, reload } = useAdminIndicators()
  const buyers = usePlatformBuyersByPlan()
  const stores = usePlatformStoresByPlan()
  const revenue = usePlatformSubscriptionRevenue()
  const registrations = usePlatformUserRegistrations()

  const dailyLoader = useCallback(() => statsService.getAdminDaily(), [])
  const daily = useResource<AdminDailyDto | null>(dailyLoader, null)

  const has401 =
    buyers.status === 401 ||
    stores.status === 401 ||
    revenue.status === 401 ||
    registrations.status === 401

  useEffect(() => {
    if (has401) {
      guardarRetorno()
      navigate('/?login', { replace: true })
    }
  }, [has401, navigate])

  if (loading) return <Loading label="Cargando estadísticas de la plataforma…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!ind) return <EmptyState title="Sin datos">No hay indicadores disponibles</EmptyState>

  const regPoints = registrations.data?.points ?? []
  const registeredThisMonth = regPoints.reduce((sum, point) => sum + point.value, 0)

  const revPoints = revenue.data?.points ?? []
  const latestRevenuePoint = revPoints.length > 0 ? revPoints[revPoints.length - 1] : null
  const latestRevenueAmount = latestRevenuePoint ? latestRevenuePoint.value : ind.ingresosMes
  const latestRevenueLabel = latestRevenuePoint ? formatMonthShort(latestRevenuePoint.date) : 'este mes'

  const periodMonthLabel = formatMonthLong(
    registrations.data?.period?.startDate ?? regPoints[0]?.date,
  )

  const dailyPoints: DailyPoint[] = regPoints.map((point, idx) => {
    const legacyDay =
      daily.data?.dias.find((d) => d.fecha === point.date) ?? daily.data?.dias[idx]
    return {
      fecha: point.date,
      etiqueta: formatDayShort(point.date),
      registros: point.value,
      publicaciones: legacyDay?.publicaciones ?? 0,
    }
  })

  return (
    <div className="text-[var(--color-text)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-text-muted)]">
            Resumen general · {periodMonthLabel}
          </p>
          <h1 className="mt-1 text-5xl font-extrabold tracking-tight md:text-7xl text-[var(--color-text)]">
            Estadísticas
          </h1>
        </div>
        <p aria-hidden="true" className="text-right text-xl font-extrabold leading-none">
          StyleRadar<sup className="text-[10px]">®</sup>
          <span className="mt-1 block border-t border-[var(--color-border)] pt-1 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--color-text-muted)]">
            Bogotá
          </span>
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Estadísticas generales</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Indicadores globales de StyleRadar · {periodMonthLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportar(
              ind,
              registeredThisMonth,
              dailyPoints,
              revenue.data,
              sumEntries(buyers.data),
              sumEntries(stores.data),
            )
          }
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface)] text-[var(--color-text)]"
        >
          Exportar a Excel
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Usuarios registrados"
          value={registrations.loading ? '…' : num(registeredThisMonth)}
          hint="este mes"
        />
        <Kpi
          label="Tiendas verificadas"
          value={num(ind.tiendas.verificadas)}
          hint={`${ind.tiendas.pendientes} pendiente${ind.tiendas.pendientes === 1 ? '' : 's'} de verificación`}
        />
        <Kpi
          label="Fundaciones activas"
          value={num(ind.fundacionesActivas)}
          hint="Recibiendo donaciones"
        />
        <Kpi
          label={`Ingresos de ${latestRevenueLabel}`}
          value={revenue.loading ? '…' : formatCOP(latestRevenueAmount)}
          hint="Total mensual en COP"
        />
        <Kpi
          label="Prendas publicadas"
          value={num(ind.prendasPublicadas)}
          hint="En catálogo activo"
        />
        <Kpi
          label="Playlists creadas"
          value={num(ind.playlistsCreadas)}
          hint="Colecciones de usuarios"
        />
        <Kpi
          label="Donaciones este mes"
          value={num(ind.donacionesMes)}
          hint="Solicitudes registradas"
        />
      </div>

      {/* RF-87: Publicaciones pendientes de moderación por grupo */}
      <div className="mt-4">
        <PendingModerationGroups initialGroups={ind.pendientesPorGrupo ?? []} />
      </div>

      <div className="mt-4">
        {registrations.loading ? (
          <div className={card}>
            <p role="status" className="text-sm text-[var(--color-text-muted)]">
              Cargando...
            </p>
          </div>
        ) : registrations.error ? (
          <div className={card}>
            <MetricErrorBlock
              error={registrations.error}
              status={registrations.status}
              onRetry={registrations.retry}
            />
          </div>
        ) : (
          <DailyActivity monthLabel={periodMonthLabel} dias={dailyPoints} />
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <IncomeBlock state={revenue} />
        <LiveUsers />
        <AccountsTotalsPanel buyers={buyers} stores={stores} />
      </div>
    </div>
  )
}

/* ─── Bloque reutilizable de error para métricas de ms-estadisticas ─── */

function MetricErrorBlock({
  error,
  status,
  onRetry,
}: {
  error: string
  status: number | null
  onRetry: () => void
}) {
  const navigate = useNavigate()
  return (
    <div role="alert" className="space-y-3">
      <p className="text-sm text-[var(--color-text)]">{error}</p>
      <div className="flex flex-wrap gap-2">
        {status === 401 ? (
          <Button
            type="button"
            onClick={() => {
              guardarRetorno()
              navigate('/?login', { replace: true })
            }}
          >
            Iniciar sesión
          </Button>
        ) : (
          <Button type="button" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}

/* ─── Cuentas por plan: solo totales (Compradores y Almacenes aliados) ─── */

function AccountTotalTile<C extends CategoryCode>({
  title,
  subtitle,
  state,
}: {
  title: string
  subtitle: string
  state: StatisticState<DistributionResponse<C>>
}) {
  const total = sumEntries(state.data)

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)]">
        {title}
      </p>

      {state.loading && (
        <p role="status" className="mt-3 text-sm text-[var(--color-text-muted)]">
          Cargando...
        </p>
      )}

      {!state.loading && state.error && (
        <div className="mt-3">
          <MetricErrorBlock error={state.error} status={state.status} onRetry={state.retry} />
        </div>
      )}

      {!state.loading && !state.error && (
        <div className="mt-2">
          <p className="text-4xl font-extrabold tabular-nums text-[var(--color-text)]">
            {num(total)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {state.empty ? 'Aún no hay cuentas' : subtitle}
          </p>
        </div>
      )}
    </div>
  )
}

function AccountsTotalsPanel({
  buyers,
  stores,
}: {
  buyers: StatisticState<DistributionResponse<'PLAN_RADAR' | 'PLAN_RADAR_PLUS'>>
  stores: StatisticState<DistributionResponse<'PLAN_STORE_MONTHLY' | 'SUSPENDED'>>
}) {
  return (
    <Panel
      title="Cuentas por plan"
      text="Totales registrados en la plataforma"
      className="lg:col-span-2"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AccountTotalTile
          title="Compradores"
          subtitle="Cuentas de compradores registradas"
          state={buyers}
        />
        <AccountTotalTile
          title="Almacenes aliados"
          subtitle="Tiendas registradas en la plataforma"
          state={stores}
        />
      </div>
    </Panel>
  )
}

/* ─── RF-87: Publicaciones pendientes por grupo ─── */

function PendingModerationGroups({ initialGroups }: { initialGroups: PendientePorGrupoDto[] }) {
  const [groups, setGroups] = useState<PendientePorGrupoDto[]>(initialGroups)
  const [lastDecision, setLastDecision] = useState<{
    publicadorId: string
    resultado: ResultadoModeracion
  } | null>(null)

  const handleDecision = (publicadorId: string, decision: DecisionModeracion) => {
    const resultado: ResultadoModeracion = decision === 'APROBAR' ? 'APROBADA' : 'RECHAZADA'
    setGroups((prev) => prev.filter((g) => g.publicadorId !== publicadorId))
    setLastDecision({ publicadorId, resultado })
  }

  return (
    <Panel
      title="Publicaciones pendientes de moderación"
      text="Agrupadas por tipo de publicador (TIENDA o USUARIO)"
    >
      {lastDecision && (
        <p role="status" className="mb-3 text-xs font-semibold text-arena">
          Grupo {lastDecision.publicadorId}: decisión aplicada ({lastDecision.resultado})
        </p>
      )}
      {groups.length === 0 ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          No hay publicaciones pendientes de moderación
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] text-sm">
          {groups.map((g) => (
            <li
              key={`${g.tipoPublicador}-${g.publicadorId}`}
              className="flex flex-wrap items-center justify-between gap-3 py-2.5"
            >
              <div>
                <span className="font-semibold">{g.tipoPublicador}</span>
                {' · '}
                <span className="font-mono text-xs">{g.publicadorId}</span>
                {' · '}
                <span className="text-[var(--color-text-muted)]">{g.cantidad} pendientes</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDecision(g.publicadorId, 'APROBAR')}
                  className="rounded-lg bg-violeta px-3 py-1 text-xs font-semibold text-blanco"
                >
                  Aprobar grupo
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(g.publicadorId, 'RECHAZAR')}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs font-semibold"
                >
                  Rechazar grupo
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/* ─── Actividad diaria: Registros (PLATFORM_USER_REGISTRATIONS) y Publicaciones ─── */

function DailyActivity({ monthLabel, dias }: { monthLabel: string; dias: DailyPoint[] }) {
  const [tabla, setTabla] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const n = dias.length
  const rawMax = Math.max(...dias.flatMap((d) => [d.registros, d.publicaciones]), 0)
  const maxRP = rawMax > 0 ? tope(rawMax) : 0

  return (
    <Panel
      title={`Actividad diaria · ${monthLabel}`}
      text="Nuevos registros y prendas publicadas por día"
      action={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!tabla && (
            <ul
              className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[var(--color-text-muted)]"
              aria-label="Leyenda de actividad diaria"
            >
              <li className="flex items-center gap-1.5">
                <Swatch i={1} />
                Registros
              </li>
              <li className="flex items-center gap-1.5">
                <Swatch i={0} />
                Publicaciones
              </li>
            </ul>
          )}
          <TableToggle on={tabla} onChange={setTabla} />
        </div>
      }
    >
      {dias.length === 0 ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Sin actividad registrada en el periodo.
        </p>
      ) : tabla ? (
        <DataTable
          caption="Detalle de actividad diaria"
          head={['Día', 'Registros', 'Publicaciones']}
          rows={dias.map((d) => [d.etiqueta, d.registros, d.publicaciones])}
        />
      ) : (
        <div className="relative grid grid-cols-[2.75rem_1fr] gap-x-2">
          <div
            aria-hidden="true"
            className="flex h-32 flex-col justify-between text-right text-[10px] tabular-nums text-[var(--color-text-muted)]"
          >
            <span>{maxRP}</span>
            <span>{maxRP > 0 ? maxRP / 2 : 0}</span>
            <span>0</span>
          </div>
          <div className="relative h-32">
            <div
              aria-hidden="true"
              className="flex h-full items-end border-b border-[var(--color-border)]"
            >
              {dias.map((d, i) => (
                <div
                  key={d.fecha}
                  className={`flex h-full flex-1 items-end justify-center gap-[2px] ${hover === i ? 'bg-[var(--color-surface)]' : ''}`}
                >
                  <span
                    className="w-[30%] max-w-2 rounded-t-[3px]"
                    style={{
                      height: `${maxRP > 0 ? (d.registros / maxRP) * 100 : 0}%`,
                      background: SERIE[1],
                    }}
                  />
                  <span
                    className="w-[30%] max-w-2 rounded-t-[3px]"
                    style={{
                      height: `${maxRP > 0 ? (d.publicaciones / maxRP) * 100 : 0}%`,
                      background: SERIE[0],
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Eje de días */}
          <span />
          <div
            aria-hidden="true"
            className="flex pt-1 text-[10px] text-[var(--color-text-muted)]"
          >
            {dias.map((d, i) => (
              <span key={d.fecha} className="flex-1 text-center">
                {i % 3 === 0 ? d.etiqueta : ''}
              </span>
            ))}
          </div>
          {/* Zona de interacción por día */}
          <ol
            className="absolute bottom-5 left-[calc(2.75rem+.5rem)] right-0 top-0 flex"
            aria-label="Actividad por día"
          >
            {dias.map((d, i) => (
              <li
                key={d.fecha}
                tabIndex={0}
                className="relative flex-1 outline-none focus-visible:ring-2 focus-visible:ring-violeta-claro"
                aria-label={`${d.etiqueta}: ${d.registros} registros y ${d.publicaciones} publicaciones`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                {hover === i && (
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute top-2 z-10 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] shadow-lg ${i > n / 2 ? 'right-full mr-1' : 'left-full ml-1'}`}
                  >
                    <b className="block">{d.etiqueta}</b>
                    <span className="flex items-center gap-1.5">
                      <Swatch i={1} />
                      Registros <b className="ml-auto pl-3 tabular-nums">{d.registros}</b>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Swatch i={0} />
                      Publicaciones <b className="ml-auto pl-3 tabular-nums">{d.publicaciones}</b>
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Panel>
  )
}

/* ─── Ingresos por suscripciones (una sola serie: Total en COP) ─── */

function IncomeBlock({ state }: { state: StatisticState<TimeSeriesResponse> }) {
  const [tabla, setTabla] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const points: TimeSeriesPoint[] = state.data?.points ?? []
  const rawMax = Math.max(...points.map((p) => p.value), 0)
  const axisMax = rawMax > 0 ? tope(rawMax) : 0
  const allZero = points.length === 0 || rawMax === 0

  return (
    <Panel
      title="Ingresos por suscripciones"
      text="Total mensual en COP"
      action={!state.loading && !state.error ? <TableToggle on={tabla} onChange={setTabla} /> : undefined}
    >
      {state.loading && (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Cargando...
        </p>
      )}

      {!state.loading && state.error && (
        <MetricErrorBlock error={state.error} status={state.status} onRetry={state.retry} />
      )}

      {!state.loading && !state.error && (
        <>
          {allZero && (
            <p role="status" className="mb-3 text-sm text-[var(--color-text-muted)]">
              Sin ingresos en el periodo
            </p>
          )}
          {tabla ? (
            <DataTable
              caption="Ingresos por suscripciones por mes"
              head={['Mes', 'Total']}
              rows={points.map((p) => [formatMonthShort(p.date), formatCOP(p.value)])}
            />
          ) : (
            <div className="relative grid h-48 grid-cols-[auto_1fr] gap-2">
              <div
                aria-hidden="true"
                className="flex flex-col justify-between pb-5 text-right text-[10px] tabular-nums text-[var(--color-text-muted)]"
              >
                <span>{formatCOP(axisMax)}</span>
                <span>{formatCOP(axisMax > 0 ? Math.round(axisMax / 2) : 0)}</span>
                <span>{formatCOP(0)}</span>
              </div>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--color-border)]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-[calc(50%-10px)] border-t border-dashed border-[var(--color-border)]"
                />
                <ol
                  className="absolute inset-0 flex items-stretch"
                  aria-label="Ingresos por suscripciones"
                >
                  {points.map((p, i) => {
                    const label = formatMonthShort(p.date)
                    const heightPct = axisMax > 0 ? (p.value / axisMax) * 100 : 0
                    return (
                      <li
                        key={p.date}
                        tabIndex={0}
                        className="relative flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-violeta-claro"
                        aria-label={`${label}: Total ${formatCOP(p.value)}`}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(i)}
                        onBlur={() => setHover(null)}
                      >
                        <div
                          className={`flex flex-1 items-end justify-center border-b border-[var(--color-border)] px-1 py-1 rounded-t-xl transition ${hover === i ? 'bg-[var(--color-surface)]' : ''}`}
                        >
                          <span className="flex h-full w-4 items-end rounded-full bg-[var(--color-border)]/40 sm:w-6">
                            <span
                              className="w-full rounded-full transition-all duration-300"
                              style={{ height: `${heightPct}%`, background: SERIE[0] }}
                            />
                          </span>
                        </div>
                        <span
                          aria-hidden="true"
                          className="h-5 pt-1 text-center text-[10px] text-[var(--color-text-muted)]"
                        >
                          {label}
                        </span>
                        {hover === i && (
                          <span
                            role="tooltip"
                            className={`pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] shadow-lg ${i > points.length / 2 ? 'right-0' : 'left-0'}`}
                          >
                            <b className="block">{label}</b>
                            <span className="flex items-center gap-2">
                              Total <b className="ml-auto pl-3 tabular-nums">{formatCOP(p.value)}</b>
                            </span>
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

/** Sesiones abiertas: se consulta cada 15 s solo con la pestaña visible, como en el prototipo. */
function LiveUsers() {
  const [sesiones, setSesiones] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let activo = true
    const cargar = () => {
      if (document.visibilityState !== 'visible') return
      statsService
        .getAdminLive()
        .then((r) => {
          if (activo) {
            setSesiones(r.sesionesAbiertas)
            setError(false)
          }
        })
        .catch(() => {
          if (activo) setError(true)
        })
    }
    cargar()
    const t = window.setInterval(cargar, 15_000)
    document.addEventListener('visibilitychange', cargar)
    return () => {
      activo = false
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', cargar)
    }
  }, [])

  return (
    <Panel
      title="Usuarios conectados ahora"
      text="Sesiones activas en la plataforma en tiempo real"
      action={
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#9be3b4]/40 px-2.5 py-1 text-[11px] font-semibold text-[#9be3b4]">
          <i
            aria-hidden="true"
            className="h-2 w-2 animate-pulse rounded-full bg-[#9be3b4] motion-reduce:animate-none"
          />
          En vivo
        </span>
      }
    >
      {error && sesiones === null ? (
        <p role="alert" className="text-sm text-[#ffb4b4]">
          No pudimos consultar las sesiones abiertas
        </p>
      ) : (
        <>
          <p className="text-4xl font-extrabold tabular-nums" aria-live="polite">
            {sesiones === null ? '—' : num(sesiones)}
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-text-muted)]">
            Actualizado cada 15 s · Se pausa automáticamente en segundo plano
          </p>
        </>
      )}
    </Panel>
  )
}

function exportar(
  ind: AdminIndicatorsDto,
  usuariosRegistradosMes: number,
  daily: DailyPoint[],
  revenue: TimeSeriesResponse | null,
  compradoresTotal: number,
  almacenesTotal: number,
) {
  const revPoints = revenue?.points ?? []
  const latestRevenue = revPoints.length > 0 ? revPoints[revPoints.length - 1].value : ind.ingresosMes
  descargarCsv('estadisticas-styleradar', [
    ['Estadísticas generales de StyleRadar'],
    [],
    ['Indicador', 'Valor'],
    ['Usuarios registrados (este mes)', usuariosRegistradosMes],
    ['Tiendas verificadas', ind.tiendas.verificadas],
    ['Tiendas pendientes de verificación', ind.tiendas.pendientes],
    ['Fundaciones activas', ind.fundacionesActivas],
    ['Ingresos del mes', latestRevenue],
    ['Prendas publicadas', ind.prendasPublicadas],
    ['Playlists creadas', ind.playlistsCreadas],
    ['Donaciones este mes', ind.donacionesMes],
    [],
    ['Día', 'Registros', 'Publicaciones'],
    ...daily.map((d) => [d.etiqueta, d.registros, d.publicaciones]),
    [],
    ['Mes', 'Total'],
    ...revPoints.map((p) => [formatMonthShort(p.date), formatCOP(p.value)]),
    [],
    ['Grupo', 'Total'],
    ['Compradores', compradoresTotal],
    ['Almacenes aliados', almacenesTotal],
  ])
}
