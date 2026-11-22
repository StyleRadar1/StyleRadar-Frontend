import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StoreSuspendedBanner } from '@/modules/transacciones/components/StoreSuspendedBanner'
import './StoreStatsPage.css'

export type StoreStatsPeriod = '7_DIAS' | '30_DIAS' | '90_DIAS'
type Point = { fecha: string; visits: number; messages: number }

export const STORE_NO_WEEKLY_GOAL_MSG = 'Tu tienda aún no tiene una meta semanal de visitas'

/**
 * RF-76.1 y RF-76.2 (C.1): Calcula el texto de variación frente al periodo anterior
 * con "periodos" sin tilde y reglas exactas para ceros.
 */
export function formatStoreKpiVariation(
  actual: number,
  anterior: number,
  unidad: 'visitas' | 'mensajes',
): string {
  if (actual === 0 && anterior > 0) return '−100 %'
  if (actual === 0 && anterior === 0) return `Sin variación: ambos periodos sin ${unidad}`
  if (anterior === 0 && actual > 0) return `No calculable: periodo anterior con 0 ${unidad}`
  const pct = ((actual - anterior) / anterior) * 100
  const sign = pct >= 0 ? '▲' : '▼'
  return `${sign} ${Math.abs(pct).toFixed(1)}% vs periodo anterior`
}

const baseDaily: { visits: number; messages: number }[] = [
  { visits: 38, messages: 2 }, { visits: 42, messages: 1 }, { visits: 44, messages: 2 },
  { visits: 53, messages: 3 }, { visits: 68, messages: 2 }, { visits: 59, messages: 1 },
  { visits: 56, messages: 2 }, { visits: 44, messages: 2 }, { visits: 39, messages: 1 },
  { visits: 48, messages: 3 }, { visits: 71, messages: 2 }, { visits: 76, messages: 2 },
  { visits: 63, messages: 1 }, { visits: 44, messages: 2 }, { visits: 61, messages: 2 },
  { visits: 43, messages: 2 }, { visits: 36, messages: 1 }, { visits: 48, messages: 2 },
  { visits: 39, messages: 1 }, { visits: 78, messages: 3 }, { visits: 59, messages: 2 },
  { visits: 53, messages: 2 }, { visits: 60, messages: 1 }, { visits: 38, messages: 1 },
  { visits: 45, messages: 2 }, { visits: 62, messages: 2 }, { visits: 75, messages: 3 },
  { visits: 59, messages: 2 }, { visits: 64, messages: 1 }, { visits: 51, messages: 2 },
]

const periodLabels: Record<StoreStatsPeriod, string> = {
  '7_DIAS': '7 días',
  '30_DIAS': '30 días',
  '90_DIAS': '90 días',
}

function buildPeriodSeries(period: StoreStatsPeriod): Point[] {
  const days = period === '7_DIAS' ? 7 : period === '30_DIAS' ? 30 : 90
  const start = new Date(Date.UTC(2026, 10, 10 - (days - 1)))
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(start.getTime() + index * 86_400_000)
    const fecha = d.toISOString().slice(0, 10)
    const sample = baseDaily[index % baseDaily.length]
    const visits = period === '30_DIAS' && index === 17 ? 112 : (sample?.visits ?? 0)
    const messages = period === '30_DIAS' && index === 17 ? 6 : (sample?.messages ?? 0)
    return { fecha, visits, messages }
  })
}

function smoothPath(values: number[], width: number, height: number, max: number) {
  const pts = values.map((value, index) => ({
    x: (index / Math.max(values.length - 1, 1)) * width,
    y: height - (value / max) * (height - 12) - 6,
  }))
  if (!pts.length) return ''
  return pts.reduce((path, point, index) => {
    if (!index) return `M ${point.x} ${point.y}`
    const previous = pts[index - 1]
    const midX = (previous.x + point.x) / 2
    return `${path} Q ${midX} ${previous.y}, ${midX} ${(previous.y + point.y) / 2} T ${point.x} ${point.y}`
  }, '')
}

function ActivityChart({ points, period, table }: { points: Point[]; period: StoreStatsPeriod; table: boolean }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const width = 900
  const height = 190
  const max = Math.max(...points.map((point) => point.visits), 1) * 1.15
  const maxMessages = Math.max(...points.map((point) => point.messages), 1) * 2.4
  const visitsPath = smoothPath(points.map((point) => point.visits), width, height, max)
  const messagesPath = smoothPath(points.map((point) => point.messages), width, height, maxMessages)
  const areaPath = `${visitsPath} L ${width} ${height} L 0 ${height} Z`

  if (table) return (
    <div className="store-stats__table-wrap">
      <table className="store-stats__table">
        <thead>
          <tr><th>Fecha</th><th>Visitas</th><th>Mensajes</th></tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.fecha}>
              <td>{point.fecha}</td>
              <td>{point.visits}</td>
              <td>{point.messages}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const labels = period === '7_DIAS'
    ? points.map((p) => p.fecha.slice(5))
    : period === '30_DIAS'
      ? ['12 oct', '16 oct', '20 oct', '24 oct', '28 oct', '1 nov', '5 nov', '10 nov']
      : ['ago', 'sep', 'oct', 'nov']
  const activePoint = activeIndex === null ? null : points[activeIndex]
  const activeDate = activePoint ? activePoint.fecha : ''
  const activeX = activeIndex === null ? 0 : Math.max(7, Math.min(93, (activeIndex / Math.max(points.length - 1, 1)) * 100))
  const activeY = activePoint ? Math.max(7, Math.min(62, (1 - activePoint.visits / max) * 100)) : 0
  const markerX = activeIndex === null ? 0 : (activeIndex / Math.max(points.length - 1, 1)) * width
  const visitY = activePoint ? height - (activePoint.visits / max) * (height - 12) - 6 : 0
  const msgY = activePoint ? height - (activePoint.messages / maxMessages) * (height - 12) - 6 : 0
  return (
    <div className="store-stats__chart" role="group" aria-label="Actividad diaria: visitas por día y mensajes recibidos por día">
      <div className="store-stats__chart-legend">
        <span><i className="legend-visits" />Visitas por día</span>
        <span><i className="legend-messages" />Mensajes por día</span>
      </div>
      <div className="store-stats__plot">
        {[0, 1, 2, 3].map((line) => <div className="store-stats__gridline" key={line} style={{ top: `${line * 33.33}%` }} />)}
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9b9ca" stopOpacity=".42" /><stop offset="1" stopColor="#b9b9ca" stopOpacity=".03" /></linearGradient></defs>
          <path d={areaPath} fill="url(#visitsFill)" />
          <path d={visitsPath} fill="none" stroke="#b9b9ca" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d={messagesPath} fill="none" stroke="#e8dccb" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {activePoint && (
            <>
              <line x1={markerX} x2={markerX} y1="0" y2={height} stroke="rgba(255,255,255,.22)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              <circle cx={markerX} cy={visitY} r="4" fill="#fff" stroke="#b9b9ca" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <circle cx={markerX} cy={msgY} r="4" fill="#e8dccb" stroke="#29272a" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>
        <div className="store-stats__bars">
          {points.map((point) => (
            <div
              key={point.fecha}
              className="store-stats__bar"
              style={{ height: `${Math.max(8, (point.messages / Math.max(...points.map((p) => p.messages), 1)) * 58)}%` }}
              title={`${point.messages} mensajes recibidos`}
            />
          ))}
        </div>
        <div className="store-stats__hit-targets">
          {points.map((point, index) => (
            <button
              key={point.fecha}
              type="button"
              aria-label={`${point.fecha}: ${point.visits} visitas, ${point.messages} mensajes`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') setActiveIndex(Math.min(points.length - 1, index + 1))
                if (event.key === 'ArrowLeft') setActiveIndex(Math.max(0, index - 1))
              }}
            />
          ))}
        </div>
        {activePoint && (
          <div className="store-stats__tooltip" style={{ left: `${activeX}%`, top: `${activeY}%` }} role="status">
            <strong>{activeDate}</strong>
            <span><i className="tooltip-visits" />Visitas <b>{activePoint.visits}</b></span>
            <span><i className="tooltip-messages" />Mensajes <b>{activePoint.messages}</b></span>
          </div>
        )}
      </div>
      <div className="store-stats__dates">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  )
}

export default function StoreStatsPage() {
  const [searchParams] = useSearchParams()
  const [period, setPeriod] = useState<StoreStatsPeriod>('30_DIAS')
  const [showTable, setShowTable] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [liveVisitors, setLiveVisitors] = useState(12)

  // RF-79: soporte para tienda con o sin meta semanal definida (?meta=sin-meta o sessionStorage sr_store_no_goal)
  const noGoalScenario =
    searchParams.get('meta') === 'sin-meta' ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sr_store_no_goal') === '1')
  const weeklyVisits = 445
  const weeklyGoal: number | null = noGoalScenario ? null : 500
  const weeklyProgress = weeklyGoal && weeklyGoal > 0 ? Math.min(100, Math.round((weeklyVisits / weeklyGoal) * 100)) : null

  const points = useMemo(() => buildPeriodSeries(period), [period])

  const kpiData = useMemo(() => {
    const modoCero = searchParams.get('escenario')
    if (modoCero === 'ambos-cero') {
      return { visitas: { actual: 0, anterior: 0 }, mensajes: { actual: 0, anterior: 0 } }
    }
    if (modoCero === 'anterior-cero') {
      return { visitas: { actual: 486, anterior: 0 }, mensajes: { actual: 38, anterior: 0 } }
    }
    if (modoCero === 'actual-cero') {
      return { visitas: { actual: 0, anterior: 424 }, mensajes: { actual: 0, anterior: 35 } }
    }
    if (period === '7_DIAS') {
      return { visitas: { actual: 486, anterior: 424 }, mensajes: { actual: 38, anterior: 36 } }
    }
    if (period === '30_DIAS') {
      return { visitas: { actual: 2145, anterior: 1872 }, mensajes: { actual: 165, anterior: 155 } }
    }
    return { visitas: { actual: 6418, anterior: 5590 }, mensajes: { actual: 492, anterior: 462 } }
  }, [period, searchParams])

  // RF-81: prendasDisponibles, prendasUltimasUnidades y prendasAgotadas con porcentaje a 2 decimales (0.0 si no hay prendas)
  const inventoryStats = useMemo(() => {
    const sinPrendas = searchParams.get('inventario') === 'vacio'
    const disp = sinPrendas ? 0 : 10
    const ult = sinPrendas ? 0 : 2
    const agot = sinPrendas ? 0 : 1
    const total = disp + ult + agot
    const calcPct = (n: number) => (total > 0 ? Number(((n / total) * 100).toFixed(2)) : 0.0)
    return {
      total,
      prendasDisponibles: { cantidad: disp, porcentaje: calcPct(disp) },
      prendasUltimasUnidades: { cantidad: ult, porcentaje: calcPct(ult) },
      prendasAgotadas: { cantidad: agot, porcentaje: calcPct(agot) },
    }
  }, [searchParams])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setLiveVisitors((count) => Math.max(0, count + (Math.random() > 0.5 ? 1 : -1)))
    }, 15000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!helpOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHelpOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [helpOpen])

  const exportCsv = () => {
    const rows = [
      ['Fecha', 'Visitas por día', 'Mensajes recibidos por día'],
      ...points.map((point) => [point.fecha, String(point.visits), String(point.messages)]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `styleradar-estadisticas-${period}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="store-stats">
      <StoreSuspendedBanner />
      <section className="store-stats__content" id="estadisticas">
        <header className="store-stats__heading">
          <div>
            <p className="store-stats__eyebrow">LUNA STORE · MÉTRICAS PRIVADAS</p>
            <h1>Estadísticas de tu tienda</h1>
            <p>Consulta las métricas clave de Luna Store · Solo tú y StyleRadar ven estos datos</p>
          </div>
          <div className="store-stats__tools">
            <div className="store-stats__period" role="group" aria-label="Periodo de estadísticas">
              {(['7_DIAS', '30_DIAS', '90_DIAS'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value)}
                >
                  {periodLabels[value]}
                </button>
              ))}
            </div>
            <button type="button" className="store-stats__export" onClick={exportCsv}>
              ↓ <span>Exportar a Excel</span>
            </button>
          </div>
        </header>

        {/* RF-76.1 y RF-76.2: Visitas y Mensajes */}
        <div className="store-stats__kpis">
          <article>
            <p>Visitas a la página de la tienda</p>
            <strong>{kpiData.visitas.actual.toLocaleString('es-CO')}</strong>
            <span>{formatStoreKpiVariation(kpiData.visitas.actual, kpiData.visitas.anterior, 'visitas')}</span>
          </article>
          <article>
            <p>Mensajes recibidos</p>
            <strong>{kpiData.mensajes.actual.toLocaleString('es-CO')}</strong>
            <span>{formatStoreKpiVariation(kpiData.mensajes.actual, kpiData.mensajes.anterior, 'mensajes')}</span>
          </article>
        </div>

        {/* RF-77.1 y RF-77.3: Visitas por día y Mensajes por día */}
        <section className="store-stats__panel store-stats__activity">
          <div className="store-stats__panel-head">
            <div>
              <h2>Actividad diaria consolidada</h2>
              <p>Visitas a tu catálogo y mensajes recibidos por día ({periodLabels[period]})</p>
            </div>
            <button className="store-stats__table-toggle" type="button" onClick={() => setShowTable((value) => !value)}>
              <span aria-hidden="true">☷</span>{showTable ? 'Ver gráfico' : 'Ver como tabla'}
            </button>
          </div>
          <ActivityChart points={points} period={period} table={showTable} />
        </section>

        {/* RF-78 y RF-79 */}
        <div className="store-stats__live-grid">
          <section className="store-stats__panel store-stats__live-card">
            <div className="store-stats__live-head">
              <h2>Viendo tu tienda ahora</h2>
              <span><i /> En vivo</span>
            </div>
            <p>Personas que están navegando tu catálogo en este momento</p>
            <strong className="store-stats__live-count" aria-live="polite">{liveVisitors}</strong>
            <small>ACTUALIZADO CADA 15 S · SE PAUSA CUANDO LA PESTAÑA ESTÁ EN SEGUNDO PLANO</small>
          </section>

          <section className="store-stats__panel store-stats__goal-card">
            <div>
              <h2>Meta semanal de visitas</h2>
              {weeklyGoal !== null && weeklyProgress !== null ? (
                <p>{weeklyVisits} de {weeklyGoal} visitas alcanzadas</p>
              ) : (
                <>
                  <p role="status">{STORE_NO_WEEKLY_GOAL_MSG}</p>
                  <p className="mt-2 text-lg font-extrabold">{weeklyVisits.toLocaleString('es-CO')} visitas acumuladas</p>
                </>
              )}
            </div>
            {weeklyGoal !== null && weeklyProgress !== null && (
              <div className="store-stats__gauge" role="img" aria-label={`${weeklyProgress}% de la meta semanal de visitas lograda`}>
                <svg viewBox="0 0 180 150" aria-hidden="true">
                  <g>
                    {Array.from({ length: 50 }, (_, index) => {
                      const angle = -135 + (index / 49) * 270
                      const active = index / 50 < weeklyProgress / 100
                      return <line key={index} x1="90" y1="15" x2="90" y2="29" transform={`rotate(${angle} 90 90)`} stroke={active ? '#e8dccb' : 'rgba(185,185,202,.28)'} strokeWidth="4" />
                    })}
                  </g>
                </svg>
                <div className="store-stats__gauge-center">
                  <strong>{weeklyProgress}%</strong>
                  <span>Meta de visitas<br />semanal lograda</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RF-81: Inventario por estado (sin ranking de prendas guardadas RF-80) */}
        <div className="store-stats__lower">
          <section className="store-stats__panel">
            <div className="store-stats__panel-head">
              <div>
                <h2>Inventario por estado</h2>
                <p>Disponibilidad actual de tu catálogo sobre el total de prendas publicadas</p>
              </div>
            </div>
            <InventoryRow
              label="Publicadas y disponibles"
              count={inventoryStats.prendasDisponibles.cantidad}
              percent={inventoryStats.prendasDisponibles.porcentaje}
              total={inventoryStats.total}
              color="published"
            />
            <InventoryRow
              label="Últimas unidades (≤ 3)"
              count={inventoryStats.prendasUltimasUnidades.cantidad}
              percent={inventoryStats.prendasUltimasUnidades.porcentaje}
              total={inventoryStats.total}
              color="low"
            />
            <InventoryRow
              label="Agotadas"
              count={inventoryStats.prendasAgotadas.cantidad}
              percent={inventoryStats.prendasAgotadas.porcentaje}
              total={inventoryStats.total}
              color="sold"
            />
          </section>
        </div>

        <footer className="store-stats__footer">
          <span>© 2026 STYLERADAR</span>
          <button type="button" className="store-stats__footer-help" onClick={() => setHelpOpen(true)}>
            Ayuda y preguntas frecuentes
          </button>
          <Link to="/mi-tienda">Volver al inicio ↑</Link>
        </footer>
      </section>

      {helpOpen && (
        <div
          className="store-stats__help-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false)
          }}
        >
          <section className="store-stats__help-modal" role="dialog" aria-modal="true" aria-labelledby="store-help-title">
            <header>
              <div>
                <p>PREGUNTAS FRECUENTES</p>
                <h2 id="store-help-title">Ayuda</h2>
              </div>
              <button type="button" aria-label="Cerrar ayuda" onClick={() => setHelpOpen(false)}>×</button>
            </header>
            <div className="store-stats__help-content">
              <article>
                <h3>▾ ¿Cómo agrego una prenda?</h3>
                <p>En Mi tienda toca «Agregar prenda». Son tres pasos: fotos, datos y tallas. StyleRadar la revisa antes de publicarla</p>
              </article>
              <article>
                <h3>▾ ¿Cómo marco las últimas unidades?</h3>
                <p>En cada prenda de tu catálogo abre «Editar» y activa «Últimas unidades» o «Nueva llegada»</p>
              </article>
              <article>
                <h3>▾ ¿Qué incluye la suscripción?</h3>
                <p>Tu catálogo visible en el radar, estadísticas y colecciones. Puedes cancelar la renovación cuando quieras desde Mi cuenta</p>
              </article>
              <p className="store-stats__help-contact">
                ¿Necesitas algo más? Escríbenos a <a href="mailto:soporte@styleradar.co">soporte@styleradar.co</a> · respondemos en menos de 24 h
              </p>
            </div>
            <footer>
              <button type="button" onClick={() => setHelpOpen(false)}>Entendido</button>
            </footer>
          </section>
        </div>
      )}
    </main>
  )
}

function InventoryRow({
  label,
  count,
  percent,
  total,
  color,
}: {
  label: string
  count: number
  percent: number
  total: number
  color: string
}) {
  const formattedPct = total > 0 ? percent.toFixed(2) : '0.0'
  return (
    <div className="store-stats__inventory-row">
      <div>
        <span>{label}</span>
        <strong>{count} ({formattedPct}%)</strong>
      </div>
      <div className="store-stats__track">
        <i className={`is-${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
