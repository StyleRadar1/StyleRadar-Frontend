import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorToast } from '@/modules/core/components/ErrorFeedback'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { AdminCard, AdminHeader, Dl, HBars, StatusBadge, Who } from '../components/AdminUi'
import { FoundationForm } from '../components/FoundationForm'
import { adminFoundationService } from '../services/adminService'
import type { AdminFoundationDto, FoundationFormDto } from '../types/admin.dto'
import type { FoundationDuplicates } from '../utils/validation'

/** Admin › Fundaciones › detalle: editar datos, activar o desactivar y ver sus donaciones. */
export default function AdminFoundationDetailPage() {
  const { id = '' } = useParams()
  const loader = useCallback(async () => {
    const [f, todas] = await Promise.all([adminFoundationService.get(id), adminFoundationService.list()])
    const otras = todas.filter((x) => x.id !== id)
    return {
      f,
      duplicados: {
        nits: otras.map((x) => x.nit),
        nombres: otras.map((x) => x.nombre),
        representantes: otras.map((x) => x.representante),
      },
    }
  }, [id])
  const { data, loading, error, reload, setData } = useResource<{ f: AdminFoundationDto | null; duplicados: FoundationDuplicates }>(loader, { f: null, duplicados: {} })
  const [busy, setBusy] = useState(false)
  const [desactivar, setDesactivar] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FoundationFormDto, string>>>({})
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string; sub?: string } | null>(null)
  const f = data.f

  if (loading && !f) return <Loading label="Cargando la fundación…" />
  if (error || !f) return <><AdminHeader kicker="Fundaciones · detalle" title="Fundación" back={{ to: '/admin/fundaciones', label: 'Volver a fundaciones' }} /><ErrorState error={error} onRetry={reload} title="No pudimos cargar la fundación" /></>
  const total = f.donaciones.pendientes + f.donaciones.enProceso + f.donaciones.recibidas + f.donaciones.rechazadas

  const ejecutar = async (fn: () => Promise<AdminFoundationDto>, ok: string, conflictText?: string) => {
    setBusy(true); setMsg(null); setFormErrors({})
    try { const n = await fn(); setData((d) => ({ ...d, f: { ...n } })); setMsg({ tone: 'ok', text: ok }) }
    catch (e) {
      const kind = errorKind(e)
      const fields = fieldErrors(e) as Partial<Record<keyof FoundationFormDto, string>>
      if (Object.keys(fields).length) {
        setFormErrors(fields)
      } else if (kind === 'conflicto') {
        setMsg({ tone: 'warn', text: conflictText ?? 'Esta fundación ya está inactiva', sub: 'Actualizamos su estado.' })
        reload()
      } else {
        setMsg({ tone: 'bad', text: errorMessage(e, 'No pudimos guardar el cambio. Intenta de nuevo.') })
      }
    }
    finally { setBusy(false); setDesactivar(false) }
  }
  const guardar = (d: FoundationFormDto) => ejecutar(() => adminFoundationService.update(f.id, d), 'Fundación actualizada.')

  return (
    <>
      <AdminHeader kicker="Fundaciones · detalle" title={f.nombre} back={{ to: '/admin/fundaciones', label: 'Volver a fundaciones' }} />
      <ErrorToast
        open={!!msg}
        tone={msg?.tone ?? 'ok'}
        icon={msg?.tone === 'warn' ? 'refresh' : msg?.tone === 'ok' ? 'ok' : 'warn'}
        title={msg?.text ?? ''}
        subtitle={msg?.sub}
        onClose={() => setMsg(null)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Información general" className="lg:row-span-2">
          <div className="mb-4 flex items-start justify-between gap-3"><Who name={f.nombre} sub={f.barrio} /><StatusBadge value={f.estado} /></div>
          <FoundationForm key={f.id} id="ef" inicial={f} duplicados={data.duplicados} serverErrors={formErrors} onSubmit={guardar}>
            <button type="submit" disabled={busy} className="rounded-xl bg-violeta px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
          </FoundationForm>
        </AdminCard>

        <AdminCard title="Estado y suscripción">
          <Dl items={[['Estado', <StatusBadge key="e" value={f.estado} />], ['Suscripción', <StatusBadge key="s" value="Exenta" />], ['Aliada desde', f.aliadaDesde], ['Donaciones en historial', total]]} />
          <p className="mt-4 text-sm text-white/75">{f.estado === 'Activa'
            ? 'Si la desactivas, dejará de recibir donaciones nuevas y de aparecer en el radar. Su historial se conserva.'
            : 'Está desactivada: no recibe donaciones nuevas. Su historial se conserva.'}</p>
          <div className="mt-4">
            {f.estado === 'Activa'
              ? <button type="button" disabled={busy} onClick={() => setDesactivar(true)} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-[#ffb4b4]">Desactivar fundación</button>
              : <button type="button" disabled={busy} onClick={() => ejecutar(() => adminFoundationService.setState(f.id, 'Activa'), 'Fundación reactivada.')} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold">Reactivar fundación</button>}
          </div>
        </AdminCard>

        <AdminCard title="Donaciones">
          {total ? <HBars items={[['Pendientes', f.donaciones.pendientes], ['En proceso', f.donaciones.enProceso], ['Recibidas', f.donaciones.recibidas], ['Rechazadas', f.donaciones.rechazadas]]} />
            : <EmptyState title="Sin donaciones">Todavía no ha recibido solicitudes.</EmptyState>}
        </AdminCard>
      </div>

      <ConfirmDialog open={desactivar} danger busy={busy} title="¿Desactivar esta fundación?" confirmLabel="Desactivar"
        onConfirm={() => ejecutar(() => adminFoundationService.setState(f.id, 'Inactiva'), 'Fundación desactivada.')} onCancel={() => setDesactivar(false)}>
        {f.nombre} no podrá recibir donaciones nuevas ni aparecerá en el radar. Se conservan sus {total} donaciones en el historial.
      </ConfirmDialog>
    </>
  )
}
