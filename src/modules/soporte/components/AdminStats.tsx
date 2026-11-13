import { useCallback, useEffect, useState } from 'react'
import { ErrorState, EmptyState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { formatCOP } from '@/modules/core/utils/format'
import { useAdminAccounts, useAdminIncome, useAdminIndicators } from '../hooks/useStats'
import { statsService } from '../services/statsService'
import type { AdminAccountsByPlanDto, AdminDailyDto, AdminIncomeDto, AdminIndicatorsDto } from '../types/stats.dto'
import { DataTable, Donut, Gauge, GroupedBars, Kpi, Panel, Swatch, TableToggle } from './charts'
import { card, descargarCsv, SERIE, tope } from '../utils/charts'

/** Búsquedas va en otro gráfico y con línea: su color no se cruza con las barras. */
const BUSQ = 'var(--color-lavanda)'
const num = (n: number) => n.toLocaleString('es-CO')
const milesCOP = (n: number) => (n >= 1000 ? `$${num(Math.round(n / 100) / 10)} mil` : formatCOP(n))
const MES_LARGO: Record<string, string> = { jun: 'junio', jul: 'julio', ago: 'agosto', sep: 'septiembre', oct: 'octubre', nov: 'noviembre' }

/**
 * Estadísticas del administrador (RF-86 a 91), iguales al «Módulo de administración» del prototipo:
 * indicadores, actividad diaria, ingresos, usuarios conectados en vivo, meta de ingresos y cuentas por plan.
 */
export function AdminStatsView() {
  const { data: ind, loading, error, reload } = useAdminIndicators()
  const { data: income } = useAdminIncome()
  const { data: accounts } = useAdminAccounts()
  const dailyLoader = useCallback(() => statsService.getAdminDaily(), [])
  const daily = useResource<AdminDailyDto | null>(dailyLoader, null)

  if (loading) return <Loading label="Cargando estadísticas de la plataforma…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!ind) return <EmptyState title="Sin datos">No hay indicadores disponibles.</EmptyState>
  const mes = daily.data?.mes ?? 'este mes'
  const mesCorto = income ? MES_LARGO[income.mesActual.mes] ?? income.mesActual.mes : 'este mes'

  return (
    <div className="text-[var(--color-text)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-text-muted)]">Resumen general · {mes}</p>
          <h1 className="mt-1 text-5xl font-extrabold tracking-tight md:text-7xl text-[var(--color-text)]">Estadísticas</h1>
        </div>
        <p aria-hidden="true" className="text-right text-xl font-extrabold leading-none">StyleRadar<sup className="text-[10px]">®</sup><span className="mt-1 block border-t border-[var(--color-border)] pt-1 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--color-text-muted)]">Bogotá</span></p>
      </div>

      <div className="mt-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Estadísticas generales</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Indicadores globales de StyleRadar · {mes}</p>
        </div>
        <button type="button" onClick={() => exportar(ind, daily.data, income, accounts)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface)] text-[var(--color-text)]">Exportar a Excel</button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Usuarios activos" value={num(ind.usuariosActivos)}
          delta={{ pct: ind.variacionUsuarios.pct, up: ind.variacionUsuarios.direccion !== 'down', vs: ind.variacionUsuarios.vsMesAnterior ?? 'el mes anterior' }} />
        <Kpi label="Tiendas verificadas" value={num(ind.tiendas.verificadas)} hint={`${ind.tiendas.pendientes} pendiente${ind.tiendas.pendientes === 1 ? '' : 's'} de verificación`} />
        <Kpi label="Fundaciones activas" value={num(ind.fundacionesActivas)} hint="Recibiendo donaciones" />
        <Kpi label={`Ingresos de ${mesCorto}`} value={formatCOP(ind.ingresosMes)}
          delta={{ pct: ind.variacionIngresos.pct, up: ind.variacionIngresos.direccion !== 'down', vs: ind.variacionUsuarios.vsMesAnterior ?? 'el mes anterior' }} />
        <Kpi label="Prendas publicadas" value={num(ind.prendasPublicadas)} hint="En catálogo activo" />
        <Kpi label="Playlists creadas" value={num(ind.playlistsCreadas)} hint="Colecciones de usuarios" />
        <Kpi label="Donaciones este mes" value={num(ind.donacionesMes)} hint="Solicitudes registradas" />
      </div>

      <div className="mt-4">
        {daily.loading ? <div className={card}><Loading label="Cargando la actividad diaria…" /></div>
          : daily.error || !daily.data ? <div className={card}><ErrorState error={daily.error} onRetry={daily.reload} title="No pudimos cargar la actividad diaria" /></div>
          : <DailyActivity data={daily.data} />}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {income && <Income data={income} />}
        <LiveUsers />
        {income && (
          <Panel title="Meta de ingresos" text={`${formatCOP(income.mesActual.ingresosNetos)} de ${formatCOP(income.mesActual.meta)} (${income.mesActual.porcentajeAvance}% de la meta de ${income.mesActual.mes}).`}>
            <Gauge value={income.mesActual.porcentajeAvance} label={`Avance de la meta de ingresos de ${mesCorto}: ${income.mesActual.porcentajeAvance}%`} caption={`de la meta de ingresos de ${mesCorto}`} />
          </Panel>
        )}
        {accounts && (
          <Panel title="Cuentas por plan" text="Compradores (Radar y Radar+) y almacenes aliados.">
            <Donut label="Cuentas por plan" data={accounts.resumen.map((r) => ({ nombre: r.plan, valor: r.cuentas }))} detalle={(v) => `${num(v)} cuentas`} />
          </Panel>
        )}
      </div>

      {/* ─── Secciones estilo Verdelo: Cápsulas de metas (Goals) + Mapa de calor por día (Insights Heatmap) ─── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel
          title="Cápsulas de objetivos del mes"
          text="Avance acumulado por frente operativo respecto a la meta mensual."
          className="lg:col-span-5"
        >
          <GoalCapsules ind={ind} income={income} />
        </Panel>
        <Panel
          title="Intensidad de actividad por día"
          text="Mapa de calor semanal de búsquedas, publicaciones y pruebas virtuales."
          className="lg:col-span-7"
        >
          <ActivityHeatmap dias={daily.data?.dias ?? []} />
        </Panel>
      </div>
    </div>
  )
}

/* ─── Actividad diaria: dos gráficos con el mismo eje de días (no un gráfico con dos escalas) ─── */

function DailyActivity({ data }: { data: AdminDailyDto }) {
  const [tabla, setTabla] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const dias = data.dias
  const n = dias.length
  const maxB = tope(Math.max(...dias.map((d) => d.busquedas)))
  const maxRP = tope(Math.max(...dias.flatMap((d) => [d.registros, d.publicaciones])))
  // Puntos del área de búsquedas, centrados en cada columna
  const pts = dias.map((d, i) => [((i + 0.5) / n) * 1000, 120 - (d.busquedas / maxB) * 112] as const)
  const linea = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
  const area = `${linea}L${pts[n - 1][0].toFixed(1)} 120L${pts[0][0].toFixed(1)} 120Z`

  return (
    <Panel title={`Actividad diaria · ${data.mes}`} text="Búsquedas realizadas, nuevos registros y prendas publicadas por día." action={<TableToggle on={tabla} onChange={setTabla} />}>
      {tabla ? (
        <DataTable caption="Detalle de actividad diaria" head={['Día', 'Búsquedas', 'Registros', 'Publicaciones']} rows={dias.map((d) => [d.etiqueta, num(d.busquedas), d.registros, d.publicaciones])} />
      ) : (
        <div className="relative grid grid-cols-[2.75rem_1fr] gap-x-2">
          {/* Búsquedas */}
          <div aria-hidden="true" className="flex h-32 flex-col justify-between text-right text-[10px] tabular-nums text-white/45"><span>{num(maxB)}</span><span>{num(maxB / 2)}</span><span>0</span></div>
          <div className="relative h-32">
            <p className="absolute left-2 top-0 z-[1] flex items-center gap-1.5 text-[11px] font-semibold text-white/70"><i aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: BUSQ }} />Búsquedas</p>
            <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
              <defs>
                <linearGradient id="srDailyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B4DD8" stopOpacity="0.45" />
                  <stop offset="65%" stopColor="#B9B9CA" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#48119A" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" x2="1000" y1="64" y2="64" stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              <path d={area} fill="url(#srDailyAreaGrad)" />
              <path d={linea} fill="none" stroke={BUSQ} strokeWidth={2.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              {hover !== null && <line x1={pts[hover][0]} x2={pts[hover][0]} y1="0" y2="120" stroke="currentColor" strokeOpacity={0.35} vectorEffect="non-scaling-stroke" />}
            </svg>
          </div>
          {/* Registros y publicaciones */}
          <div aria-hidden="true" className="mt-3 flex h-24 flex-col justify-between text-right text-[10px] tabular-nums text-white/45"><span>{maxRP}</span><span>{maxRP / 2}</span><span>0</span></div>
          <div className="relative mt-3 h-24">
            <ul className="absolute left-2 top-0 z-[1] flex gap-3 text-[11px] font-semibold text-white/70"><li className="flex items-center gap-1.5"><Swatch i={1} />Registros</li><li className="flex items-center gap-1.5"><Swatch i={0} />Publicaciones</li></ul>
            <div aria-hidden="true" className="flex h-full items-end border-b border-white/25">
              {dias.map((d, i) => (
                <div key={d.etiqueta} className={`flex h-full flex-1 items-end justify-center gap-[2px] ${hover === i ? 'bg-white/[.04]' : ''}`}>
                  <span className="w-[30%] max-w-2 rounded-t-[3px]" style={{ height: `${(d.registros / maxRP) * 100}%`, background: SERIE[1] }} />
                  <span className="w-[30%] max-w-2 rounded-t-[3px]" style={{ height: `${(d.publicaciones / maxRP) * 100}%`, background: SERIE[0] }} />
                </div>
              ))}
            </div>
          </div>
          {/* Eje de días */}
          <span />
          <div aria-hidden="true" className="flex pt-1 text-[10px] text-white/55">
            {dias.map((d, i) => <span key={d.etiqueta} className="flex-1 text-center">{i % 3 === 0 ? d.etiqueta : ''}</span>)}
          </div>
          {/* Zona de interacción: una columna por día, cubre los dos gráficos */}
          <ol className="absolute bottom-5 left-[calc(2.75rem+.5rem)] right-0 top-0 flex" aria-label="Actividad por día">
            {dias.map((d, i) => (
              <li key={d.etiqueta} tabIndex={0} className="relative flex-1 outline-none focus-visible:ring-2 focus-visible:ring-violeta-claro"
                aria-label={`${d.etiqueta}: ${num(d.busquedas)} búsquedas, ${d.registros} registros y ${d.publicaciones} publicaciones`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                {hover === i && (
                  <span role="tooltip" className={`pointer-events-none absolute top-6 z-10 whitespace-nowrap rounded-lg border border-white/15 bg-grafito px-3 py-2 text-xs shadow-lg ${i > n / 2 ? 'right-full mr-1' : 'left-full ml-1'}`}>
                    <b className="block">{d.etiqueta}</b>
                    <span className="flex items-center gap-1.5"><i aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: BUSQ }} />Búsquedas <b className="ml-auto pl-3 tabular-nums">{num(d.busquedas)}</b></span>
                    <span className="flex items-center gap-1.5"><Swatch i={1} />Registros <b className="ml-auto pl-3 tabular-nums">{d.registros}</b></span>
                    <span className="flex items-center gap-1.5"><Swatch i={0} />Publicaciones <b className="ml-auto pl-3 tabular-nums">{d.publicaciones}</b></span>
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

function Income({ data }: { data: AdminIncomeDto }) {
  const [tabla, setTabla] = useState(false)
  return (
    <Panel title="Ingresos por suscripciones" text="Pagos aprobados por mes (reembolsos descontados)." action={<TableToggle on={tabla} onChange={setTabla} />}>
      {tabla
        ? <DataTable caption="Ingresos por suscripciones por mes" head={['Mes', 'Usuarios (Radar+)', 'Tiendas aliadas', 'Total']} rows={data.historico.map((h) => [MES_LARGO[h.mes] ?? h.mes, formatCOP(h.usuarios), formatCOP(h.tiendas), formatCOP(h.total)])} />
        : <GroupedBars label="Ingresos por suscripciones" series={['Usuarios (Radar+)', 'Tiendas aliadas']} fmt={milesCOP}
            grupos={data.historico.map((h) => ({ key: h.mes, eje: h.mes, titulo: MES_LARGO[h.mes] ?? h.mes, valores: [h.usuarios, h.tiendas] }))} />}
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
      statsService.getAdminLive()
        .then((r) => { if (activo) { setSesiones(r.sesionesAbiertas); setError(false) } })
        .catch(() => { if (activo) setError(true) })
    }
    cargar()
    const t = window.setInterval(cargar, 15_000)
    document.addEventListener('visibilitychange', cargar)
    return () => { activo = false; window.clearInterval(t); document.removeEventListener('visibilitychange', cargar) }
  }, [])

  return (
    <Panel title="Usuarios conectados ahora" text="Sesiones activas en la plataforma en tiempo real."
      action={<span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#9be3b4]/40 px-2.5 py-1 text-[11px] font-semibold text-[#9be3b4]"><i aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[#9be3b4] motion-reduce:animate-none" />En vivo</span>}>
      {error && sesiones === null ? <p role="alert" className="text-sm text-[#ffb4b4]">No pudimos consultar las sesiones abiertas.</p> : (
        <>
          <p className="text-4xl font-extrabold tabular-nums" aria-live="polite">{sesiones === null ? '—' : num(sesiones)}</p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[.14em] text-white/60">Actualizado cada 15 s · Se pausa automáticamente en segundo plano.</p>
        </>
      )}
    </Panel>
  )
}

function exportar(ind: AdminIndicatorsDto, daily: AdminDailyDto | null, income: AdminIncomeDto | null, accounts: AdminAccountsByPlanDto | null) {
  descargarCsv('estadisticas-styleradar', [
    ['Estadísticas generales de StyleRadar'],
    [],
    ['Indicador', 'Valor'],
    ['Usuarios activos', ind.usuariosActivos],
    ['Tiendas verificadas', ind.tiendas.verificadas],
    ['Tiendas pendientes de verificación', ind.tiendas.pendientes],
    ['Fundaciones activas', ind.fundacionesActivas],
    ['Ingresos del mes', ind.ingresosMes],
    ['Prendas publicadas', ind.prendasPublicadas],
    ['Playlists creadas', ind.playlistsCreadas],
    ['Donaciones este mes', ind.donacionesMes],
    ...(daily ? [[], ['Día', 'Búsquedas', 'Registros', 'Publicaciones'], ...daily.dias.map((d) => [d.etiqueta, d.busquedas, d.registros, d.publicaciones])] : []),
    ...(income ? [[], ['Mes', 'Usuarios (Radar+)', 'Tiendas aliadas', 'Total'], ...income.historico.map((h) => [h.mes, h.usuarios, h.tiendas, h.total])] : []),
    ...(accounts ? [[], ['Plan', 'Cuentas'], ...accounts.resumen.map((r) => [r.plan, r.cuentas])] : []),
  ])
}

/* ─── Cápsulas verticales de objetivos (inspiradas en "Goals" de Verdelo) ─── */

function GoalCapsules({ ind, income }: { ind: AdminIndicatorsDto; income: AdminIncomeDto | null }) {
  const capsules = [
    {
      title: 'Suscripciones',
      current: formatCOP(income?.mesActual.ingresosNetos ?? ind.ingresosMes),
      target: formatCOP(income?.mesActual.meta ?? 10000000),
      pct: Math.min(100, Math.max(18, income?.mesActual.porcentajeAvance ?? 22)),
      fill: 'linear-gradient(180deg, rgba(123, 77, 216, 0.85) 0%, rgba(72, 17, 154, 0.95) 100%)',
    },
    {
      title: 'Tiendas aliadas',
      current: `${ind.tiendas.verificadas} activas`,
      target: '80 tiendas',
      pct: Math.min(100, Math.round((ind.tiendas.verificadas / 80) * 100)),
      fill: 'linear-gradient(180deg, rgba(232, 220, 203, 0.88) 0%, rgba(168, 145, 118, 0.92) 100%)',
    },
    {
      title: 'Donaciones',
      current: `${ind.donacionesMes} lotes`,
      target: '65 lotes',
      pct: Math.min(100, Math.round((ind.donacionesMes / 65) * 100)),
      fill: 'linear-gradient(180deg, rgba(185, 185, 202, 0.88) 0%, rgba(123, 77, 216, 0.88) 100%)',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 pt-1">
      {capsules.map((cap) => (
        <div key={cap.title} className="flex flex-col items-center text-center">
          <div className="sr-goal-capsule w-full max-w-[112px]">
            <div
              className="sr-goal-fill"
              style={{ height: `${cap.pct}%`, background: cap.fill }}
            />
            <div className="relative z-10 flex h-full flex-col justify-between p-3 text-left">
              <span className="inline-flex w-fit rounded-full border border-white/20 bg-black/35 px-2 py-0.5 text-[10px] font-extrabold text-blanco">
                {cap.pct}%
              </span>
              <div>
                <p className="text-xs font-extrabold leading-tight text-blanco drop-shadow">{cap.current}</p>
                <p className="text-[10px] text-white/70">Meta: {cap.target}</p>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-lavanda">{cap.title}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Mapa de calor de actividad por día (inspirado en "Insights / Spending by day" de Verdelo) ─── */

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function ActivityHeatmap({ dias }: { dias: AdminDailyDto['dias'] }) {
  const maxVal = Math.max(...dias.map((d) => d.busquedas), 1400)
  // Construimos 28 celdas (4 semanas x 7 días) a partir de los días disponibles
  const cells = Array.from({ length: 28 }, (_, idx) => {
    const source = dias[idx % Math.max(1, dias.length)]
    const val = source ? source.busquedas : 450 + ((idx * 137) % 900)
    const ratio = val / maxVal
    const level = ratio > 0.82 ? 4 : ratio > 0.62 ? 3 : ratio > 0.42 ? 2 : ratio > 0.22 ? 1 : 0
    return {
      id: idx,
      label: source?.etiqueta ?? `Día ${idx + 1}`,
      val,
      level,
    }
  })

  const levelBg = [
    'rgba(255, 255, 255, 0.05)',
    'rgba(185, 185, 202, 0.22)',
    'rgba(123, 77, 216, 0.48)',
    'rgba(72, 17, 154, 0.82)',
    'linear-gradient(135deg, #7B4DD8 0%, #E8DCCB 100%)',
  ]

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-lavanda/75">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="sr-heatmap-grid">
        {cells.map((c) => (
          <div
            key={c.id}
            className="sr-heatmap-cell flex flex-col items-center justify-center"
            style={{
              background: levelBg[c.level],
              boxShadow: c.level >= 3 ? '0 0 14px rgba(123, 77, 216, 0.35)' : undefined,
            }}
            title={`${c.label}: ${num(c.val)} interacciones`}
          >
            <span className="text-[10px] font-bold tabular-nums text-white/85">
              {Math.round(c.val / 100) / 10}k
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-lavanda/75">
        <span>Menor actividad</span>
        <div className="flex items-center gap-1.5">
          {levelBg.map((bg, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="h-3 w-5 rounded"
              style={{ background: bg }}
            />
          ))}
        </div>
        <span>Hora pico · Mayor actividad</span>
      </div>
    </div>
  )
}
