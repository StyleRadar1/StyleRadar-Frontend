import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './StoreStatsPage.css'

type Period = '7' | '30' | '90'
type Point = { visits: number; saves: number; messages: number }

const daily: Point[] = [
  { visits: 38, saves: 3, messages: 2 }, { visits: 42, saves: 2, messages: 1 }, { visits: 44, saves: 3, messages: 2 },
  { visits: 53, saves: 5, messages: 3 }, { visits: 68, saves: 3, messages: 2 }, { visits: 59, saves: 3, messages: 1 },
  { visits: 56, saves: 2, messages: 2 }, { visits: 44, saves: 4, messages: 2 }, { visits: 39, saves: 3, messages: 1 },
  { visits: 48, saves: 4, messages: 3 }, { visits: 71, saves: 5, messages: 2 }, { visits: 76, saves: 7, messages: 2 },
  { visits: 63, saves: 5, messages: 1 }, { visits: 44, saves: 4, messages: 2 }, { visits: 61, saves: 4, messages: 2 },
  { visits: 43, saves: 3, messages: 2 }, { visits: 36, saves: 2, messages: 1 }, { visits: 48, saves: 4, messages: 2 },
  { visits: 39, saves: 2, messages: 1 }, { visits: 78, saves: 6, messages: 3 }, { visits: 59, saves: 5, messages: 2 },
  { visits: 53, saves: 4, messages: 2 }, { visits: 60, saves: 3, messages: 1 }, { visits: 38, saves: 2, messages: 1 },
  { visits: 45, saves: 4, messages: 2 }, { visits: 62, saves: 5, messages: 2 }, { visits: 75, saves: 7, messages: 3 },
  { visits: 59, saves: 4, messages: 2 }, { visits: 64, saves: 4, messages: 1 }, { visits: 51, saves: 4, messages: 2 },
]

const savedProducts = [
  { name: 'Gorra NY lavada', count: 72, image: '/prototipo/assets/img/productos/r1c2-gorra-ny.jpg', kind: 'Accesorios' },
  { name: 'Hoodie gris jaspeado', count: 50, image: '/prototipo/assets/img/productos/hoodie-gris-jaspeado.jpg', kind: 'Chaquetas' },
  { name: 'Conjunto técnico negro', count: 40, image: '/prototipo/assets/img/productos/conjunto-tecnico-negro.jpg', kind: 'Chaquetas' },
  { name: 'Gorra deportiva negra', count: 38, image: '/prototipo/assets/img/productos/gorra-deportiva-negra.jpg', kind: 'Accesorios' },
  { name: 'Audífonos over-ear', count: 32, image: '/prototipo/assets/img/productos/r1c3-audifonos.jpg', kind: 'Accesorios' },
  { name: 'Chaqueta track negra', count: 25, image: '/prototipo/assets/img/productos/r1c3-chaqueta-track.jpg', kind: 'Chaquetas' },
]

const periodLabels: Record<Period, string> = { '7': '7 días', '30': '30 días', '90': '90 días' }
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

function ActivityChart({ points, period, table }: { points: Point[]; period: Period; table: boolean }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const width = 900
  const height = 190
  const max = Math.max(...points.map((point) => point.visits), 1) * 1.15
  const maxSaves = Math.max(...points.map((point) => point.saves), 1) * 2.4
  const visitsPath = smoothPath(points.map((point) => point.visits), width, height, max)
  const savesPath = smoothPath(points.map((point) => point.saves), width, height, maxSaves)
  const areaPath = `${visitsPath} L ${width} ${height} L 0 ${height} Z`

  if (table) return (
    <div className="store-stats__table-wrap"><table className="store-stats__table"><thead><tr><th>Fecha</th><th>Visitas</th><th>Guardadas</th><th>Mensajes</th></tr></thead>
      <tbody>{points.map((point, index) => <tr key={index}><td>{period === '7' ? `Día ${index + 1}` : `${26 + (index % 5)} ago`}</td><td>{point.visits}</td><td>{point.saves}</td><td>{point.messages}</td></tr>)}</tbody>
    </table></div>
  )

  const labels = period === '7' ? ['4 nov', '5 nov', '6 nov', '7 nov', '8 nov', '9 nov', '10 nov'] : period === '30' ? ['26 ago', '30 ago', '3 sep', '7 sep', '11 sep', '15 sep', '19 sep', '23 sep'] : ['jun', 'jul', 'ago', 'sep', 'oct', 'nov']
  const activePoint = activeIndex === null ? null : points[activeIndex]
  const activeDate = activeIndex === null ? '' : period === '30'
    ? new Date(2026, 7, 26 + activeIndex).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
    : period === '7'
      ? new Date(2026, 10, 4 + activeIndex).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
      : new Date(2026, 5, 1 + activeIndex).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
  const activeX = activeIndex === null ? 0 : Math.max(7, Math.min(93, (activeIndex / Math.max(points.length - 1, 1)) * 100))
  const activeY = activePoint ? Math.max(7, Math.min(62, (1 - activePoint.visits / max) * 100)) : 0
  const markerX = activeIndex === null ? 0 : (activeIndex / Math.max(points.length - 1, 1)) * width
  const visitY = activePoint ? height - (activePoint.visits / max) * (height - 12) - 6 : 0
  const saveY = activePoint ? height - (activePoint.saves / maxSaves) * (height - 12) - 6 : 0
  return <div className="store-stats__chart" role="group" aria-label="Actividad diaria: visitas, prendas guardadas y mensajes recibidos">
    <div className="store-stats__chart-legend"><span><i className="legend-visits" />Visitas</span><span><i className="legend-saves" />Guardadas</span><span><i className="legend-messages" />Mensajes</span></div>
    <div className="store-stats__plot">
      {[0, 1, 2, 3].map((line) => <div className="store-stats__gridline" key={line} style={{ top: `${line * 33.33}%` }} />)}
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b9b9ca" stopOpacity=".42" /><stop offset="1" stopColor="#b9b9ca" stopOpacity=".03" /></linearGradient></defs>
        <path d={areaPath} fill="url(#visitsFill)" />
        <path d={visitsPath} fill="none" stroke="#b9b9ca" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d={savesPath} fill="none" stroke="#e8dccb" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {activePoint && <><line x1={markerX} x2={markerX} y1="0" y2={height} stroke="rgba(255,255,255,.22)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" /><circle cx={markerX} cy={visitY} r="4" fill="#fff" stroke="#b9b9ca" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /><circle cx={markerX} cy={saveY} r="4" fill="#e8dccb" stroke="#29272a" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></>}
      </svg>
      <div className="store-stats__bars">{points.map((point, index) => <div key={index} className="store-stats__bar" style={{ height: `${Math.max(8, (point.saves / Math.max(...points.map((p) => p.saves), 1)) * 58)}%` }} title={`${point.saves} prendas guardadas`} />)}</div>
      <div className="store-stats__hit-targets">{points.map((point, index) => <button key={index} type="button" aria-label={`${new Date(2026, 7, 26 + index).toLocaleDateString('es-CO')}: ${point.visits} visitas, ${point.saves} guardadas, ${point.messages} mensajes`} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onBlur={() => setActiveIndex(null)} onKeyDown={(event) => { if (event.key === 'ArrowRight') setActiveIndex(Math.min(points.length - 1, index + 1)); if (event.key === 'ArrowLeft') setActiveIndex(Math.max(0, index - 1)) }} />)}</div>
      {activePoint && <div className="store-stats__tooltip" style={{ left: `${activeX}%`, top: `${activeY}%` }} role="status"><strong>{activeDate}</strong><span><i className="tooltip-visits" />Visitas <b>{activePoint.visits}</b></span><span><i className="tooltip-saves" />Guardadas <b>{activePoint.saves}</b></span><span><i className="tooltip-messages" />Mensajes <b>{activePoint.messages}</b></span></div>}
    </div>
    <div className="store-stats__dates">{labels.map((label) => <span key={label}>{label}</span>)}</div>
  </div>
}

export default function StoreStatsPage() {
  const [period, setPeriod] = useState<Period>('30')
  const [showTable, setShowTable] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [liveVisitors, setLiveVisitors] = useState(12)
  const weeklyVisits = 445
  const weeklyGoal = 500
  const weeklyProgress = Math.min(100, Math.round((weeklyVisits / weeklyGoal) * 100))
  const points = useMemo(() => {
    if (period === '7') return daily.slice(-7)
    if (period === '30') return daily.map((point, index) => index === 17 ? { visits: 112, saves: 38, messages: 6 } : point)
    return Array.from({ length: 90 }, (_, index) => daily[index % daily.length])
  }, [period])

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
    const rows = [['Fecha', 'Visitas', 'Prendas guardadas', 'Mensajes recibidos'], ...points.map((point, index) => [`Día ${index + 1}`, String(point.visits), String(point.saves), String(point.messages)])]
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `styleradar-estadisticas-${period}dias.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <main className="store-stats">
    <section className="store-stats__content" id="estadisticas">
      <header className="store-stats__heading"><div><p className="store-stats__eyebrow">LUNA STORE · MÉTRICAS PRIVADAS</p><h1>Estadísticas de tu tienda</h1><p>Consulta las métricas clave de Luna Store · Solo tú y StyleRadar ven estos datos.</p></div>
        <div className="store-stats__tools"><div className="store-stats__period" role="group" aria-label="Periodo de estadísticas">{(['7', '30', '90'] as const).map((value) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)}>{periodLabels[value]}</button>)}</div><button type="button" className="store-stats__export" onClick={exportCsv}>↓ <span>Exportar a Excel</span></button></div>
      </header>
      <div className="store-stats__kpis">
        <article><p>Visitas a tu tienda</p><strong>{period === '30' ? '2.145' : period === '7' ? '486' : '6.418'}</strong><span>▲ 14.6% vs. periodo anterior</span></article>
        <article><p>Mensajes recibidos</p><strong>{period === '30' ? '165' : period === '7' ? '38' : '492'}</strong><span>▲ 6.5% vs. periodo anterior</span></article>
        <article><p>Guardadas en wishlist</p><strong>{period === '30' ? '729' : period === '7' ? '164' : '2.187'}</strong><span>▲ 13% vs. periodo anterior</span></article>
      </div>
      <section className="store-stats__panel store-stats__activity"><div className="store-stats__panel-head"><div><h2>Actividad diaria consolidada</h2><p>Visitas a tu catálogo, prendas añadidas a wishlist y mensajes recibidos por día.</p></div><button className="store-stats__table-toggle" type="button" onClick={() => setShowTable((value) => !value)}><span aria-hidden="true">☷</span>{showTable ? 'Ver gráfico' : 'Ver como tabla'}</button></div><ActivityChart points={points} period={period} table={showTable} /></section>
      <div className="store-stats__live-grid">
        <section className="store-stats__panel store-stats__live-card"><div className="store-stats__live-head"><h2>Viendo tu tienda ahora</h2><span><i /> En vivo</span></div><p>Personas que están navegando tu catálogo en este momento.</p><strong className="store-stats__live-count">{liveVisitors}</strong><small>ACTUALIZADO CADA 15 S · SE PAUSA CUANDO LA PESTAÑA ESTÁ EN SEGUNDO PLANO.</small></section>
        <section className="store-stats__panel store-stats__goal-card"><div><h2>Meta semanal de visitas</h2><p>{weeklyVisits} de {weeklyGoal} visitas alcanzadas</p></div><div className="store-stats__gauge" role="img" aria-label={`${weeklyProgress}% de la meta semanal de visitas lograda`}><svg viewBox="0 0 180 150" aria-hidden="true"><g>{Array.from({ length: 50 }, (_, index) => {
          const angle = -135 + (index / 49) * 270
          const active = index / 50 < weeklyProgress / 100
          return <line key={index} x1="90" y1="15" x2="90" y2="29" transform={`rotate(${angle} 90 90)`} stroke={active ? '#e8dccb' : 'rgba(185,185,202,.28)'} strokeWidth="4" />
        })}</g></svg><div className="store-stats__gauge-center"><strong>{weeklyProgress}%</strong><span>Meta de visitas<br />semanal lograda</span></div></div></section>
      </div>
      <div className="store-stats__lower">
        <section className="store-stats__panel"><div className="store-stats__panel-head"><div><h2>Prendas más guardadas</h2><p>Las favoritas de quienes visitan tu tienda.</p></div><span className="store-stats__period-note">{periodLabels[period]}</span></div>
          <div className="store-stats__products">{savedProducts.map((product) => <article key={product.name}><img src={product.image} alt={product.name} /><div className="store-stats__product-name"><strong>{product.name}</strong><small>{product.kind} · Guardada en wishlist</small></div><b>{product.count}</b></article>)}</div>
        </section>
        <section className="store-stats__panel"><div className="store-stats__panel-head"><div><h2>Inventario por estado</h2><p>Disponibilidad actual de tu catálogo.</p></div></div>
          <InventoryRow label="Publicadas y disponibles" count={10} percent={77} color="published" /><InventoryRow label="Últimas unidades (≤ 3)" count={2} percent={15} color="low" /><InventoryRow label="Agotadas" count={1} percent={8} color="sold" />
        </section>
      </div>
      <footer className="store-stats__footer"><span>© 2026 STYLERADAR</span><button type="button" className="store-stats__footer-help" onClick={() => setHelpOpen(true)}>Ayuda y preguntas frecuentes</button><Link to="/mi-tienda">Volver al inicio ↑</Link></footer>
    </section>
    {helpOpen && <div className="store-stats__help-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpOpen(false) }}><section className="store-stats__help-modal" role="dialog" aria-modal="true" aria-labelledby="store-help-title"><header><div><p>PREGUNTAS FRECUENTES</p><h2 id="store-help-title">Ayuda</h2></div><button type="button" aria-label="Cerrar ayuda" onClick={() => setHelpOpen(false)}>×</button></header><div className="store-stats__help-content"><article><h3>▾ ¿Cómo agrego una prenda?</h3><p>En Mi tienda toca «Agregar prenda». Son tres pasos: fotos, datos y tallas. StyleRadar la revisa antes de publicarla.</p></article><article><h3>▾ ¿Cómo marco las últimas unidades?</h3><p>En cada prenda de tu catálogo abre «Editar» y activa «Últimas unidades» o «Nueva llegada».</p></article><article><h3>▾ ¿Qué incluye la suscripción?</h3><p>Tu catálogo visible en el radar, estadísticas y colecciones. Puedes cancelar la renovación cuando quieras desde Mi cuenta.</p></article><p className="store-stats__help-contact">¿Necesitas algo más? Escríbenos a <a href="mailto:soporte@styleradar.co">soporte@styleradar.co</a> · respondemos en menos de 24 h.</p></div><footer><button type="button" onClick={() => setHelpOpen(false)}>Entendido</button></footer></section></div>}
  </main>
}

function InventoryRow({ label, count, percent, color }: { label: string; count: number; percent: number; color: string }) {
  return <div className="store-stats__inventory-row"><div><span>{label}</span><strong>{count} ({percent}%)</strong></div><div className="store-stats__track"><i className={`is-${color}`} style={{ width: `${percent}%` }} /></div></div>
}
