import { useCallback, useMemo, useState } from 'react'
import { Card, Badge, Button } from '@/modules/core/design-system'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { formatCOP } from '@/modules/core/utils/format'
import { usePayments } from '../hooks/usePayments'
import { paymentService, calcRevenue } from '../services/paymentService'
import type { PaymentDto, PaymentFiltersDto, PaymentStatus } from '../types/payment.dto'
import '@/styles/verdelo-dashboard.css'

const STATUS_TONES: Record<PaymentStatus, 'violeta' | 'arena' | 'lavanda'> = {
  aprobado: 'violeta',
  rechazado: 'arena',
  pendiente: 'lavanda',
  reembolsado: 'arena',
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  pendiente: 'Pendiente',
  reembolsado: 'Reembolsado',
}

interface RadarCardItem {
  id: string
  planKey: 'plus' | 'store' | 'all'
  title: string
  subtitle: string
  holder: string
  last4: string
  fullNumber: string
  expiry: string
  cvv: string
  gradient: string
  accent: string
  fallbackAmount: number
  targetAmount: number
}

const RADAR_CARDS: RadarCardItem[] = [
  {
    id: 'card-plus',
    planKey: 'plus',
    title: 'Radar+ Membresía',
    subtitle: 'SUSCRIPCIONES DE USUARIOS',
    holder: 'STYLERADAR BOGOTÁ · B2C',
    last4: '4819',
    fullNumber: '5412  7519  3840  4819',
    expiry: '09/28',
    cvv: '842',
    gradient: 'linear-gradient(135deg, rgba(72, 17, 154, 0.96) 0%, rgba(123, 77, 216, 0.88) 55%, rgba(44, 24, 78, 0.96) 100%)',
    accent: '#E8DCCB',
    fallbackAmount: 447000,
    targetAmount: 600000,
  },
  {
    id: 'card-store',
    planKey: 'store',
    title: 'Tienda Aliada Pro',
    subtitle: 'PLANES COMERCIALES B2B',
    holder: 'BOUTIQUES VERIFICADAS',
    last4: '9024',
    fullNumber: '4539  8812  0041  9024',
    expiry: '12/28',
    cvv: '319',
    gradient: 'linear-gradient(135deg, rgba(58, 48, 42, 0.96) 0%, rgba(142, 118, 92, 0.88) 52%, rgba(38, 34, 44, 0.98) 100%)',
    accent: '#B9B9CA',
    fallbackAmount: 1780000,
    targetAmount: 2200000,
  },
  {
    id: 'card-gateway',
    planKey: 'all',
    title: 'Pasarela Consolidada',
    subtitle: 'MERCADO PAGO · PSE · TARJETAS',
    holder: 'TESORERÍA STYLERADAR',
    last4: '1107',
    fullNumber: '4024  0071  9928  1107',
    expiry: '06/29',
    cvv: '605',
    gradient: 'linear-gradient(135deg, rgba(45, 39, 66, 0.97) 0%, rgba(92, 74, 138, 0.9) 55%, rgba(28, 25, 38, 0.98) 100%)',
    accent: '#E8DCCB',
    fallbackAmount: 2227000,
    targetAmount: 3000000,
  },
]

const BALANCE_SERIES = [
  { mes: 'Abr', real: 1120000, proyeccion: null as number | null },
  { mes: 'May', real: 1340000, proyeccion: null as number | null },
  { mes: 'Jun', real: 1290000, proyeccion: null as number | null },
  { mes: 'Jul', real: 1680000, proyeccion: null as number | null },
  { mes: 'Ago', real: 1940000, proyeccion: null as number | null },
  { mes: 'Sep', real: 2227000, proyeccion: 2227000 },
  { mes: 'Oct', real: null as number | null, proyeccion: 2490000 },
  { mes: 'Nov', real: null as number | null, proyeccion: 2780000 },
]

const FLOW_BARS = [
  { mes: 'Abr', entradas: 1240000, reembolsos: 120000 },
  { mes: 'May', entradas: 1490000, reembolsos: 150000 },
  { mes: 'Jun', entradas: 1420000, reembolsos: 130000 },
  { mes: 'Jul', entradas: 1850000, reembolsos: 170000 },
  { mes: 'Ago', entradas: 2120000, reembolsos: 180000 },
  { mes: 'Sep', entradas: 2380000, reembolsos: 153000 },
]

export default function AdminPaymentsPage() {
  const [filters, setFilters] = useState<PaymentFiltersDto>({})
  const stableFilters = useMemo(() => filters, [filters])
  const { data: payments, loading, error, reload, setData } = usePayments(stableFilters)
  const [selected, setSelected] = useState<PaymentDto | null>(null)
  const [refundTarget, setRefundTarget] = useState<PaymentDto | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  // Estado de las tarjetas 3D apiladas estilo Verdelo
  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)
  const [hoverPoint, setHoverPoint] = useState<number | null>(null)

  const revenue = useMemo(() => calcRevenue(payments), [payments])

  const statsSummary = useMemo(() => {
    const approved = payments.filter((p) => p.status === 'aprobado')
    const refunded = payments.filter((p) => p.status === 'reembolsado')
    const pending = payments.filter((p) => p.status === 'pendiente')
    const approvedSum = approved.reduce((acc, p) => acc + p.amount, 0)
    const refundedSum = refunded.reduce((acc, p) => acc + p.amount, 0)
    const plusSum = approved.filter((p) => p.planId === 'plus').reduce((acc, p) => acc + p.amount, 0)
    const storeSum = approved.filter((p) => p.planId === 'store').reduce((acc, p) => acc + p.amount, 0)
    return {
      approvedCount: approved.length,
      refundedCount: refunded.length,
      pendingCount: pending.length,
      approvedSum,
      refundedSum,
      plusSum,
      storeSum,
    }
  }, [payments])

  const handleFilter = useCallback((key: keyof PaymentFiltersDto, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  }, [])

  const handleRefund = useCallback(async () => {
    if (!refundTarget || !refundReason.trim()) return
    setRefunding(true)
    try {
      const updated = await paymentService.refund({ paymentId: refundTarget.id, reason: refundReason.trim() })
      setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setRefundTarget(null)
      setRefundReason('')
      setSelected(null)
    } finally {
      setRefunding(false)
    }
  }, [refundTarget, refundReason, setData])

  const cycleCard = (dir: 1 | -1) => {
    setFlippedCardId(null)
    setActiveCardIdx((prev) => (prev + dir + RADAR_CARDS.length) % RADAR_CARDS.length)
  }

  const activeCard = RADAR_CARDS[activeCardIdx]
  const getCardAmount = (card: RadarCardItem) => {
    if (card.planKey === 'plus' && statsSummary.plusSum > 0) return statsSummary.plusSum
    if (card.planKey === 'store' && statsSummary.storeSum > 0) return statsSummary.storeSum
    if (card.planKey === 'all' && revenue > 0) return revenue
    return card.fallbackAmount
  }

  const activeAmount = getCardAmount(activeCard)
  const activeProgress = Math.min(100, Math.max(12, Math.round((activeAmount / activeCard.targetAmount) * 100)))

  // Coordenadas para la curva suave de balance estilo Verdelo
  const maxBalance = 3000000
  const chartPoints = BALANCE_SERIES.map((item, idx) => {
    const x = (idx / (BALANCE_SERIES.length - 1)) * 640
    const val = item.real ?? item.proyeccion ?? 0
    const y = 148 - (val / maxBalance) * 118
    return { ...item, x, y, val }
  })
  const realPts = chartPoints.filter((p) => p.real !== null)
  const forecastPts = chartPoints.filter((p) => p.proyeccion !== null)
  const realLine = realPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const realArea = `${realLine} L${realPts[realPts.length - 1].x.toFixed(1)},160 L${realPts[0].x.toFixed(1)},160 Z`
  const forecastLine = forecastPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <section className="sr-verdelo-page mx-auto max-w-6xl px-2 py-4 md:px-4 md:py-6">
      {/* Encabezado principal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[.18em] text-lavanda">
            Resumen financiero · StyleRadar Bogotá
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">Pagos</h1>
          <p className="mt-1 text-sm text-white/70">Estado de los pagos, pasarelas activas, reintentos y reembolsos.</p>
        </div>
        <Card className="sr-verdelo-panel text-right">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[.16em] text-arena">Ingresos netos</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatCOP(revenue)}</p>
          <p className="text-xs text-white/55">Aprobados − reembolsos</p>
        </Card>
      </div>

      {/* ─── Hero Grid inspirado en Verdelo (Tarjetas 3D + Balance Conjunto + Flujo de Caja) ─── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        {/* Columna izquierda: Tarjetas apiladas 3D interactivas */}
        <div className="sr-verdelo-panel sr-verdelo-panel--glow flex flex-col justify-between rounded-3xl p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-blanco">Tarjetas y canales</h2>
              <p className="mt-0.5 text-xs text-lavanda/80">
                Cambia de tarjeta con las flechas o tócala para girarla y ver el reverso.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Tarjeta anterior"
                onClick={() => cycleCard(-1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-sm text-white/80 transition hover:border-arena/50 hover:bg-white/10 hover:text-blanco"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Siguiente tarjeta"
                onClick={() => cycleCard(1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-sm text-white/80 transition hover:border-arena/50 hover:bg-white/10 hover:text-blanco"
              >
                ›
              </button>
            </div>
          </div>

          {/* Escenario 3D de tarjetas apiladas */}
          <div className="sr-vcard-stage my-5">
            {RADAR_CARDS.map((card, idx) => {
              const depth = (idx - activeCardIdx + RADAR_CARDS.length) % RADAR_CARDS.length
              const isFront = depth === 0
              const isFlipped = isFront && flippedCardId === card.id
              const cardTotal = getCardAmount(card)

              return (
                <div
                  key={card.id}
                  data-depth={depth}
                  className="sr-vcard-slot"
                  onClick={() => {
                    if (isFront) {
                      setFlippedCardId((prev) => (prev === card.id ? null : card.id))
                    } else {
                      setFlippedCardId(null)
                      setActiveCardIdx(idx)
                    }
                  }}
                >
                  <div className={`sr-vcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
                    {/* Frente de la tarjeta */}
                    <div
                      className="sr-vcard-face flex flex-col justify-between p-5 text-blanco"
                      style={{ background: card.gradient }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block rounded-full border border-white/20 bg-black/25 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-[.14em] text-arena">
                            {card.subtitle}
                          </span>
                          <p className="mt-1.5 text-base font-extrabold tracking-tight">{card.title}</p>
                        </div>
                        <span className="text-xs font-extrabold tracking-[.15em] text-white/80">
                          StyleRadar<sup className="text-[0.5625rem]">®</sup>
                        </span>
                      </div>

                      <div className="my-auto flex items-center justify-between pt-2">
                        <div>
                          <p className="text-[0.625rem] font-semibold uppercase tracking-[.14em] text-white/65">
                            Recaudado activo
                          </p>
                          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-blanco">
                            {formatCOP(cardTotal)}
                          </p>
                        </div>
                        {/* Chip metálico */}
                        <span
                          aria-hidden="true"
                          className="h-8 w-11 rounded-md border border-arena/50 bg-gradient-to-br from-arena/80 via-arena/40 to-transparent opacity-90 shadow-inner"
                        />
                      </div>

                      <div className="flex items-end justify-between border-t border-white/15 pt-2.5 text-xs">
                        <div>
                          <p className="font-mono text-xs tracking-[.18em] text-white/90">
                            •••• •••• •••• {card.last4}
                          </p>
                          <p className="mt-0.5 text-[0.625rem] font-bold uppercase tracking-[.14em] text-white/65">
                            {card.holder}
                          </p>
                        </div>
                        <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[.12em] text-arena">
                          Girar ↻
                        </span>
                      </div>
                    </div>

                    {/* Reverso de la tarjeta */}
                    <div className="sr-vcard-face sr-vcard-face--back flex flex-col justify-between p-5 text-blanco">
                      <div className=" -mx-5 mt-1 h-9 bg-black/80" aria-hidden="true" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs">
                          <span className="tracking-widest text-arena">{card.fullNumber}</span>
                          <span className="rounded bg-violeta px-2 py-0.5 text-[0.625rem] font-bold">CVV {card.cvv}</span>
                        </div>
                        <div className="flex justify-between text-[0.6875rem] text-lavanda">
                          <span>Vence: <b className="text-blanco">{card.expiry}</b></span>
                          <span> Meta mensual: <b className="text-arena">{formatCOP(card.targetAmount)}</b></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[0.6875rem] text-white/60">
                        <span>Pasarela cifrada · TLS 1.3</span>
                        <span className="font-semibold text-arena">Toca para volver ↺</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Barra inferior de progreso de la tarjeta seleccionada */}
          <div className="mt-2 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-lavanda">{activeCard.title}</span>
              <span className="font-mono font-bold text-arena">
                {formatCOP(activeAmount)} <span className="text-white/45">/ {formatCOP(activeCard.targetAmount)}</span>
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violeta via-violeta-claro to-arena transition-all duration-500"
                style={{ width: `${activeProgress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                {RADAR_CARDS.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`Ver ${c.title}`}
                    onClick={() => {
                      setFlippedCardId(null)
                      setActiveCardIdx(i)
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeCardIdx ? 'w-6 bg-arena' : 'w-2 bg-white/25 hover:bg-white/45'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[0.6875rem] text-white/55">
                {activeProgress}% de la meta del canal
              </span>
            </div>
          </div>
        </div>

        {/* Columna derecha: Balance Conjunto (arriba) + Entradas y Reembolsos (abajo) */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* Panel superior: Balance conjunto con curva brillante y proyección */}
          <div className="sr-verdelo-panel rounded-3xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-blanco">Balance consolidado</h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#9be3b4]/35 bg-[#9be3b4]/15 px-2.5 py-0.5 text-[0.6875rem] font-bold text-[#9be3b4]">
                    ▲ 14.8%
                  </span>
                </div>
                <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight text-blanco md:text-4xl">
                  {formatCOP(revenue || 2227000)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-lavanda">
                <span className="flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2 w-2 rounded-full bg-arena shadow-[0_0_8px_#E8DCCB]" />
                  Balance real
                </span>
                <span className="flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-0.5 w-3 border-t-2 border-dashed border-violeta-claro" />
                  Proyección
                </span>
              </div>
            </div>

            {/* Píldoras de resumen por periodo (Hoy / Semana / Mes / Año) */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: 'Hoy', val: formatCOP(Math.round((revenue || 2227000) * 0.08)), delta: '+4.2%', up: true },
                { label: 'Esta semana', val: formatCOP(Math.round((revenue || 2227000) * 0.32)), delta: '+9.1%', up: true },
                { label: 'Este mes', val: formatCOP(revenue || 2227000), delta: '+14.8%', up: true },
                { label: 'Reembolsos', val: formatCOP(statsSummary.refundedSum), delta: `${statsSummary.refundedCount} casos`, up: false },
              ].map((pill) => (
                <div
                  key={pill.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between text-[0.6875rem] text-lavanda">
                    <span>{pill.label}</span>
                    <span className={pill.up ? 'font-bold text-[#9be3b4]' : 'font-bold text-arena'}>
                      {pill.delta}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-blanco">{pill.val}</p>
                </div>
              ))}
            </div>

            {/* Gráfico de área brillante con línea punteada de proyección */}
            <div className="relative mt-5 h-40 w-full">
              <svg viewBox="0 0 640 165" className="h-full w-full overflow-visible" aria-label="Evolución y proyección de ingresos">
                <defs>
                  <linearGradient id="srBalanceArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7B4DD8" stopOpacity="0.48" />
                    <stop offset="55%" stopColor="#48119A" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#48119A" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="srBalanceStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#B9B9CA" />
                    <stop offset="55%" stopColor="#7B4DD8" />
                    <stop offset="100%" stopColor="#E8DCCB" />
                  </linearGradient>
                </defs>
                {/* Líneas guía horizontales */}
                <line x1="0" x2="640" y1="35" y2="35" stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                <line x1="0" x2="640" y1="95" y2="95" stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                <line x1="0" x2="640" y1="155" y2="155" stroke="rgba(255,255,255,0.12)" />

                {/* Área bajo la curva real */}
                <path d={realArea} fill="url(#srBalanceArea)" />
                {/* Línea real brillante */}
                <path
                  d={realLine}
                  fill="none"
                  stroke="url(#srBalanceStroke)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Línea punteada de proyección */}
                <path
                  d={forecastLine}
                  fill="none"
                  stroke="#E8DCCB"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />

                {/* Puntos interactivos */}
                {chartPoints.map((pt, idx) => (
                  <g
                    key={pt.mes}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverPoint(idx)}
                    onMouseLeave={() => setHoverPoint(null)}
                  >
                    <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoverPoint === idx ? 6 : 4}
                      fill={pt.real !== null ? '#E8DCCB' : '#7B4DD8'}
                      stroke="#141218"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip flotante del punto activo */}
              {hoverPoint !== null && (
                <div
                  className="pointer-events-none absolute -top-2 z-10 rounded-xl border border-white/15 bg-[#16131d]/95 px-3 py-1.5 text-xs shadow-xl"
                  style={{
                    left: `${Math.min(82, Math.max(8, (hoverPoint / (chartPoints.length - 1)) * 100))}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <p className="font-bold text-arena">
                    {chartPoints[hoverPoint].mes} · {chartPoints[hoverPoint].real !== null ? 'Real' : 'Proyección'}
                  </p>
                  <p className="font-mono font-extrabold text-blanco">{formatCOP(chartPoints[hoverPoint].val)}</p>
                </div>
              )}

              <div className="mt-1 flex justify-between text-[0.6875rem] font-semibold text-white/50">
                {BALANCE_SERIES.map((b) => (
                  <span key={b.mes}>{b.mes}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Panel inferior: Entradas y reembolsos (barras tipo cápsula como "Money in & out" en Verdelo) */}
          <div className="sr-verdelo-panel rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-blanco">Entradas y reembolsos</h2>
                <p className="text-xs text-lavanda/75">Comparativa mensual de cobros aprobados frente a devoluciones.</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-lavanda">
                <span className="flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-violeta-claro" />
                  Cobros aprobados ({statsSummary.approvedCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-arena" />
                  Reembolsos ({statsSummary.refundedCount})
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-6 gap-3">
              {FLOW_BARS.map((bar) => {
                const inPct = Math.round((bar.entradas / 2500000) * 100)
                const outPct = Math.max(12, Math.round((bar.reembolsos / 600000) * 100))
                return (
                  <div key={bar.mes} className="flex flex-col items-center">
                    <div className="flex h-24 w-full items-end justify-center gap-1.5 rounded-2xl bg-white/[0.03] px-2 py-2">
                      <div className="flex h-full w-3 items-end rounded-full bg-white/[0.06] sm:w-3.5">
                        <span
                          className="w-full rounded-full bg-gradient-to-t from-violeta to-violeta-claro shadow-[0_0_12px_rgba(123,77,216,0.45)]"
                          style={{ height: `${inPct}%` }}
                          title={`Entradas ${bar.mes}: ${formatCOP(bar.entradas)}`}
                        />
                      </div>
                      <div className="flex h-full w-3 items-end rounded-full bg-white/[0.06] sm:w-3.5">
                        <span
                          className="w-full rounded-full bg-gradient-to-t from-arena/60 to-arena"
                          style={{ height: `${outPct}%` }}
                          title={`Reembolsos ${bar.mes}: ${formatCOP(bar.reembolsos)}`}
                        />
                      </div>
                    </div>
                    <span className="mt-1.5 text-[0.6875rem] font-semibold text-white/60">{bar.mes}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="sr-verdelo-panel mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          placeholder="Buscar por usuario o ID…"
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-violeta-claro"
          onChange={(e) => handleFilter('search', e.target.value)}
        />
        <select
          className="rounded-xl border border-white/15 bg-[#1b1824] px-3 py-2 text-sm text-blanco"
          onChange={(e) => handleFilter('status', e.target.value)}
          defaultValue=""
        >
          <option value="">Todos los estados</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
          <option value="pendiente">Pendiente</option>
          <option value="reembolsado">Reembolsado</option>
        </select>
        <select
          className="rounded-xl border border-white/15 bg-[#1b1824] px-3 py-2 text-sm text-blanco"
          onChange={(e) => handleFilter('planId', e.target.value)}
          defaultValue=""
        >
          <option value="">Todos los planes</option>
          <option value="free">Radar</option>
          <option value="plus">Radar+</option>
          <option value="store">Tienda aliada</option>
        </select>
        <input
          type="date"
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
          onChange={(e) => handleFilter('dateFrom', e.target.value)}
          aria-label="Desde"
        />
        <input
          type="date"
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
          onChange={(e) => handleFilter('dateTo', e.target.value)}
          aria-label="Hasta"
        />
      </Card>

      {/* Tabla */}
      {loading ? (
        <Loading label="Cargando pagos…" />
      ) : error ? (
        <div className="mt-6"><ErrorState error={error} onRetry={reload} /></div>
      ) : payments.length === 0 ? (
        <div className="mt-6"><EmptyState title="No hay pagos">Ajusta los filtros o revisa más tarde.</EmptyState></div>
      ) : (
        <div className="sr-verdelo-panel mt-6 overflow-x-auto rounded-3xl p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[0.6875rem] font-bold uppercase tracking-[.16em] text-arena">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Usuario</th>
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4 text-right">Monto</th>
                <th className="pb-3 pr-4">Método</th>
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.06]"
                  onClick={() => setSelected(p)}
                >
                  <td className="py-3.5 pr-4 font-mono text-xs text-lavanda">{p.id}</td>
                  <td className="py-3.5 pr-4 font-semibold text-blanco">{p.userName}</td>
                  <td className="py-3.5 pr-4 text-white/80">{p.planName}</td>
                  <td className="py-3.5 pr-4 text-right font-mono font-bold text-arena">{formatCOP(p.amount)}</td>
                  <td className="py-3.5 pr-4 text-white/75">{p.method}</td>
                  <td className="py-3.5 pr-4 text-white/70">{p.date}</td>
                  <td className="py-3.5"><Badge tone={STATUS_TONES[p.status]}>{STATUS_LABELS[p.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle del pago (panel lateral) */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="sr-verdelo-panel h-full w-full max-w-md overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold">Pago {selected.id}</h2>
              <button type="button" className="text-2xl text-white/50 hover:text-white" onClick={() => setSelected(null)}>×</button>
            </div>
            <Badge tone={STATUS_TONES[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-white/50">Usuario</dt><dd className="font-semibold">{selected.userName}</dd></div>
              <div><dt className="text-white/50">Correo</dt><dd>{selected.userEmail}</dd></div>
              <div><dt className="text-white/50">Plan</dt><dd>{selected.planName}</dd></div>
              <div><dt className="text-white/50">Monto</dt><dd className="font-mono font-bold text-arena">{formatCOP(selected.amount)}</dd></div>
              <div><dt className="text-white/50">Método</dt><dd>{selected.method}</dd></div>
              <div><dt className="text-white/50">Fecha</dt><dd>{selected.date}</dd></div>
              {selected.refundReason && (
                <>
                  <div className="col-span-2"><dt className="text-white/50">Motivo del reembolso</dt><dd className="text-[#ff8a8a]">{selected.refundReason}</dd></div>
                  <div><dt className="text-white/50">Fecha de reembolso</dt><dd>{selected.refundDate}</dd></div>
                </>
              )}
            </dl>
            {selected.status === 'aprobado' && (
              <Button
                variant="secundario"
                className="mt-6 w-full border-[#c0392b] text-[#ff8a8a]"
                onClick={() => { setRefundTarget(selected); setRefundReason('') }}
              >
                Reembolsar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Diálogo de reembolso */}
      <ConfirmDialog
        open={!!refundTarget}
        title="¿Reembolsar este pago?"
        confirmLabel="Confirmar reembolso"
        danger
        busy={refunding}
        onConfirm={handleRefund}
        onCancel={() => setRefundTarget(null)}
      >
        <p className="mb-2">
          Pago <strong>{refundTarget?.id}</strong> por <strong>{refundTarget ? formatCOP(refundTarget.amount) : ''}</strong> a {refundTarget?.userName}.
          El reembolso restará de los ingresos netos.
        </p>
        <label className="block text-sm font-semibold">
          Motivo <span className="text-[#ff8a8a]">*</span>
        </label>
        <textarea
          className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violeta"
          rows={3}
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          placeholder="Describe por qué se reembolsa este pago…"
          required
        />
        {!refundReason.trim() && (
          <p className="mt-1 text-xs text-[#ff8a8a]">El motivo es obligatorio.</p>
        )}
      </ConfirmDialog>
    </section>
  )
}
