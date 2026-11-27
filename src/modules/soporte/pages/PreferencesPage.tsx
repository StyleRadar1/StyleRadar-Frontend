import { useRef, useState } from 'react'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { IconoAviso } from '../components/IconoAviso'
import { preferenceService } from '../services/preferenceService'
import type { CanalAviso, PreferenciaAvisoDto, TipoNotificacion } from '../types/notification.dto'
import { INFO_AVISO } from '../utils/tiposAviso'

/** SR-RF-105: por cada tipo de aviso, solo en la plataforma o también por correo. */
export default function PreferencesPage() {
  const { data, loading, error, reload, setData } = useResource(preferenceService.list, [] as PreferenciaAvisoDto[])
  const [busy, setBusy] = useState<TipoNotificacion | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const inFlight = useRef(false)

  const cambiar = async (tipo: TipoNotificacion, correo: boolean) => {
    if (inFlight.current) return
    inFlight.current = true; setBusy(tipo); setMsg(null)
    const canal: CanalAviso = correo ? 'CORREO_Y_PLATAFORMA' : 'SOLO_PLATAFORMA'
    try {
      const fila = await preferenceService.set(tipo, canal)
      setData((l) => l.map((p) => (p.tipo === tipo ? fila : p)))
      setMsg({ ok: true, text: correo ? `Te avisaremos también por correo: ${INFO_AVISO[tipo].titulo.toLowerCase()}.` : `«${INFO_AVISO[tipo].titulo}» llegará solo a la plataforma.` })
    } catch {
      setMsg({ ok: false, text: 'No pudimos guardar el cambio. Intenta en unos minutos.' })
    } finally { inFlight.current = false; setBusy(null) }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 text-[var(--color-text)]">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-sand)]">Tu cuenta</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Preferencias de avisos</h1>
      <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">
        Los avisos siempre llegan a la campana. Elige para cuáles quieres, además, un correo.
      </p>

      {loading ? <Loading label="Cargando tus preferencias…" />
        : error ? <div className="mt-8"><ErrorState error={error} onRetry={reload} title="No pudimos cargar tus preferencias" /></div>
        : (
          <>
            {msg && (
              <p role={msg.ok ? 'status' : 'alert'} className={`mt-6 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'}`}>
                {msg.text}
              </p>
            )}
            <ul className="mt-6 space-y-3" aria-label="Tipos de aviso">
              {data.map((p) => {
                const info = INFO_AVISO[p.tipo]
                const correo = p.canal === 'CORREO_Y_PLATAFORMA'
                return (
                  <li key={p.tipo} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violeta/15 text-[var(--color-accent)]">
                      <IconoAviso tipo={p.tipo} className="h-5 w-5" />
                    </span>
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold">{info.titulo}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{info.descripcion}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={correo}
                      aria-label={`Recibir por correo: ${info.titulo}`}
                      disabled={busy === p.tipo}
                      onClick={() => cambiar(p.tipo, !correo)}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold disabled:opacity-60 sm:min-h-9 sm:px-3 ${correo ? 'border-arena bg-arena text-grafito' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'}`}
                    >
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${correo ? 'bg-grafito' : 'bg-[var(--color-text-muted)]'}`} />
                      {correo ? 'Correo y plataforma' : 'Solo plataforma'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
    </section>
  )
}
