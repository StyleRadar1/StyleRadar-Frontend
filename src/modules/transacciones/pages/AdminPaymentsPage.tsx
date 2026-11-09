import { useCallback, useMemo, useState } from 'react'
import { Card, Badge, Button } from '@/modules/core/design-system'
import { Loading, ErrorState, EmptyState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { formatCOP } from '@/modules/core/utils/format'
import { usePayments } from '../hooks/usePayments'
import { paymentService, calcRevenue } from '../services/paymentService'
import type { PaymentDto, PaymentFiltersDto, PaymentStatus } from '../types/payment.dto'

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

export default function AdminPaymentsPage() {
  const [filters, setFilters] = useState<PaymentFiltersDto>({})
  const stableFilters = useMemo(() => filters, [filters])
  const { data: payments, loading, error, reload, setData } = usePayments(stableFilters)
  const [selected, setSelected] = useState<PaymentDto | null>(null)
  const [refundTarget, setRefundTarget] = useState<PaymentDto | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  const revenue = useMemo(() => calcRevenue(payments), [payments])

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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pagos</h1>
          <p className="mt-1 text-white/70">Estado de los pagos, reintentos y reembolsos.</p>
        </div>
        <Card className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Ingresos netos</p>
          <p className="mt-1 text-2xl font-extrabold">{formatCOP(revenue)}</p>
          <p className="text-xs text-white/50">Aprobados − reembolsos</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          placeholder="Buscar por usuario o ID…"
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-violeta"
          onChange={(e) => handleFilter('search', e.target.value)}
        />
        <select
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
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
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
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
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
          onChange={(e) => handleFilter('dateFrom', e.target.value)}
          aria-label="Desde"
        />
        <input
          type="date"
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-[.16em] text-arena">
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
                  className="cursor-pointer border-b border-white/5 transition hover:bg-white/5"
                  onClick={() => setSelected(p)}
                >
                  <td className="py-3 pr-4 font-mono text-xs">{p.id}</td>
                  <td className="py-3 pr-4">{p.userName}</td>
                  <td className="py-3 pr-4">{p.planName}</td>
                  <td className="py-3 pr-4 text-right font-mono">{formatCOP(p.amount)}</td>
                  <td className="py-3 pr-4">{p.method}</td>
                  <td className="py-3 pr-4">{p.date}</td>
                  <td className="py-3"><Badge tone={STATUS_TONES[p.status]}>{STATUS_LABELS[p.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle del pago (panel lateral) */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-grafito p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold">Pago {selected.id}</h2>
              <button type="button" className="text-2xl text-white/50 hover:text-white" onClick={() => setSelected(null)}>×</button>
            </div>
            <Badge tone={STATUS_TONES[selected.status]} >{STATUS_LABELS[selected.status]}</Badge>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-white/50">Usuario</dt><dd className="font-semibold">{selected.userName}</dd></div>
              <div><dt className="text-white/50">Correo</dt><dd>{selected.userEmail}</dd></div>
              <div><dt className="text-white/50">Plan</dt><dd>{selected.planName}</dd></div>
              <div><dt className="text-white/50">Monto</dt><dd className="font-mono font-bold">{formatCOP(selected.amount)}</dd></div>
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
