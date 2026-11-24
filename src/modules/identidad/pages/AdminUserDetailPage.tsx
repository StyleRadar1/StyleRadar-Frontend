import { useCallback, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorKind } from '@/modules/core/api/errors'
import { Toasts } from '@/modules/core/components/errores'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { ROLE_LABEL } from '@/modules/core/types/roles'
import { EliminarRegistro } from '@/modules/administracion/components/EliminarRegistro'
import { CambioEstadoDialog } from '../components/CambioEstadoDialog'
import { EstadoCuentaPill } from '../components/EstadoCuentaPill'
import { useCambioEstado } from '../hooks/useCambioEstado'
import { usuarioService } from '../services/usuarioService'
import type { AdminUserDto, ChangeStatusRequestDto } from '../types/usuario.dto'
import { fechaHora, mesAnio } from '../utils/formato'

const volver = <Link to="/admin/usuarios" className="inline-block text-[11px] font-bold uppercase tracking-[.16em] text-white/65 hover:text-blanco"><span aria-hidden="true">← </span>Volver a usuarios</Link>

function Dato({ k, children }: { k: string; children: ReactNode }) {
  return <div><dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/55">{k}</dt><dd className="mt-0.5 break-words">{children}</dd></div>
}

/** SR-RF-66 · F-14: detalle de una cuenta (GET /api/v1/admin/users/{id}) con la auditoría del último cambio de estado. */
export default function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const loader = useCallback(() => usuarioService.getAdmin(id), [id])
  const { data: u, loading, error, reload, setData } = useResource<AdminUserDto | null>(loader, null)

  const setStatus = useCallback(async (cuenta: string, body: ChangeStatusRequestDto) => {
    const upd = await usuarioService.setStatus(cuenta, body)
    setData(() => upd)
    return upd
  }, [setData])
  const ce = useCambioEstado({ setStatus, onNoExiste: reload, onConflicto: reload })

  let cuerpo: ReactNode
  if (loading && !u) cuerpo = <Loading label="Cargando la cuenta…" />
  else if (error && errorKind(error) === 'no-existe') {
    cuerpo = <EmptyState title="Esa cuenta no existe" action={<Link to="/admin/usuarios" className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-blanco">Ver todas las cuentas</Link>}>Puede que la hayan borrado. Busca otra en la lista.</EmptyState>
  } else if (error || !u) cuerpo = <ErrorState error={error} onRetry={reload} title="No pudimos cargar la cuenta" />
  else {
    cuerpo = (
      <>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words text-4xl font-extrabold tracking-tight md:text-5xl">{u.name}</h1>
            <p className="mt-1 break-all text-sm text-white/65">{u.email}</p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <button type="button" disabled={ce.busy} onClick={() => ce.abrir(u)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Cambiar estado</button>
            {/* SR-RF-115: para suspenderla sin perder sus datos se usa el cambio de estado. */}
            <div>
              <EliminarRegistro boton="Eliminar cuenta" titulo={`¿Eliminar la cuenta de ${u.name}?`}
                texto="Se borran la cuenta, sus preferencias de estilo, sus tallas y sus búsquedas guardadas. Si solo quieres suspenderla, usa «Cambiar estado»."
                eliminar={() => usuarioService.removeAdmin(u.id)} volverA="/admin/usuarios"
                avisoOk="Cuenta eliminada" avisoYaNoExiste="Esa cuenta ya había sido eliminada." />
            </div>
          </div>
        </div>

        {ce.aviso && (
          <div role={ce.aviso.ok ? 'status' : 'alert'}
            className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm ${ce.aviso.ok ? 'bg-[var(--sr-ok,#9be3b4)]/10 text-[var(--sr-ok,#9be3b4)]' : 'bg-[var(--sr-bad,#ff8a8a)]/10 text-[var(--sr-bad,#ffb4b4)]'}`}>
            <span>{ce.aviso.text}</span>
            {ce.aviso.undo && <button type="button" disabled={ce.busy} onClick={ce.deshacer} className="rounded-lg border border-current px-3 py-1 font-semibold">Deshacer</button>}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section aria-label="Cuenta" className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <h2 className="text-2xl font-bold">Cuenta</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Dato k="Estado"><EstadoCuentaPill estado={u.accountStatus} /></Dato>
              <Dato k="Rol">{u.roles[0] ? ROLE_LABEL[u.roles[0]] : '—'}</Dato>
              <Dato k="Barrio">{u.neighborhood || '—'}</Dato>
              <Dato k="Miembro desde">{mesAnio(u.registeredAt)}</Dato>
            </dl>
          </section>
          <section aria-label="Último cambio de estado" className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            <h2 className="text-2xl font-bold">Último cambio de estado</h2>
            {u.statusChangedAt ? (
              <dl className="mt-4 grid grid-cols-1 gap-y-3 text-sm">
                <Dato k="Fecha">{fechaHora(u.statusChangedAt)}</Dato>
                <Dato k="Hecho por">{u.statusChangedBy != null ? `Administrador ${u.statusChangedBy}` : '—'}</Dato>
                <Dato k="Motivo">{u.statusChangeReason || '—'}</Dato>
              </dl>
            ) : <p className="mt-4 text-sm text-white/65">Esta cuenta no ha cambiado de estado.</p>}
          </section>
        </div>
      </>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Administración · Usuarios</p>
      <div className="mt-3">{volver}</div>
      <div className="mt-4">{cuerpo}</div>
      <CambioEstadoDialog cambio={ce.cambio} motivo={ce.motivo} errorMotivo={ce.errorMotivo} busy={ce.busy}
        onElegir={ce.elegir} onMotivo={ce.escribir} onCancel={ce.cancelar} onConfirm={ce.confirmar} />
      <Toasts items={ce.toasts.items} quitar={ce.toasts.quitar} duracion={ce.toasts.duracion} />
    </section>
  )
}
