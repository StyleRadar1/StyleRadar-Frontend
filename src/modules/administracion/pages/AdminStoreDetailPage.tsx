import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { formatCOP } from '@/modules/core/utils/format'
import { paymentService } from '@/modules/transacciones/services/paymentService'
import type { PaymentDto } from '@/modules/transacciones/types/payment.dto'
import { AdminCard, AdminHeader, Dl, HBars, StatusBadge, Who } from '../components/AdminUi'
import { adminStoreService } from '../services/adminService'
import { PRECIO_TIENDA, type AdminStoreDto, type Verificacion } from '../types/admin.dto'

type Accion = { verificacion: Verificacion; titulo: string; texto: string; boton: string; danger?: boolean }

/** Admin › Tiendas › detalle: información, verificación, suscripción, catálogo y transacciones. */
export default function AdminStoreDetailPage() {
  const { id = '' } = useParams()
  const loader = useCallback(async () => {
    const t = await adminStoreService.get(id)
    const pagos = await paymentService.list({ search: t.nombre }).catch(() => [] as PaymentDto[])
    return { t, pagos: pagos.filter((p) => p.userName === t.nombre) }
  }, [id])
  const { data, loading, error, reload, setData } = useResource<{ t: AdminStoreDto | null; pagos: PaymentDto[] }>(loader, { t: null, pagos: [] })
  const [accion, setAccion] = useState<Accion | null>(null)
  const [motivo, setMotivo] = useState('')
  const [errMotivo, setErrMotivo] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const t = data.t

  if (loading && !t) return <Loading label="Cargando la tienda…" />
  if (error || !t) return <><AdminHeader kicker="Tiendas · detalle" title="Tienda" back={{ to: '/admin/tiendas', label: 'Volver a tiendas' }} /><ErrorState error={error} onRetry={reload} title="No pudimos cargar la tienda" /></>

  const ejecutar = async (fn: () => Promise<AdminStoreDto>, ok: string) => {
    setBusy(true); setMsg(null)
    try { const n = await fn(); setData((d) => ({ ...d, t: { ...n } })); setMsg({ ok: true, text: ok }); setAccion(null); setMotivo('') }
    catch (e) { setMsg({ ok: false, text: errorMessage(e, 'No pudimos guardar el cambio. Intenta de nuevo.') }); if (accion?.verificacion !== 'Rechazada') setAccion(null) }
    finally { setBusy(false) }
  }
  const confirmar = () => {
    if (!accion) return
    // El motivo se valida aquí para mostrar el error dentro del diálogo
    if (accion.verificacion === 'Rechazada' && motivo.trim().length < 10) { setErrMotivo('Escribe el motivo (mínimo 10 caracteres) para que la tienda sepa qué corregir.'); return }
    ejecutar(() => adminStoreService.setVerification(t.id, accion.verificacion, motivo),
    accion.verificacion === 'Verificada' ? `${t.nombre} quedó verificada y aparece en el radar.` : accion.verificacion === 'Rechazada' ? 'Verificación rechazada. Le enviamos el motivo a la tienda.' : 'Verificación retirada.')
  }

  return (
    <>
      <AdminHeader kicker="Tiendas · detalle" title={t.nombre} back={{ to: '/admin/tiendas', label: 'Volver a tiendas' }} />
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mb-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[#9be3b4]/10 text-[#9be3b4]' : 'bg-[#ff8a8a]/10 text-[#ffb4b4]'}`}>{msg.text}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Información general">
          <div className="mb-4 flex items-start justify-between gap-3"><Who name={t.nombre} sub={`${t.categoria} · ${t.barrio}`} /><StatusBadge value={t.verificacion} /></div>
          <Dl items={[['Dirección', t.direccion || '—'], ['Teléfono', t.telefono || '—'], ['Correo', t.correo], ['NIT', t.nit || '—'], ['Representante', t.representante], ['Aliada desde', t.aliadaDesde]]} />
        </AdminCard>

        <AdminCard title="Verificación">
          <p className="text-sm text-white/75">{t.verificacion === 'Pendiente' ? 'Revisa los documentos antes de aprobar. Al aprobarla, la tienda aparece en el radar.'
            : t.verificacion === 'Verificada' ? 'La tienda fue verificada y aparece en el radar.' : 'La verificación fue rechazada. La tienda puede volver a enviar sus documentos.'}</p>
          {t.motivoRechazo && t.verificacion === 'Rechazada' && <p className="mt-2 text-sm text-[#ffb4b4]">Motivo: {t.motivoRechazo}</p>}
          <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10" aria-label="Documentos">
            {t.documentos.map((d) => (
              <li key={d.nombre} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                <span aria-hidden="true" className={d.recibido ? 'text-[#9be3b4]' : 'text-arena'}>{d.recibido ? '✓' : '⚠'}</span>
                <span className="flex-1">{d.nombre}</span>
                <span className="text-[0.625rem] font-bold uppercase tracking-[.14em] text-white/60">{d.recibido ? 'Recibido' : 'Falta'}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.verificacion !== 'Verificada' ? (
              <>
                {t.verificacion !== 'Rechazada' && <button type="button" onClick={() => setAccion({ verificacion: 'Rechazada', titulo: 'Rechazar verificación', texto: '', boton: 'Rechazar', danger: true })} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-[#ffb4b4]">Rechazar</button>}
                <button type="button" onClick={() => setAccion({ verificacion: 'Verificada', titulo: '¿Aprobar esta tienda?', texto: `${t.nombre} aparecerá en el radar, en el mapa y su catálogo será visible para todas las personas.`, boton: 'Aprobar tienda' })} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold">✓ Aprobar tienda</button>
              </>
            ) : (
              <button type="button" onClick={() => setAccion({ verificacion: 'Pendiente', titulo: '¿Retirar la verificación?', texto: `El catálogo de ${t.nombre} dejará de verse en el radar hasta que se verifique de nuevo.`, boton: 'Retirar verificación', danger: true })} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-[#ffb4b4]">Retirar verificación</button>
            )}
          </div>
        </AdminCard>

        <AdminCard title="Suscripción">
          <Dl items={[['Plan', `Tienda aliada · ${formatCOP(PRECIO_TIENDA)} / mes`], ['Estado', <StatusBadge key="e" value={t.suscripcion.estado} />],
            [t.suscripcion.estado === 'Periodo gratuito' ? 'Periodo gratuito hasta' : 'Próximo cobro', t.suscripcion.proximo], ['Inicio', t.suscripcion.inicio]]} />
          {t.suscripcion.estado === 'Periodo gratuito' && (
            <button type="button" disabled={busy} onClick={() => ejecutar(() => adminStoreService.extendTrial(t.id), 'Periodo gratuito extendido 15 días.')}
              className="mt-4 rounded-xl border border-white/15 bg-white/[.05] px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-60">Extender periodo gratuito 15 días</button>
          )}
        </AdminCard>

        <AdminCard title="Catálogo">
          <HBars unit=" prendas" items={[['Publicadas', t.catalogo.publicadas], ['En revisión', t.catalogo.revision], ['Agotadas', t.catalogo.agotadas], ['Retiradas', t.catalogo.retiradas]]} />
        </AdminCard>

        <AdminCard title="Transacciones" className="lg:col-span-2">
          {!data.pagos.length ? <EmptyState title="Sin transacciones">Aún no hay pagos registrados.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <caption className="sr-only">Pagos de {t.nombre}</caption>
                <thead className="text-[0.6875rem] uppercase tracking-[.12em] text-white/55"><tr><th scope="col" className="py-2">Referencia</th><th scope="col" className="py-2">Fecha</th><th scope="col" className="py-2">Método</th><th scope="col" className="py-2 text-right">Monto</th><th scope="col" className="py-2 text-right">Estado</th></tr></thead>
                <tbody>{data.pagos.map((p) => (
                  <tr key={p.id} className="border-t border-white/10"><td className="py-2">{p.id}</td><td className="py-2">{p.date}</td><td className="py-2">{p.method}</td><td className="py-2 text-right tabular-nums">{formatCOP(p.amount)}</td><td className="py-2 text-right capitalize">{p.status}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>

      <ConfirmDialog open={!!accion} title={accion?.titulo ?? ''} confirmLabel={accion?.boton ?? ''} danger={accion?.danger} busy={busy}
        onConfirm={confirmar} onCancel={() => { setAccion(null); setMotivo(''); setErrMotivo('') }}>
        {accion?.verificacion === 'Rechazada' ? (
          <label className="block text-sm">Motivo (se lo enviaremos a la tienda)
            <textarea value={motivo} onChange={(e) => { setMotivo(e.target.value); setErrMotivo('') }} maxLength={200} rows={3} placeholder="Ej. La cámara de comercio está vencida."
              aria-invalid={!!errMotivo} aria-describedby={errMotivo ? 'motivo-err' : undefined}
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violeta-claro" />
            {errMotivo && <span id="motivo-err" role="alert" className="mt-1 block text-xs text-[#ffb4b4]">{errMotivo}</span>}
          </label>
        ) : accion?.texto}
      </ConfirmDialog>
    </>
  )
}
