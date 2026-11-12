import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { LockIcon } from '../components/LockIcon'
import { alertService } from '../services/alertService'
import { alertasActivas, PLAN_LABEL, type AlertasResumenDto } from '../types/notification.dto'

const EMPTY: AlertasResumenDto = { plan: 'RADAR', limiteAlertas: 3, alertas: [], busquedas: [] }
const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
const dia = (iso: string) => fecha.format(new Date(`${iso.slice(0, 10)}T12:00:00`))

type Msg = { ok: boolean; text: string; planes?: boolean }
type Remove = { kind: 'alerta' | 'busqueda'; id: string; nombre: string }

/** RF-28 a RF-32 con el bloqueo por plan (P8): en Radar hay máximo 3 alertas activas; en Radar+ no hay límite. */
export default function AlertsPage() {
  const { data, loading, error, reload, setData } = useResource(alertService.summary, EMPTY)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<Msg | null>(null)
  const [remove, setRemove] = useState<Remove | null>(null)
  const inFlight = useRef(false)

  const activas = alertasActivas(data)
  const limite = data.limiteAlertas
  const lleno = limite !== null && activas >= limite

  const toggle = async (kind: Remove['kind'], id: string, on: boolean, nombre: string) => {
    if (inFlight.current) return
    if (on && lleno) {
      setMsg({ ok: false, planes: true, text: `Con el plan ${PLAN_LABEL[data.plan]} puedes tener hasta ${limite} alertas activas. Apaga alguna o pásate a Radar+.` })
      return
    }
    inFlight.current = true; setBusy(id); setMsg(null)
    try {
      if (kind === 'alerta') {
        const a = await alertService.setAlert(id, on)
        setData((d) => ({ ...d, alertas: d.alertas.map((x) => (x.id === id ? a : x)) }))
      } else {
        const s = await alertService.setSearchAlert(id, on)
        setData((d) => ({ ...d, busquedas: d.busquedas.map((x) => (x.id === id ? s : x)) }))
      }
      setMsg({ ok: true, text: on ? `Te avisaremos sobre «${nombre}».` : `Apagaste la alerta de «${nombre}».` })
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e), planes: errorKind(e) === 'datos' })
      if (errorKind(e) === 'conflicto') reload()
    } finally { inFlight.current = false; setBusy(null) }
  }

  const confirmRemove = async () => {
    if (!remove || inFlight.current) return
    inFlight.current = true; setBusy(remove.id); setMsg(null)
    try {
      if (remove.kind === 'alerta') {
        await alertService.removeAlert(remove.id)
        setData((d) => ({ ...d, alertas: d.alertas.filter((x) => x.id !== remove.id) }))
      } else {
        await alertService.removeSearch(remove.id)
        setData((d) => ({ ...d, busquedas: d.busquedas.filter((x) => x.id !== remove.id) }))
      }
      setMsg({ ok: true, text: `Eliminaste «${remove.nombre}».` })
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) })
    } finally { inFlight.current = false; setBusy(null); setRemove(null) }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 text-[var(--color-text)]">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-sand)]">Tu cuenta</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl text-[var(--color-text)]">Búsquedas y alertas</h1>
      <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">Guarda búsquedas desde el catálogo y activa avisos. Te notificamos cuando una tienda tenga disponible lo que esperas.</p>

      {loading ? <Loading label="Cargando tus alertas…" />
        : error ? <div className="mt-8"><ErrorState error={error} onRetry={reload} title="No pudimos cargar tus alertas" /></div>
        : (
          <>
            {limite !== null && (
              <div role="status" aria-label="Uso del plan" className={`mt-8 flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm ${lleno ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
                <LockIcon className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                <p className="min-w-48 flex-1">
                  <b>{Math.min(activas, limite)} de {limite}</b> alertas activas en el plan {PLAN_LABEL[data.plan]}.
                  {lleno && ' Llegaste al límite: con Radar+ no hay límite.'}
                </p>
                <Link to="/planes" className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]">Ver planes</Link>
              </div>
            )}

            {msg && (
              <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'}`}>
                {msg.text} {msg.planes && <Link to="/planes" className="font-semibold underline">Ver planes</Link>}
              </p>
            )}

            <h2 className="mt-10 text-xl font-bold text-[var(--color-text)]">Búsquedas guardadas · {data.busquedas.length}</h2>
            {data.busquedas.length ? (
              <ul className="mt-4 space-y-3" aria-label="Búsquedas guardadas">
                {data.busquedas.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold text-[var(--color-text)]">{s.nombre}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{s.descripcion} · guardada el {dia(s.creadaEn)}</p>
                      {s.coincidenciasNuevas > 0 && <span className="mt-1 inline-block rounded-full bg-[var(--color-sand)]/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-sand)]">{s.coincidenciasNuevas} prendas nuevas</span>}
                    </div>
                    <Link to={`/catalogo?q=${encodeURIComponent(s.nombre)}`} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]">Ver resultados</Link>
                    <Toggle label={`Alerta para ${s.nombre}`} on={s.alerta} locked={!s.alerta && lleno} busy={busy === s.id} onChange={(v) => toggle('busqueda', s.id, v, s.nombre)} />
                    <button type="button" disabled={busy === s.id} onClick={() => setRemove({ kind: 'busqueda', id: s.id, nombre: s.nombre })} className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--color-danger)]" aria-label={`Eliminar ${s.nombre}`}>Eliminar</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState title="Aún no tienes búsquedas guardadas" action={<Link to="/catalogo" className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold text-white">Ir al catálogo</Link>}>
                  En el catálogo, haz una búsqueda y toca «Guardar búsqueda».
                </EmptyState>
              </div>
            )}

            <h2 className="mt-10 text-xl font-bold text-[var(--color-text)]">Prendas agotadas que esperas · {data.alertas.length}</h2>
            {data.alertas.length ? (
              <ul className="mt-4 space-y-3" aria-label="Alertas de prendas">
                {data.alertas.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold text-[var(--color-text)]">{a.prenda}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{a.tienda} · desde el {dia(a.creadaEn)}</p>
                    </div>
                    <Toggle label={`Alerta para ${a.prenda}`} on={a.activa} locked={!a.activa && lleno} busy={busy === a.id} onChange={(v) => toggle('alerta', a.id, v, a.prenda)} />
                    <button type="button" disabled={busy === a.id} onClick={() => setRemove({ kind: 'alerta', id: a.id, nombre: a.prenda })} className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--color-danger)]" aria-label={`Eliminar ${a.prenda}`}>Eliminar</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4"><EmptyState title="No esperas ninguna prenda">En una prenda agotada, toca «Avisarme» y aparecerá aquí.</EmptyState></div>
            )}
          </>
        )}

      <ConfirmDialog open={!!remove} busy={!!remove && busy === remove.id} danger onCancel={() => setRemove(null)} onConfirm={confirmRemove}
        title={remove?.kind === 'busqueda' ? '¿Eliminar la búsqueda guardada?' : '¿Eliminar la alerta?'} confirmLabel="Eliminar">
        {remove?.kind === 'busqueda' ? `«${remove.nombre}» y su alerta dejarán de estar en tu cuenta.` : `Ya no te avisaremos cuando «${remove?.nombre}» vuelva a estar disponible.`}
      </ConfirmDialog>
    </section>
  )
}

/** Interruptor accesible. Con `locked` el plan no permite activarlo: se ve el candado y al tocarlo se explica por qué. */
function Toggle({ label, on, locked, busy, onChange }: { label: string; on: boolean; locked: boolean; busy: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={locked ? `${label} (requiere Radar+)` : label} disabled={busy} onClick={() => onChange(!on)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${on ? 'border-arena bg-arena text-grafito' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'}`}>
      {locked ? <LockIcon className="h-3.5 w-3.5" /> : <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${on ? 'bg-grafito' : 'bg-[var(--color-text-muted)]'}`} />}
      {on ? 'Alerta activa' : locked ? 'Radar+' : 'Alerta apagada'}
    </button>
  )
}
