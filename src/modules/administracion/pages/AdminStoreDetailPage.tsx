import { useCallback, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { env } from '@/configs/env'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorBanner, ErrorToast, FieldError } from '@/modules/core/components/ErrorFeedback'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { formatCOP } from '@/modules/core/utils/format'
import { paymentService } from '@/modules/transacciones/services/paymentService'
import type { PaymentDto } from '@/modules/transacciones/types/payment.dto'
import { EliminarRegistro } from '../components/EliminarRegistro'
import { AdminCard, AdminHeader, Dl, HBars, StatusBadge, Who } from '../components/AdminUi'
import { adminStoreService, errorDeMotivoRechazo, MOTIVO_RECHAZO_TEXTO } from '../services/adminService'
import { MOTIVO_RECHAZO_MAX, PRECIO_TIENDA, type AdminStoreDto, type StoreAdministratorDto, type Verificacion } from '../types/admin.dto'

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
  const [rutError, setRutError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string; sub?: string } | null>(null)
  const t = data.t

  if (loading && !t) return <Loading label="Cargando la tienda…" />
  if (error || !t) return <><AdminHeader kicker="Tiendas · detalle" title="Tienda" back={{ to: '/admin/tiendas', label: 'Volver a tiendas' }} /><ErrorState error={error} onRetry={reload} title="No pudimos cargar la tienda" /></>

  const ejecutar = async (fn: () => Promise<AdminStoreDto>, ok: string) => {
    setBusy(true); setMsg(null); setRutError(false)
    try { const n = await fn(); setData((d) => ({ ...d, t: { ...n } })); setMsg({ tone: 'ok', text: ok }); setAccion(null); setMotivo(''); setErrMotivo('') }
    catch (e) {
      const kind = errorKind(e)
      const fields = fieldErrors(e)
      if (accion?.verificacion === 'Rechazada' && (fields.reason || fields.motivo || kind === 'datos')) {
        setErrMotivo(fields.reason ?? fields.motivo ?? MOTIVO_RECHAZO_TEXTO)
        window.setTimeout(() => document.getElementById('motivo-rechazo')?.focus(), 0)
      } else if (e instanceof ApiError && e.status === 422 && accion?.verificacion === 'Verificada') {
        setRutError(true)
        setAccion(null)
      } else if (e instanceof ApiError && e.status === 422 && accion?.verificacion === 'Pendiente') {
        // FA-08: ya estaba pendiente; se actualiza para ver el estado real.
        setMsg({ tone: 'warn', text: 'La tienda ya está pendiente de revisión', sub: 'Actualizamos la información.' })
        setAccion(null)
        reload()
      } else if (kind === 'conflicto') {
        setMsg({ tone: 'warn', text: 'Esta tienda ya fue revisada', sub: 'Actualizamos la información.' })
        setAccion(null)
        reload()
      } else {
        setMsg({ tone: 'bad', text: errorMessage(e, 'No pudimos guardar el cambio. Intenta de nuevo.') })
        if (accion?.verificacion !== 'Rechazada') setAccion(null)
      }
    }
    finally { setBusy(false) }
  }
  const confirmar = () => {
    if (!accion) return
    if (accion.verificacion === 'Verificada' && !t.documentos.some((d) => d.nombre.toUpperCase() === 'RUT' && d.recibido)) {
      setRutError(true)
      setAccion(null)
      return
    }
    // El motivo se valida aquí para mostrar el error dentro del diálogo
    const errorMotivo = accion.verificacion === 'Rechazada' ? errorDeMotivoRechazo(motivo) : ''
    if (errorMotivo) {
      setErrMotivo(errorMotivo)
      window.setTimeout(() => document.getElementById('motivo-rechazo')?.focus(), 0)
      return
    }
    ejecutar(() => adminStoreService.setVerification(t.id, accion.verificacion, motivo),
    accion.verificacion === 'Verificada' ? `${t.nombre} quedó verificada y aparece en el radar.` : accion.verificacion === 'Rechazada' ? 'Verificación rechazada. Le enviamos el motivo a la tienda.' : 'Verificación retirada.')
  }

  return (
    <>
      <AdminHeader kicker="Tiendas · detalle" title={t.nombre} back={{ to: '/admin/tiendas', label: 'Volver a tiendas' }} />
      <ErrorToast
        open={!!msg}
        tone={msg?.tone ?? 'ok'}
        icon={msg?.tone === 'warn' ? 'refresh' : msg?.tone === 'ok' ? 'ok' : 'warn'}
        title={msg?.text ?? ''}
        subtitle={msg?.sub}
        onClose={() => setMsg(null)}
      />
      {rutError && (
        <ErrorBanner className="mb-4" tone="warn" icon="warn" title="Falta el RUT para aprobar">
          Verifica que la tienda haya cargado su documento RUT antes de aprobar la verificación.
        </ErrorBanner>
      )}

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
                {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline underline-offset-4">Abrir {d.nombre}<span className="sr-only"> (se abre en otra pestaña)</span></a>}
                <span className="text-[10px] font-bold uppercase tracking-[.14em] text-white/60">{d.recibido ? 'Recibido' : 'Falta'}</span>
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

        <AdministradoresCard nit={t.id} />

        <AdminCard title="Suscripción">
          <Dl items={[['Plan', `Tienda aliada · ${formatCOP(PRECIO_TIENDA)} / mes`], ['Estado', <StatusBadge key="e" value={t.suscripcion.estado} />],
            [t.suscripcion.estado === 'Periodo gratuito' ? 'Periodo gratuito hasta' : 'Próximo cobro', t.suscripcion.proximo], ['Inicio', t.suscripcion.inicio]]} />
          {/* Extender el periodo gratuito todavía no tiene ruta en el back: solo se muestra con datos de prueba. */}
          {env.useMocks && t.suscripcion.estado === 'Periodo gratuito' && (
            <button type="button" disabled={busy} onClick={() => ejecutar(() => adminStoreService.extendTrial(t.id), 'Periodo gratuito extendido 15 días.')}
              className="mt-4 rounded-xl border border-white/15 bg-white/[.05] px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-60">Extender periodo gratuito 15 días</button>
          )}
        </AdminCard>

        <AdminCard title="Catálogo">
          <HBars unit=" prendas" items={[['Publicadas', t.catalogo.publicadas], ['En revisión', t.catalogo.revision], ['Agotadas', t.catalogo.agotadas], ['Retiradas', t.catalogo.retiradas]]} />
        </AdminCard>

        <AdminCard title="Eliminar tienda">
          <p className="text-sm text-white/75">Borra la tienda con sus fotos, su configuración de catálogo y sus administradores. Para sacarla del radar sin perder sus datos usa «Retirar verificación».</p>
          <div className="mt-4">
            <EliminarRegistro boton="Eliminar" titulo={`¿Eliminar ${t.nombre}?`}
              texto="Se borran la tienda, sus fotos, su configuración de catálogo y sus administradores."
              eliminar={() => adminStoreService.remove(t.id)} volverA="/admin/tiendas"
              avisoOk={`${t.nombre} fue eliminada.`} avisoYaNoExiste="Esa tienda ya había sido eliminada." />
          </div>
        </AdminCard>

        <AdminCard title="Transacciones" className="lg:col-span-2">
          {!data.pagos.length ? <EmptyState title="Sin transacciones">Aún no hay pagos registrados.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">Pagos de {t.nombre}</caption>
                <thead className="text-[11px] uppercase tracking-[.12em] text-white/55"><tr><th scope="col" className="py-2">Referencia</th><th scope="col" className="py-2">Fecha</th><th scope="col" className="py-2">Método</th><th scope="col" className="py-2 text-right">Monto</th><th scope="col" className="py-2 text-right">Estado</th></tr></thead>
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
          <label className="block text-sm" htmlFor="motivo-rechazo">Motivo (se lo enviaremos a la tienda)
            <textarea id="motivo-rechazo" value={motivo} onChange={(e) => { setMotivo(e.target.value); setErrMotivo('') }} maxLength={MOTIVO_RECHAZO_MAX} rows={3} placeholder="Ej. La cámara de comercio está vencida."
              aria-invalid={!!errMotivo} aria-describedby={errMotivo ? 'motivo-err' : undefined}
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violeta-claro" />
            <FieldError id="motivo-err" message={errMotivo} />
          </label>
        ) : accion?.texto}
      </ConfirmDialog>
    </>
  )
}

/** Anexo de ms-tiendas · F-24: cuentas con rol Tienda que pueden administrar este almacén. */
function AdministradoresCard({ nit }: { nit: string }) {
  const loader = useCallback(() => adminStoreService.listAdministrators(nit), [nit])
  const { data, loading, error, reload, setData } = useResource<StoreAdministratorDto[]>(loader, [])
  const [userId, setUserId] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const asignar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErr(''); setOk('')
    const uid = userId.trim()
    if (!uid) { setErr('Escribe el ID de la cuenta.'); return }
    setBusy(true)
    try {
      const a = await adminStoreService.assignAdministrator(nit, uid)
      setData((l) => (l.some((x) => String(x.userId) === String(a.userId)) ? l : [...l, a]))
      setOk(`La cuenta ${a.userId} ya puede administrar este almacén.`)
      setUserId('')
    } catch (e2) {
      const kind = errorKind(e2)
      if (e2 instanceof ApiError && e2.status === 422) setErr('Esa cuenta no tiene rol Tienda. Solo una cuenta de Tienda puede administrar un almacén.')
      else if (kind === 'no-existe') setErr('No encontramos esa cuenta o este almacén.')
      else if (kind === 'conflicto') { setErr('Alguien cambió los administradores al mismo tiempo. Actualizamos la lista.'); reload() }
      else setErr(errorMessage(e2, 'No pudimos asignar la cuenta. Intenta de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminCard title="Administradores del almacén">
      {loading ? <Loading label="Cargando administradores…" /> : error ? <ErrorState error={error} onRetry={reload} title="No pudimos cargar los administradores" /> : (
        data.length ? (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10" aria-label="Administradores">
            {data.map((a) => (
              <li key={String(a.id)} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <span>Cuenta {a.userId}</span>
                <span className="text-xs text-white/60">{a.assignedAt ? `Desde ${new Date(a.assignedAt).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}` : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-white/70">Este almacén aún no tiene administradores.</p>
      )}
      <form onSubmit={asignar} noValidate className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex-1 text-sm" htmlFor={`admin-${nit}`}>ID de la cuenta de Tienda
          <input id={`admin-${nit}`} value={userId} onChange={(e) => { setUserId(e.target.value); setErr('') }}
            aria-invalid={!!err} aria-describedby={err ? 'admin-err' : undefined}
            className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violeta-claro" />
        </label>
        <button type="submit" disabled={busy} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Asignando…' : 'Asignar'}</button>
      </form>
      <FieldError id="admin-err" message={err} />
      {ok && <p role="status" className="mt-2 text-sm text-[#9be3b4]">{ok}</p>}
    </AdminCard>
  )
}
