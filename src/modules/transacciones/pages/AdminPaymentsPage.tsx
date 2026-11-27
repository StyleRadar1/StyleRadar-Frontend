import { useCallback, useMemo, useState } from 'react'
import { env } from '@/configs/env'
import { Card, Badge } from '@/modules/core/design-system'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { Aviso } from '@/modules/core/components/errores'
import { errorKind } from '@/modules/core/api/errors'
import { TEXTOS_PAGOS } from '../utils/erroresPagos'
import { formatCOP } from '@/modules/core/utils/format'
import { formatDateLongSpanish, formatDateNumeric } from '@/modules/soporte/utils/statsFormat'
import { GlassChipGroup, type GlassChipOption } from '@/modules/administracion/components/GlassChipGroup'
import { GlassDateRange } from '@/modules/administracion/components/GlassDateRange'
import { usePayments } from '../hooks/usePayments'
import { BalanceWallet } from '../components/BalanceWallet'
import { buildPaymentsCsv, formatStatusLabel } from '../mappers/paymentsMappers'
import { calcRevenue, filterPayments, paymentService } from '../services/paymentService'
import { usePaymentSubscribers } from '../utils/paymentSubscribers'
import type { PaymentDto, PaymentFiltersDto, PaymentStatus } from '../types/payment.dto'
import '@/styles/verdelo-dashboard.css'

const STATUS_TONES: Record<PaymentStatus, 'violeta' | 'arena' | 'lavanda'> = {
  aprobado: 'violeta',
  rechazado: 'arena',
  pendiente: 'lavanda',
}

const COMPACT_BADGE_TONES: Record<'violeta' | 'arena' | 'lavanda', string> = {
  violeta: 'bg-violeta text-blanco',
  arena: 'bg-arena text-grafito',
  lavanda: 'bg-lavanda text-grafito',
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  aprobado: 'APROBADO',
  rechazado: 'RECHAZADO',
  pendiente: 'PENDIENTE',
}

const STATUS_OPTIONS: GlassChipOption[] = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente', dotClassName: 'bg-lavanda' },
  { value: 'aprobado', label: 'Aprobado', dotClassName: 'bg-violeta-claro' },
  { value: 'rechazado', label: 'Rechazado', dotClassName: 'bg-arena' },
]

interface RadarCardItem {
  id: string
  planKey: 'plus' | 'store' | 'all'
  title: string
  subtitle: string
  holder: string
  channelCode: string
  gateway: string
  currency: string
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
    channelCode: 'MP-B2C-01',
    gateway: 'Mercado Pago',
    currency: 'COP',
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
    channelCode: 'MP-B2B-02',
    gateway: 'Mercado Pago',
    currency: 'COP',
    gradient: 'linear-gradient(135deg, rgba(58, 48, 42, 0.96) 0%, rgba(142, 118, 92, 0.88) 52%, rgba(38, 34, 44, 0.98) 100%)',
    accent: '#B9B9CA',
    fallbackAmount: 1780000,
    targetAmount: 2200000,
  },
  {
    id: 'card-gateway',
    planKey: 'all',
    title: 'Pasarela Consolidada',
    subtitle: 'MERCADO PAGO · PASARELA OFICIAL',
    holder: 'TESORERÍA STYLERADAR',
    channelCode: 'MP-TOTAL-03',
    gateway: 'Mercado Pago',
    currency: 'COP',
    gradient: 'linear-gradient(135deg, rgba(45, 39, 66, 0.97) 0%, rgba(92, 74, 138, 0.9) 55%, rgba(28, 25, 38, 0.98) 100%)',
    accent: '#E8DCCB',
    fallbackAmount: 2227000,
    targetAmount: 3000000,
  },
]


const NO_FILTERS: PaymentFiltersDto = {}

export default function AdminPaymentsPage() {
  const [filters, setFilters] = useState<PaymentFiltersDto>({})
  const { data: allPayments, loading, error, reload } = usePayments(NO_FILTERS)
  const { getSubscriber, getSearchText } = usePaymentSubscribers(allPayments)

  const planOptions = useMemo<GlassChipOption[]>(() => {
    const map = new Map<string, string>()
    for (const p of allPayments) {
      if (p.planId && !map.has(p.planId)) {
        map.set(p.planId, p.planName && p.planName !== '—' ? p.planName : p.planId)
      }
    }
    return [
      { value: '', label: 'Todos' },
      ...Array.from(map.entries()).map(([value, label]) => ({ value, label })),
    ]
  }, [allPayments])

  const payments = useMemo(() => {
    const base = filterPayments(allPayments, { ...filters, search: undefined })
    const q = filters.search?.trim().toLowerCase()
    if (!q) return base
    return base.filter((p) => {
      const refText = `${p.pagoId ?? p.id} ${p.suscripcionId ?? ''} ${p.referencia ?? p.mpReference ?? ''} ${p.planName ?? ''}`.toLowerCase()
      return refText.includes(q) || getSearchText(p).toLowerCase().includes(q)
    })
  }, [allPayments, filters, getSearchText])

  const [selected, setSelected] = useState<PaymentDto | null>(null)
  /** Aviso de la página: 403 u otro error de permisos. */
  const [avisoPagos] = useState<{ permiso: boolean; texto?: string } | null>(null)

  // Estado de las tarjetas 3D apiladas estilo Verdelo
  const [activeCardIdx, setActiveCardIdx] = useState(0)
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)

  const revenue = useMemo(() => calcRevenue(allPayments), [allPayments])

  const statsSummary = useMemo(() => {
    const approved = allPayments.filter((p) => p.status === 'aprobado')
    const rejected = allPayments.filter((p) => p.status === 'rechazado')
    const pending = allPayments.filter((p) => p.status === 'pendiente')
    const pendingSum = pending.reduce((acc, p) => acc + p.amount, 0)
    const plusSum = approved.filter((p) => p.planId === 'plus').reduce((acc, p) => acc + p.amount, 0)
    const storeSum = approved.filter((p) => p.planId === 'store').reduce((acc, p) => acc + p.amount, 0)
    return {
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      pendingCount: pending.length,
      pendingSum,
      plusSum,
      storeSum,
    }
  }, [allPayments])

  const handleFilter = useCallback((key: keyof PaymentFiltersDto, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  }, [])

  const handleSelectPayment = useCallback((payment: PaymentDto) => {
    setSelected(payment)
    if (!env.useMocksPagos) {
      const id = payment.pagoId ?? payment.id
      if (id) {
        void paymentService.getById(id).then((detail) => setSelected(detail)).catch(() => { /* conserva fila */ })
      }
    }
  }, [])

  const handleExportCsv = useCallback(() => {
    const csv = buildPaymentsCsv(payments)
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagos-styleradar-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [payments])


  const cycleCard = (dir: 1 | -1) => {
    setFlippedCardId(null)
    setActiveCardIdx((prev) => (prev + dir + RADAR_CARDS.length) % RADAR_CARDS.length)
  }

  const activeCard = RADAR_CARDS[activeCardIdx]
  const getCardAmount = (card: RadarCardItem) => {
    if (card.planKey === 'plus') {
      return statsSummary.plusSum > 0 || !env.useMocksPagos ? statsSummary.plusSum : card.fallbackAmount
    }
    if (card.planKey === 'store') {
      return statsSummary.storeSum > 0 || !env.useMocksPagos ? statsSummary.storeSum : card.fallbackAmount
    }
    if (card.planKey === 'all') {
      return revenue > 0 || !env.useMocksPagos ? revenue : card.fallbackAmount
    }
    return env.useMocksPagos ? card.fallbackAmount : 0
  }

  const activeAmount = getCardAmount(activeCard)
  const activeProgress =
    activeAmount > 0 ? Math.min(100, Math.max(12, Math.round((activeAmount / activeCard.targetAmount) * 100))) : 0
  const displayBalance = revenue
  const pendingLabel = `${statsSummary.pendingCount} ${statsSummary.pendingCount === 1 ? 'pago' : 'pagos'}`


  return (
    <section className="sr-verdelo-page mx-auto max-w-6xl px-2 py-4 md:px-4 md:py-6">
      {/* Encabezado principal */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-lavanda">
            Resumen financiero · StyleRadar Bogotá
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">Pagos</h1>
          <p className="mt-1 text-sm text-white/70">Estado de los pagos de suscripciones de almacenes y compradores</p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={payments.length === 0}
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blanco transition hover:bg-white/20 disabled:opacity-40"
        >
          Exportar CSV
        </button>
      </div>

      {/* ─── Hero Grid inspirado en Verdelo (Tarjetas 3D + Balance Conjunto + Flujo de Caja) ─── */}
      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        {/* Columna izquierda: Tarjetas apiladas 3D interactivas */}
        <div className="sr-verdelo-panel sr-verdelo-panel--glow flex flex-col justify-between rounded-3xl p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-blanco">Recaudos y metas</h2>
              <p className="mt-0.5 text-xs text-lavanda/80">
                Consulta el recaudo por canal y el avance de la meta mensual.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Recaudo anterior"
                onClick={() => cycleCard(-1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-sm text-white/80 transition hover:border-arena/50 hover:bg-white/10 hover:text-blanco"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Siguiente recaudo"
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
                          <span className="inline-block rounded-full border border-white/20 bg-black/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[.14em] text-arena">
                            {card.subtitle}
                          </span>
                          <p className="mt-1.5 text-base font-extrabold tracking-tight">{card.title}</p>
                        </div>
                        <span className="text-xs font-extrabold tracking-[.15em] text-white/80">
                          StyleRadar<sup className="text-[9px]">®</sup>
                        </span>
                      </div>

                      <div className="my-auto flex items-center justify-between pt-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/65">
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
                            {card.channelCode} · {card.currency}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.14em] text-white/65">
                            {card.holder}
                          </p>
                        </div>
                        <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-arena">
                          Girar ↻
                        </span>
                      </div>
                    </div>

                    {/* Reverso de la tarjeta */}
                    <div className="sr-vcard-face sr-vcard-face--back flex flex-col justify-between p-5 text-blanco">
                      <div className=" -mx-5 mt-1 h-9 bg-black/80" aria-hidden="true" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs">
                          <span className="tracking-widest text-arena">{card.gateway}</span>
                          <span className="rounded bg-violeta px-2 py-0.5 text-[10px] font-bold">{card.currency}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-lavanda">
                          <span>Canal: <b className="text-blanco">{card.channelCode}</b></span>
                          <span> Meta mensual: <b className="text-arena">{formatCOP(card.targetAmount)}</b></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-white/60">
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
              <span className="text-[11px] text-white/55">
                {activeProgress}% de la meta del canal
              </span>
            </div>
          </div>
        </div>

        {/* Balance consolidado: único resumen de ingresos */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          <div className="sr-verdelo-panel flex h-full flex-col rounded-3xl p-6">
            <div>
              <h2 className="text-lg font-bold text-blanco">Balance consolidado</h2>
              <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight text-blanco md:text-4xl">
                {formatCOP(displayBalance)}
              </p>
              <p className="mt-2 text-xs text-lavanda/75">
                Total global de pagos aprobados. Los filtros solo afectan la tabla.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                {
                  label: 'Aprobados',
                  val: `${statsSummary.approvedCount} ${statsSummary.approvedCount === 1 ? 'pago' : 'pagos'}`,
                  delta: 'Global',
                  up: true,
                },
                { label: 'Pendientes', val: formatCOP(statsSummary.pendingSum), delta: pendingLabel, up: false },
                {
                  label: 'Rechazados',
                  val: `${statsSummary.rejectedCount}`,
                  delta: statsSummary.rejectedCount === 1 ? 'intento' : 'intentos',
                  up: false,
                },
              ].map((pill) => (
                <div
                  key={pill.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-lavanda">
                    <span>{pill.label}</span>
                    <span className={pill.up ? 'font-bold text-[#9be3b4]' : 'font-bold text-arena'}>
                      {pill.delta}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-blanco">{pill.val}</p>
                </div>
              ))}
            </div>
            <BalanceWallet total={displayBalance} plusSum={statsSummary.plusSum} storeSum={statsSummary.storeSum} />

            <div className="mt-auto border-t border-white/10 pt-4 text-xs text-lavanda/70">
              <p>El balance suma únicamente pagos aprobados.</p>
              <p className="mt-1">Los filtros no modifican este valor global.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros en glass: buscador amplio + chips de estado y plan + rango de fechas */}
      <Card className="sr-verdelo-panel mt-6 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            aria-label="Buscar por referencia o suscriptor"
            placeholder="Buscar por referencia o suscriptor"
            value={filters.search ?? ''}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm outline-none placeholder:text-white/45 focus:border-violeta-claro"
            onChange={(e) => handleFilter('search', e.target.value)}
          />
          <GlassDateRange
            from={filters.dateFrom}
            to={filters.dateTo}
            onChange={({ from, to }) => setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[.12em] text-white/55">Estado</span>
            <GlassChipGroup
              label="Filtrar por estado"
              options={STATUS_OPTIONS}
              value={filters.status ?? ''}
              onChange={(val) => handleFilter('status', val)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[.12em] text-white/55">Plan</span>
            <GlassChipGroup
              label="Filtrar por plan"
              options={planOptions}
              value={filters.planId ?? ''}
              onChange={(val) => handleFilter('planId', val)}
            />
          </div>
        </div>
      </Card>

      {avisoPagos && (
        <div className="mt-6">
          {avisoPagos.permiso
            ? <Aviso tono="error" titulo={TEXTOS_PAGOS.sinPermiso.titulo}>{TEXTOS_PAGOS.sinPermiso.texto}</Aviso>
            : <Aviso tono="error" titulo={avisoPagos.texto ?? ''} />}
        </div>
      )}

      {/* Tabla (RF-75: pagoId, suscripcionId, suscriptorId sin correos ni nombres, valor (COP), estado, fecha, referencia) */}
      {loading ? (
        <Loading label="Cargando pagos…" />
      ) : error && errorKind(error) === 'permiso' ? (
        <div className="mt-6"><Aviso tono="error" titulo={TEXTOS_PAGOS.sinPermiso.titulo}>{TEXTOS_PAGOS.sinPermiso.texto}</Aviso></div>
      ) : error ? (
        <div className="mt-6"><ErrorState error={error} onRetry={reload} /></div>
      ) : payments.length === 0 ? (
        <div className="mt-6"><EmptyState title="No hay pagos de suscripciones registrados">Ajusta los filtros o revisa más tarde</EmptyState></div>
      ) : (
        <div className="sr-verdelo-panel mt-6 overflow-x-auto rounded-3xl p-5 lg:overflow-x-visible">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-[.14em] text-arena">
                <th className="w-[38%] px-3 pb-3 text-left lg:w-[34%]">Suscriptor</th>
                <th className="w-[16%] px-3 pb-3 text-left lg:w-[13%]">Plan</th>
                <th className="w-[14%] px-3 pb-3 text-right lg:w-[12%]">Valor (COP)</th>
                <th className="w-[16%] px-3 pb-3 text-center lg:w-[13%]">Estado</th>
                <th className="w-[16%] px-3 pb-3 text-center lg:w-[12%]">Fecha</th>
                <th className="hidden px-3 pb-3 text-left lg:table-cell lg:w-[16%]">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const pagoId = p.pagoId ?? p.id
                const sub = getSubscriber(p)
                const valor = p.valor ?? p.amount
                const rawDate = p.fecha ?? p.date
                const fechaCorta = formatDateNumeric(rawDate)
                const fechaLarga = formatDateLongSpanish(rawDate)
                const referencia = p.referencia ?? p.mpReference ?? pagoId
                const subTitle = sub.kind === 'resolved'
                  ? (sub.email ? `${sub.typeLabel} · ${sub.email}` : sub.typeLabel)
                  : undefined
                return (
                  <tr
                    key={pagoId}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.06]"
                    onClick={() => handleSelectPayment(p)}
                  >
                    <td className="px-3 py-3.5 text-left">
                      {sub.kind === 'loading' ? (
                        <span className="text-xs text-white/50">Cargando…</span>
                      ) : sub.kind === 'resolved' ? (
                        <span className="block min-w-0">
                          <b className="block truncate text-sm text-blanco" title={sub.name}>{sub.name}</b>
                          <span className="block truncate text-xs text-white/55" title={subTitle}>
                            {subTitle}
                          </span>
                        </span>
                      ) : (
                        <span className="block truncate text-sm text-white/55" title="No se pudo cargar el nombre">
                          {sub.label}
                        </span>
                      )}
                    </td>
                    <td className="truncate px-3 py-3.5 text-left text-white/85" title={p.planName || '—'}>{p.planName || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono font-bold text-arena">
                      {formatCOP(valor)}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] ${COMPACT_BADGE_TONES[STATUS_TONES[p.status]]}`}>
                        {formatStatusLabel(p.estado ?? STATUS_LABELS[p.status], p.unknownStatus)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-center tabular-nums text-white/75" title={fechaLarga} aria-label={fechaLarga}>
                      {fechaCorta}
                    </td>
                    <td className="hidden truncate px-3 py-3.5 text-left font-mono text-[11px] text-white/55 lg:table-cell" title={referencia}>
                      {referencia}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle del pago (panel lateral) */}
      {selected && (() => {
        const selectedSub = getSubscriber(selected)
        return (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <div className="sr-verdelo-panel h-full w-full max-w-md overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold">Pago {selected.pagoId ?? selected.id}</h2>
                <button type="button" aria-label="Cerrar detalle" className="text-2xl text-white/50 hover:text-white" onClick={() => setSelected(null)}>×</button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONES[selected.status]}>{formatStatusLabel(selected.estado ?? STATUS_LABELS[selected.status], selected.unknownStatus)}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-white/50">Referencia de pago</dt><dd className="font-mono text-xs text-white/70">{selected.pagoId ?? selected.id}</dd></div>
                <div><dt className="text-white/50">ID de suscripción</dt><dd className="font-mono text-xs text-white/70">{selected.suscripcionId ?? `SUB-${selected.id}`}</dd></div>
                <div className="col-span-2">
                  <dt className="text-white/50">Suscriptor</dt>
                  <dd>
                    {selectedSub.kind === 'loading' ? (
                      <span className="text-xs text-white/50">Cargando…</span>
                    ) : selectedSub.kind === 'resolved' ? (
                      <span>
                        <b className="block text-blanco">{selectedSub.name}</b>
                        <span className="block text-xs text-white/55">
                          {selectedSub.typeLabel}{selectedSub.email ? ` · ${selectedSub.email}` : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-white/55" title="No se pudo cargar el nombre">{selectedSub.label}</span>
                    )}
                  </dd>
                </div>
                <div><dt className="text-white/50">Plan</dt><dd>{selected.planName || '—'}</dd></div>
                <div><dt className="text-white/50">Valor (COP)</dt><dd className="font-mono font-bold text-arena">{formatCOP(selected.valor ?? selected.amount)}</dd></div>
                <div>
                  <dt className="text-white/50">Fecha</dt>
                  <dd className="tabular-nums" title={formatDateLongSpanish(selected.fecha ?? selected.date)} aria-label={formatDateLongSpanish(selected.fecha ?? selected.date)}>
                    {formatDateNumeric(selected.fecha ?? selected.date)}
                  </dd>
                </div>
                <div><dt className="text-white/50">Referencia</dt><dd className="font-mono text-xs text-white/70">{selected.referencia ?? selected.mpReference ?? selected.id}</dd></div>
              </dl>
            </div>
          </div>
        )
      })()}

    </section>
  )
}
