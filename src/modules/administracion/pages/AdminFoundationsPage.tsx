import { useCallback, useState } from 'react'
import { errorMessage } from '@/modules/core/api/errors'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { AdminHeader, AdminTable, EditLink, Modal, StatusBadge, Who, type Columna } from '../components/AdminUi'
import { FoundationForm } from '../components/FoundationForm'
import { adminFoundationService } from '../services/adminService'
import { FUNDACION_VACIA, type AdminFoundationDto, type FoundationFormDto } from '../types/admin.dto'

const total = (f: AdminFoundationDto) => f.donaciones.pendientes + f.donaciones.enProceso + f.donaciones.recibidas + f.donaciones.rechazadas
const COLUMNAS: Columna<AdminFoundationDto>[] = [
  { label: 'Fundación', render: (f) => <Who name={f.nombre} sub={f.correo} />, sort: (f) => f.nombre },
  { label: 'NIT', render: (f) => f.nit, secundaria: true },
  { label: 'Barrio', render: (f) => f.barrio, sort: (f) => f.barrio },
  { label: 'Estado', render: (f) => <StatusBadge value={f.estado} />, sort: (f) => f.estado },
  { label: 'Suscripción', render: () => <StatusBadge value="Exenta" />, secundaria: true },
  { label: 'Donaciones', render: total, sort: total, num: true },
]

/** Admin › Fundaciones: lista, registro de fundaciones aliadas y acceso al detalle (RF-90). */
export default function AdminFoundationsPage() {
  const { data, loading, error, reload, setData } = useResource(adminFoundationService.list, [] as AdminFoundationDto[])
  const [nueva, setNueva] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const cerrar = useCallback(() => { if (!busy) setNueva(false) }, [busy])

  const registrar = async (d: FoundationFormDto) => {
    setBusy(true); setMsg(null)
    try {
      const f = await adminFoundationService.create(d)
      setData((l) => [...l, f]); setNueva(false)
      setMsg({ ok: true, text: `${f.nombre} quedó registrada como fundación aliada.` })
    } catch (e) { setMsg({ ok: false, text: errorMessage(e, 'No pudimos registrar la fundación. Intenta de nuevo.') }); setNueva(false) }
    finally { setBusy(false) }
  }

  return (
    <>
      <AdminHeader kicker="Configuración" title="Fundaciones" />
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mb-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[#9be3b4]/10 text-[#9be3b4]' : 'bg-[#ff8a8a]/10 text-[#ffb4b4]'}`}>{msg.text}</p>}
      {loading ? <Loading label="Cargando fundaciones…" /> : error ? <ErrorState error={error} onRetry={reload} title="No pudimos cargar las fundaciones" /> : (
        <AdminTable rows={data} columnas={COLUMNAS} keyOf={(f) => f.id} titulo={(f) => f.nombre} vacio="No hay fundaciones con esos filtros."
          buscar={{ placeholder: 'Buscar fundación, NIT o barrio', texto: (f) => `${f.nombre} ${f.nit} ${f.barrio}` }}
          filtros={[{ label: 'Estado', opciones: ['Activa', 'Inactiva'], get: (f) => f.estado }]}
          herramientas={<button type="button" onClick={() => setNueva(true)} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold">+ Nueva fundación</button>}
          acciones={(f) => <EditLink to={`/admin/fundaciones/${f.id}`} name={f.nombre} />} />
      )}

      <Modal open={nueva} kicker="Fundaciones" title="Registrar fundación aliada" onClose={cerrar}>
        <FoundationForm id="nf" inicial={FUNDACION_VACIA} otrosNits={data.map((f) => f.nit)} onSubmit={registrar}>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cerrar} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold">Cancelar</button>
            <button type="submit" disabled={busy} className="rounded-xl bg-violeta px-4 py-2.5 text-sm font-semibold disabled:opacity-60">{busy ? 'Registrando…' : 'Registrar fundación'}</button>
          </div>
        </FoundationForm>
      </Modal>
    </>
  )
}
