import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvisoEliminado } from '@/modules/administracion/components/EliminarRegistro'
import { Toasts } from '@/modules/core/components/errores'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { ROLE_LABEL, type Role } from '@/modules/core/types/roles'
import { CambioEstadoDialog } from '../components/CambioEstadoDialog'
import { EstadoCuentaPill } from '../components/EstadoCuentaPill'
import { inputCls } from '../utils/campo'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useCambioEstado } from '../hooks/useCambioEstado'
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_LABEL, ADMIN_Q_MAX, type AccountStatus } from '../types/usuario.dto'
import { mesAnio } from '../utils/formato'

type FiltroEstado = AccountStatus | 'TODOS'
type FiltroRol = Role | 'TODOS'

const ROLES_FILTRO: [FiltroRol, string][] = [
  ['TODOS', 'Todos los roles'], ['BUYER', 'Usuarios'], ['STORE_ADMIN', 'Tiendas'], ['FOUNDATION_REPRESENTATIVE', 'Fundaciones'],
  ['STYLERADAR_ADMIN', 'Administradores'],
]
/** Cuentas por página (el back acepta de 1 a 100). */
export const ADMIN_USERS_PAGE_SIZE = 20
/** Espera antes de buscar mientras se escribe, para no pedir una búsqueda por cada letra. */
const ESPERA_BUSQUEDA_MS = 300

/* RNF-07: en celular cada fila de la tabla se ve como una tarjeta con sus etiquetas. */
const tdCls = 'px-4 py-3 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:px-0 max-md:py-1.5 max-md:before:text-[11px] max-md:before:font-bold max-md:before:uppercase max-md:before:tracking-[.14em] max-md:before:text-white/55 max-md:before:content-[attr(data-label)]'

/** SR-RF-66: el administrador busca cuentas por estado, rol, nombre o correo y las pasa a Activa, Inactiva o Bloqueada. */
export default function AdminUsersPage() {
  const [texto, setTexto] = useState('')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<FiltroEstado>('TODOS')
  const [rol, setRol] = useState<FiltroRol>('TODOS')
  const [pagina, setPagina] = useState(0)
  const searchId = useId()

  const { page, users, loading, error, reload, setStatus } = useAdminUsers({
    q, page: pagina, size: ADMIN_USERS_PAGE_SIZE,
    ...(estado !== 'TODOS' ? { status: estado } : {}),
    ...(rol !== 'TODOS' ? { role: rol } : {}),
  })
  const ce = useCambioEstado({ setStatus, onNoExiste: reload, onConflicto: reload })

  useEffect(() => {
    const t = setTimeout(() => { setQ(texto.trim()); setPagina(0) }, ESPERA_BUSQUEDA_MS)
    return () => clearTimeout(t)
  }, [texto])

  const filtrando = q !== '' || estado !== 'TODOS' || rol !== 'TODOS'
  const limpiar = () => { setTexto(''); setQ(''); setEstado('TODOS'); setRol('TODOS'); setPagina(0) }
  const total = page.totalElements

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Administración</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Usuarios</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/70">Busca una cuenta y cambia su estado. Activa: puede usar StyleRadar. Inactiva: sin uso reciente. Bloqueada: no puede iniciar sesión.</p>
      <div className="mt-4"><AvisoEliminado /></div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor={searchId} className="block text-xs font-bold uppercase tracking-[.14em] text-white/70">Buscar</label>
          <input id={searchId} type="search" value={texto} maxLength={ADMIN_Q_MAX} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre o correo" className={`${inputCls} mt-1.5`} />
        </div>
        <div>
          <label htmlFor={`${searchId}-rol`} className="block text-xs font-bold uppercase tracking-[.14em] text-white/70">Rol</label>
          <select id={`${searchId}-rol`} value={rol} onChange={(e) => { setRol(e.target.value as FiltroRol); setPagina(0) }} className={`${inputCls} mt-1.5 md:w-52`}>
            {ROLES_FILTRO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div role="group" aria-label="Filtrar por estado" className="mt-4 flex flex-wrap gap-2">
        {(['TODOS', ...ACCOUNT_STATUSES] as FiltroEstado[]).map((f) => (
          <button key={f} type="button" aria-pressed={estado === f} onClick={() => { setEstado(f); setPagina(0) }}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${estado === f ? 'border-arena bg-arena text-grafito' : 'border-white/20 hover:bg-white/10'}`}>
            {f === 'TODOS' ? 'Todas' : ACCOUNT_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {ce.aviso && (
        <div role={ce.aviso.ok ? 'status' : 'alert'}
          className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm ${ce.aviso.ok ? 'bg-[var(--sr-ok,#9be3b4)]/10 text-[var(--sr-ok,#9be3b4)]' : 'bg-[var(--sr-bad,#ff8a8a)]/10 text-[var(--sr-bad,#ffb4b4)]'}`}>
          <span>{ce.aviso.text}</span>
          {ce.aviso.undo && <button type="button" disabled={ce.busy} onClick={ce.deshacer} className="rounded-lg border border-current px-3 py-1 font-semibold">Deshacer</button>}
        </div>
      )}

      <div className="mt-6">
        {loading ? <Loading label="Cargando cuentas…" />
          : error ? <ErrorState error={error} onRetry={reload} title="No pudimos cargar las cuentas" />
          : !users.length ? (
            <EmptyState title={filtrando ? 'Ninguna cuenta coincide' : 'Aún no hay cuentas'}
              action={filtrando ? <button type="button" onClick={limpiar} className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-blanco">Quitar filtros</button> : undefined}>
              {filtrando ? 'Prueba con otro nombre, correo, rol o estado.' : 'Cuando las personas se registren aparecerán aquí.'}
            </EmptyState>
          ) : (
            <>
              <p className="mb-3 text-sm text-white/60" aria-live="polite">{total} {total === 1 ? 'cuenta' : 'cuentas'}</p>
              <table className="w-full text-left text-sm max-md:block">
                <caption className="sr-only">Cuentas de StyleRadar</caption>
                <thead className="border-b border-white/15 text-[11px] uppercase tracking-[.14em] text-white/60 max-md:sr-only">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Nombre</th>
                    <th scope="col" className="px-4 py-3 font-bold">Rol</th>
                    <th scope="col" className="px-4 py-3 font-bold">Estado</th>
                    <th scope="col" className="px-4 py-3 font-bold">Barrio</th>
                    <th scope="col" className="px-4 py-3 font-bold">Miembro desde</th>
                    <th scope="col" className="px-4 py-3 font-bold"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/10 max-md:block max-md:rounded-2xl max-md:border max-md:bg-white/[.04] max-md:p-4">
                      <td className="px-4 py-3 max-md:block max-md:px-0 max-md:pt-0">
                        <Link to={`/admin/usuarios/${encodeURIComponent(u.id)}`} className="font-semibold underline-offset-4 hover:underline">{u.name}</Link>
                        <p className="break-all text-xs text-white/60">{u.email}</p>
                      </td>
                      <td data-label="Rol" className={tdCls}>{u.roles[0] ? ROLE_LABEL[u.roles[0]] : '—'}</td>
                      <td data-label="Estado" className={tdCls}><EstadoCuentaPill estado={u.accountStatus} /></td>
                      <td data-label="Barrio" className={tdCls}>{u.neighborhood || '—'}</td>
                      <td data-label="Miembro desde" className={tdCls}>{mesAnio(u.registeredAt)}</td>
                      <td className="px-4 py-3 text-right max-md:block max-md:px-0 max-md:pb-0 max-md:pt-3">
                        <button type="button" disabled={ce.busy} onClick={() => ce.abrir(u)}
                          aria-label={`Cambiar estado de ${u.name}`}
                          className="whitespace-nowrap rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 max-md:w-full">
                          Cambiar estado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {page.totalPages > 1 && (
                <nav aria-label="Páginas de cuentas" className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <button type="button" disabled={page.first} onClick={() => setPagina((p) => Math.max(0, p - 1))}
                    className="rounded-xl border border-white/20 px-4 py-2 font-semibold disabled:opacity-40">Anterior</button>
                  <span className="text-white/70">Página {page.page + 1} de {page.totalPages}</span>
                  <button type="button" disabled={page.last} onClick={() => setPagina((p) => p + 1)}
                    className="rounded-xl border border-white/20 px-4 py-2 font-semibold disabled:opacity-40">Siguiente</button>
                </nav>
              )}
            </>
          )}
      </div>

      <CambioEstadoDialog cambio={ce.cambio} motivo={ce.motivo} errorMotivo={ce.errorMotivo} busy={ce.busy}
        onElegir={ce.elegir} onMotivo={ce.escribir} onCancel={ce.cancelar} onConfirm={ce.confirmar} />
      <Toasts items={ce.toasts.items} quitar={ce.toasts.quitar} duracion={ce.toasts.duracion} />
    </section>
  )
}
