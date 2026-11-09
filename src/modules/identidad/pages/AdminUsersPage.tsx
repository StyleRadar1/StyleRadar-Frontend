import { useId, useMemo, useRef, useState } from 'react'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { ROLE_LABEL, type Role } from '@/modules/core/types/roles'
import { EstadoCuentaPill } from '../components/EstadoCuentaPill'
import { inputCls } from '../utils/campo'
import { useAdminUsers } from '../hooks/useAdminUsers'
import {
  ESTADOS_CUENTA, ESTADO_CUENTA_AYUDA, ESTADO_CUENTA_LABEL, PLAN_LABEL,
  type EstadoCuenta, type UsuarioAdminDto,
} from '../types/usuario.dto'
import { mesAnio, normalizar } from '../utils/formato'

type FiltroEstado = EstadoCuenta | 'TODOS'
type FiltroRol = Role | 'TODOS'
type Cambio = { user: UsuarioAdminDto; to: EstadoCuenta }
type Aviso = { ok: boolean; text: string; undo?: Cambio }

const ROLES_FILTRO: [FiltroRol, string][] = [
  ['TODOS', 'Todos los roles'], ['COMPRADOR', 'Usuarios'], ['ADMIN_ALMACEN', 'Tiendas'], ['REPRESENTANTE_FUNDACION', 'Fundaciones'],
]

/* RNF-07: en celular cada fila de la tabla se ve como una tarjeta con sus etiquetas. */
const tdCls = 'px-4 py-3 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:px-0 max-md:py-1.5 max-md:before:text-[11px] max-md:before:font-bold max-md:before:uppercase max-md:before:tracking-[.14em] max-md:before:text-white/55 max-md:before:content-[attr(data-label)]'

/** RF-66: el administrador busca cuentas, las filtra por estado y las pasa a Activa, Inactiva o Bloqueada. */
export default function AdminUsersPage() {
  const { users, loading, error, reload, setStatus } = useAdminUsers()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<FiltroEstado>('TODOS')
  const [rol, setRol] = useState<FiltroRol>('TODOS')
  const [cambio, setCambio] = useState<Cambio | null>(null)
  const [busy, setBusy] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const inFlight = useRef(false)
  const searchId = useId()

  const porRol = useMemo(() => users.filter((u) => rol === 'TODOS' || u.rol === rol), [users, rol])
  const conteo = useMemo(() => {
    const c: Record<FiltroEstado, number> = { TODOS: porRol.length, ACTIVA: 0, INACTIVA: 0, BLOQUEADA: 0 }
    porRol.forEach((u) => { c[u.estado]++ })
    return c
  }, [porRol])
  const visibles = useMemo(() => {
    const q = normalizar(texto.trim())
    return porRol.filter((u) => (estado === 'TODOS' || u.estado === estado) && (!q || normalizar(`${u.nombre} ${u.correo}`).includes(q)))
  }, [porRol, estado, texto])

  const filtrando = texto.trim() !== '' || estado !== 'TODOS' || rol !== 'TODOS'
  const limpiar = () => { setTexto(''); setEstado('TODOS'); setRol('TODOS') }

  const aplicar = async (c: Cambio, esDeshacer = false) => {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setAviso(null)
    const antes = c.user.estado
    try {
      const upd = await setStatus(c.user.id, c.to)
      setAviso(esDeshacer
        ? { ok: true, text: `Se deshizo el cambio: ${upd.nombre} vuelve a estar ${ESTADO_CUENTA_LABEL[upd.estado]}.` }
        : { ok: true, text: `${upd.nombre} ahora está ${ESTADO_CUENTA_LABEL[upd.estado]}.`, undo: { user: upd, to: antes } })
    } catch (e) {
      setAviso({ ok: false, text: errorMessage(e, 'No se pudo cambiar el estado de la cuenta.') })
      if (errorKind(e) === 'conflicto') reload()
    } finally {
      inFlight.current = false; setBusy(false); setCambio(null)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Administración</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Usuarios</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/70">Busca una cuenta y cambia su estado. Activa: puede usar StyleRadar. Inactiva: sin uso reciente. Bloqueada: no puede iniciar sesión.</p>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor={searchId} className="block text-xs font-bold uppercase tracking-[.14em] text-white/70">Buscar</label>
          <input id={searchId} type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre o correo" className={`${inputCls} mt-1.5`} />
        </div>
        <div>
          <label htmlFor={`${searchId}-rol`} className="block text-xs font-bold uppercase tracking-[.14em] text-white/70">Rol</label>
          <select id={`${searchId}-rol`} value={rol} onChange={(e) => setRol(e.target.value as FiltroRol)} className={`${inputCls} mt-1.5 md:w-52`}>
            {ROLES_FILTRO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div role="group" aria-label="Filtrar por estado" className="mt-4 flex flex-wrap gap-2">
        {(['TODOS', ...ESTADOS_CUENTA] as FiltroEstado[]).map((f) => (
          <button key={f} type="button" aria-pressed={estado === f} onClick={() => setEstado(f)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${estado === f ? 'border-arena bg-arena text-grafito' : 'border-white/20 hover:bg-white/10'}`}>
            {f === 'TODOS' ? 'Todas' : ESTADO_CUENTA_LABEL[f]} <span className={estado === f ? "" : "opacity-70"}>({loading ? '…' : conteo[f]})</span>
          </button>
        ))}
      </div>

      {aviso && (
        <div role={aviso.ok ? 'status' : 'alert'}
          className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm ${aviso.ok ? 'bg-[var(--sr-ok,#9be3b4)]/10 text-[var(--sr-ok,#9be3b4)]' : 'bg-[var(--sr-bad,#ff8a8a)]/10 text-[var(--sr-bad,#ffb4b4)]'}`}>
          <span>{aviso.text}</span>
          {aviso.undo && <button type="button" disabled={busy} onClick={() => aviso.undo && aplicar(aviso.undo, true)} className="rounded-lg border border-current px-3 py-1 font-semibold">Deshacer</button>}
        </div>
      )}

      <div className="mt-6">
        {loading ? <Loading label="Cargando cuentas…" />
          : error ? <ErrorState error={error} onRetry={reload} title="No pudimos cargar las cuentas" />
          : !visibles.length ? (
            <EmptyState title={filtrando ? 'Ninguna cuenta coincide' : 'Aún no hay cuentas'}
              action={filtrando ? <button type="button" onClick={limpiar} className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-blanco">Quitar filtros</button> : undefined}>
              {filtrando ? 'Prueba con otro nombre, correo o estado.' : 'Cuando las personas se registren aparecerán aquí.'}
            </EmptyState>
          ) : (
            <>
              <p className="mb-3 text-sm text-white/60" aria-live="polite">{visibles.length} {visibles.length === 1 ? 'cuenta' : 'cuentas'}</p>
              <table className="w-full text-left text-sm max-md:block">
                <caption className="sr-only">Cuentas de StyleRadar</caption>
                <thead className="border-b border-white/15 text-[11px] uppercase tracking-[.14em] text-white/60 max-md:sr-only">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Nombre</th>
                    <th scope="col" className="px-4 py-3 font-bold">Rol</th>
                    <th scope="col" className="px-4 py-3 font-bold">Plan</th>
                    <th scope="col" className="px-4 py-3 font-bold">Estado</th>
                    <th scope="col" className="px-4 py-3 font-bold">Barrio</th>
                    <th scope="col" className="px-4 py-3 font-bold">Miembro desde</th>
                    <th scope="col" className="px-4 py-3 font-bold"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
                  {visibles.map((u) => (
                    <tr key={u.id} className="border-b border-white/10 max-md:block max-md:rounded-2xl max-md:border max-md:bg-white/[.04] max-md:p-4">
                      <td className="px-4 py-3 max-md:block max-md:px-0 max-md:pt-0">
                        <p className="font-semibold">{u.nombre}</p>
                        <p className="break-all text-xs text-white/60">{u.correo}</p>
                      </td>
                      <td data-label="Rol" className={tdCls}>{ROLE_LABEL[u.rol]}</td>
                      <td data-label="Plan" className={tdCls}>{PLAN_LABEL[u.plan]}</td>
                      <td data-label="Estado" className={tdCls}><EstadoCuentaPill estado={u.estado} /></td>
                      <td data-label="Barrio" className={tdCls}>{u.barrio || '—'}</td>
                      <td data-label="Miembro desde" className={tdCls}>{mesAnio(u.miembroDesde)}</td>
                      <td className="px-4 py-3 text-right max-md:block max-md:px-0 max-md:pb-0 max-md:pt-3">
                        <button type="button" disabled={busy} onClick={() => setCambio({ user: u, to: u.estado === 'BLOQUEADA' ? 'ACTIVA' : 'BLOQUEADA' })}
                          aria-label={`Cambiar estado de ${u.nombre}`}
                          className="whitespace-nowrap rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 max-md:w-full">
                          Cambiar estado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
      </div>

      <ConfirmDialog open={!!cambio} busy={busy} danger={cambio?.to === 'BLOQUEADA'}
        title={cambio ? `Estado de ${cambio.user.nombre}` : ''}
        confirmLabel={cambio ? `Cambiar a ${ESTADO_CUENTA_LABEL[cambio.to]}` : ''}
        onCancel={() => setCambio(null)} onConfirm={() => cambio && aplicar(cambio)}>
        {cambio && (
          <fieldset>
            <legend className="text-white/75">Hoy está {ESTADO_CUENTA_LABEL[cambio.user.estado]}. Elige el nuevo estado:</legend>
            <div role="radiogroup" aria-label="Nuevo estado" className="mt-3 flex flex-col gap-2">
              {ESTADOS_CUENTA.filter((s) => s !== cambio.user.estado).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={cambio.to === s} onClick={() => setCambio({ ...cambio, to: s })}
                  className={`rounded-xl border px-4 py-3 text-left ${cambio.to === s ? 'border-arena bg-arena/10' : 'border-white/20 hover:bg-white/5'}`}>
                  <span className="block font-semibold text-blanco">{cambio.to === s && <span aria-hidden="true">✓ </span>}{ESTADO_CUENTA_LABEL[s]}</span>
                  <span className="block text-xs text-white/65">{ESTADO_CUENTA_AYUDA[s]}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </ConfirmDialog>
    </section>
  )
}
