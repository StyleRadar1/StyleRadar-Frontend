import { useCallback, useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorToast, FieldError } from '@/modules/core/components/ErrorFeedback'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { usuarioService } from '@/modules/identidad/services/usuarioService'
import { AdminCard, AdminHeader, Dl, HBars, StatusBadge, Who } from '../components/AdminUi'
import { FoundationForm } from '../components/FoundationForm'
import { aFormularioFundacion, adminFoundationService } from '../services/adminService'
import { FOUNDATION_LIMITS, GARMENT_CATEGORY_LABEL, type AdminFoundationDto, type FoundationFormDto } from '../types/admin.dto'
import { erroresServidorFundacion, TEXTOS_FUNDACION, type FoundationDuplicates, type FoundationFormErrors } from '../utils/validation'

type Datos = { f: AdminFoundationDto | null; representante: string; duplicados: FoundationDuplicates }

/** Nombre del representante desde ms-usuarios; si no se puede leer, el formulario muestra «Usuario {id}». */
const nombreDe = (id: string | number) => usuarioService.getAdmin(String(id)).then((u) => u.name).catch(() => '')

/** Admin › Fundaciones › detalle: editar datos (SR-RF-64), desactivar o reactivar con motivo opcional (SR-RF-65). */
export default function AdminFoundationDetailPage() {
  const { id = '' } = useParams()
  const motivoId = useId()
  const loader = useCallback(async (): Promise<Datos> => {
    const [f, todas] = await Promise.all([adminFoundationService.get(id), adminFoundationService.list()])
    const otras = todas.filter((x) => x.id !== id)
    return {
      f,
      representante: await nombreDe(f.representativeId),
      duplicados: { nits: otras.map((x) => x.nit), nombres: otras.map((x) => x.name), representantes: otras.map((x) => String(x.representativeId)) },
    }
  }, [id])
  const { data, loading, error, reload, setData } = useResource<Datos>(loader, { f: null, representante: '', duplicados: {} })
  const [busy, setBusy] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [cambio, setCambio] = useState<AdminFoundationDto['estado'] | null>(null)
  const [motivo, setMotivo] = useState('')
  const [formErrors, setFormErrors] = useState<FoundationFormErrors>({})
  const [formKey, setFormKey] = useState(0)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string; sub?: string } | null>(null)
  const cerrarCambio = useCallback(() => { setCambio(null); setMotivo('') }, [])
  const f = data.f

  if (loading && !f) return <Loading label="Cargando la fundación…" />
  if (error || !f) return <><AdminHeader kicker="Fundaciones · detalle" title="Fundación" back={{ to: '/admin/fundaciones', label: 'Volver a fundaciones' }} /><ErrorState error={error} onRetry={reload} title="No pudimos cargar la fundación" /></>
  const total = f.donaciones.pendientes + f.donaciones.enProceso + f.donaciones.recibidas + f.donaciones.rechazadas
  const motivoLargo = motivo.trim().length > FOUNDATION_LIMITS.reason

  const ejecutar = async (fn: () => Promise<AdminFoundationDto>, ok: string, conflicto: string, representante = data.representante, esEstado = true) => {
    setBusy(true); setMsg(null); setFormErrors({})
    try {
      const n = await fn()
      setData((d) => ({ ...d, f: { ...n, donaciones: f.donaciones }, representante }))
      setFormKey((k) => k + 1)
      setMsg({ tone: 'ok', text: ok })
      cerrarCambio()
    } catch (e) {
      const fields = erroresServidorFundacion(e)
      if (Object.keys(fields).length) {
        setFormErrors(fields)
      } else if (errorKind(e) === 'conflicto') {
        setMsg({ tone: 'warn', text: conflicto, sub: esEstado ? 'Actualizamos su estado.' : undefined })
        if (esEstado) { cerrarCambio(); reload() }
      } else {
        setMsg({ tone: 'bad', text: errorMessage(e, 'No pudimos guardar el cambio. Intenta de nuevo.') })
        cerrarCambio()
      }
    } finally { setBusy(false) }
  }
  const guardar = (d: FoundationFormDto) => ejecutar(
    () => adminFoundationService.update(f.id, d),
    'Fundación actualizada.',
    'Ya existe otra fundación aliada con ese nombre, NIT o representante.',
    d.representativeName,
    false,
  )
  const confirmarCambio = () => {
    if (!cambio || motivoLargo) return
    const desactivar = cambio === 'Inactiva'
    ejecutar(
      () => adminFoundationService.setState(f.id, cambio, motivo),
      desactivar ? 'Fundación desactivada.' : 'Fundación reactivada.',
      desactivar ? TEXTOS_FUNDACION.yaInactiva : TEXTOS_FUNDACION.yaActiva,
    )
  }

  return (
    <>
      <AdminHeader kicker="Fundaciones · detalle" title={f.name} back={{ to: '/admin/fundaciones', label: 'Volver a fundaciones' }} />
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
          <div className="mb-4 flex items-start justify-between gap-3"><Who name={f.name} sub={f.neighborhood} /><StatusBadge value={f.estado} /></div>
          <FoundationForm key={`${f.id}-${formKey}`} id="ef" inicial={aFormularioFundacion(f, data.representante)} duplicados={data.duplicados}
            serverErrors={formErrors} onSubmit={guardar} onUploadingChange={setSubiendo}>
            <button type="submit" disabled={busy || subiendo} className="rounded-xl bg-violeta px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
          </FoundationForm>
        </AdminCard>

        <AdminCard title="Estado y suscripción">
          <Dl items={[
            ['Estado', <StatusBadge key="e" value={f.estado} />],
            ['Suscripción', <StatusBadge key="s" value="Exenta" />],
            ['Aliada desde', f.aliadaDesde],
            ['Recibe', f.acceptedCategories.map((c) => GARMENT_CATEGORY_LABEL[c]).join(', ') || '—'],
            ['Donaciones en historial', total],
          ]} />
          <p className="mt-4 text-sm text-white/75">{f.estado === 'Activa'
            ? 'Si la desactivas, dejará de recibir donaciones nuevas y de aparecer en el radar. Su historial se conserva.'
            : 'Está desactivada: no recibe donaciones nuevas. Su historial se conserva.'}</p>
          <div className="mt-4">
            {f.estado === 'Activa'
              ? <button type="button" disabled={busy} onClick={() => setCambio('Inactiva')} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-[#ffb4b4]">Desactivar fundación</button>
              : <button type="button" disabled={busy} onClick={() => setCambio('Activa')} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold">Reactivar fundación</button>}
          </div>
        </AdminCard>

        <AdminCard title="Donaciones">
          {total ? <HBars items={[['Pendientes', f.donaciones.pendientes], ['En proceso', f.donaciones.enProceso], ['Recibidas', f.donaciones.recibidas], ['Rechazadas', f.donaciones.rechazadas]]} />
            : <EmptyState title="Sin donaciones">Todavía no ha recibido solicitudes.</EmptyState>}
        </AdminCard>
      </div>

      <ConfirmDialog open={!!cambio} danger={cambio === 'Inactiva'} busy={busy}
        title={cambio === 'Inactiva' ? '¿Desactivar esta fundación?' : '¿Reactivar esta fundación?'}
        confirmLabel={cambio === 'Inactiva' ? 'Desactivar' : 'Reactivar'}
        onConfirm={confirmarCambio} onCancel={cerrarCambio}>
        <p>{cambio === 'Inactiva'
          ? `${f.name} no podrá recibir donaciones nuevas ni aparecerá en el radar. Se conservan sus ${total} donaciones en el historial.`
          : `${f.name} volverá a recibir donaciones y a aparecer en el radar.`}</p>
        <label htmlFor={motivoId} className="mt-4 block text-[11px] font-bold uppercase tracking-[.14em] text-white/70">Motivo (opcional)</label>
        <textarea id={motivoId} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-invalid={motivoLargo}
          aria-describedby={motivoLargo ? `${motivoId}-err` : undefined}
          className={`mt-1 w-full rounded-lg border bg-black/20 px-3 py-2.5 text-sm text-blanco outline-none focus:border-violeta-claro ${motivoLargo ? 'border-[#ffb4b4]' : 'border-white/20'}`} />
        <p className="mt-1 text-right text-[11px] text-white/55">{motivo.trim().length}/{FOUNDATION_LIMITS.reason}</p>
        <FieldError id={`${motivoId}-err`} message={motivoLargo ? TEXTOS_FUNDACION.motivoLargo : undefined} />
      </ConfirmDialog>
    </>
  )
}
