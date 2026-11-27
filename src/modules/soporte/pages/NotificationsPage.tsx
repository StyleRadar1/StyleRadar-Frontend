import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/modules/core/api/apiClient'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { IconoAviso } from '../components/IconoAviso'
import { notificationService } from '../services/notificationService'
import type { NotificacionDto } from '../types/notification.dto'
import { INFO_AVISO } from '../utils/tiposAviso'

const hora = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
/** Tiempo para arrepentirse: la petición solo se envía pasado este tiempo (el back no tiene «restaurar»). */
export const ESPERA_DESHACER_MS = 5000
const PULSACION_LARGA_MS = 500
const FALLO = 'No se pudo eliminar. Inténtalo de nuevo.'

/**
 * Bandeja completa de avisos. Aquí (y solo aquí; la campana es para mirar rápido) se gestionan:
 * eliminar uno (papelera discreta), varias (modo «Seleccionar») o todas las leídas (menú «⋯»).
 */
export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificacionDto[] | null>(null)
  const [pagina, setPagina] = useState(0)
  const [hayMas, setHayMas] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [ocultas, setOcultas] = useState<Set<string>>(new Set())
  const [seleccion, setSeleccion] = useState<Set<string> | null>(null)
  const [deshacer, setDeshacer] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [menu, setMenu] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [foco, setFoco] = useState<string | null>(null)
  const cola = useRef<Set<string>>(new Set())
  const temporizador = useRef<number | undefined>(undefined)
  const largo = useRef<number | undefined>(undefined)
  const sinClic = useRef(false)
  const centinela = useRef<HTMLLIElement>(null)
  const pedida = useRef(0) // pagina más alta cargada, para recargar hasta ahí

  const cargar = useCallback(async (hasta: number) => {
    try {
      const todos: NotificacionDto[] = []
      let ultima = 0, mas = false
      for (let n = 0; n <= hasta; n++) {
        const p = await notificationService.page(n)
        if (n > 0 && !p.items.length) break
        todos.push(...p.items); ultima = n; mas = p.hasNext
        if (!p.hasNext) break
      }
      // Si la última página quedó vacía y no es la primera, se retrocede
      pedida.current = ultima
      setItems(todos); setPagina(ultima); setHayMas(mas); setError(null)
    } catch (e) { setError(e) }
  }, [])

  useEffect(() => { void cargar(0) }, [cargar])

  const cargarMas = useCallback(async () => {
    if (cargandoMas || !hayMas) return
    setCargandoMas(true)
    try {
      const p = await notificationService.page(pagina + 1)
      setItems((l) => [...(l ?? []), ...p.items.filter((n) => !(l ?? []).some((x) => x.id === n.id))])
      pedida.current = pagina + 1; setPagina((n) => n + 1); setHayMas(p.hasNext)
    } catch { setHayMas(false) } finally { setCargandoMas(false) }
  }, [cargandoMas, hayMas, pagina])

  // Al llegar al final se piden más avisos, sin botón
  useEffect(() => {
    const el = centinela.current
    if (!el || !hayMas || typeof IntersectionObserver === 'undefined') return
    const o = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) void cargarMas() })
    o.observe(el)
    return () => o.disconnect()
  }, [hayMas, cargarMas, items])

  /** Envía lo que esté en cola (una sola petición por ids) y refresca la lista y el contador. */
  const enviar = useCallback(async () => {
    window.clearTimeout(temporizador.current)
    const ids = [...cola.current]
    cola.current.clear()
    setDeshacer(null)
    if (!ids.length) return
    try {
      if (ids.length === 1) await notificationService.remove(ids[0])
      else await notificationService.removeMany(ids)
      // Si se eliminaron menos de las enviadas no es un fallo: se refresca y listo
      await cargar(pedida.current)
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setMsg({ ok: false, texto: FALLO })
    } finally {
      setOcultas((o) => { const n = new Set(o); ids.forEach((i) => n.delete(i)); return n })
    }
  }, [cargar])

  /** Quita las filas al instante y deja 5 s para «Deshacer»; varias eliminaciones seguidas se agrupan. */
  const programar = (ids: string[], texto: string) => {
    if (!ids.length) return
    setMsg(null)
    ids.forEach((i) => cola.current.add(i))
    setOcultas(new Set(cola.current))
    setSeleccion(null)
    setDeshacer(texto)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => void enviar(), ESPERA_DESHACER_MS)
  }

  const cancelarEliminacion = () => {
    window.clearTimeout(temporizador.current)
    cola.current.clear()
    setOcultas(new Set()); setDeshacer(null)
  }

  // Si se sale de la pantalla (o se cierra la pestaña) antes de los 5 s, la eliminación pendiente se envía de inmediato
  useEffect(() => {
    const ahora = () => {
      const ids = [...cola.current]
      if (!ids.length) return
      cola.current.clear()
      window.clearTimeout(temporizador.current)
      void (ids.length === 1 ? notificationService.remove(ids[0]) : notificationService.removeMany(ids)).catch(() => undefined)
    }
    window.addEventListener('pagehide', ahora)
    return () => { window.removeEventListener('pagehide', ahora); ahora() }
  }, [])

  const eliminarLeidas = async () => {
    setConfirmar(false); setMenu(false); setMsg(null)
    try {
      const n = await notificationService.removeRead()
      setMsg({ ok: true, texto: n === 0 ? 'No había notificaciones leídas' : n === 1 ? 'Se eliminó 1 notificación' : `Se eliminaron ${n} notificaciones` })
      await cargar(pedida.current)
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setMsg({ ok: false, texto: FALLO })
    }
  }

  const visibles = (items ?? []).filter((n) => !ocultas.has(n.id))
  const hayLeidas = visibles.some((n) => n.leida)
  const marcadas = seleccion?.size ?? 0

  const alternar = (id: string) => setSeleccion((s) => { const n = new Set(s ?? []); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const abrir = async (n: NotificacionDto) => {
    if (sinClic.current) { sinClic.current = false; return }
    if (seleccion) { alternar(n.id); return }
    if (!n.leida) { try { await notificationService.markRead(n.id); setItems((l) => l?.map((x) => (x.id === n.id ? { ...x, leida: true } : x)) ?? l) } catch { /* se abre igual */ } }
    if (n.enlace) navigate(n.enlace)
  }

  const quitarUna = (n: NotificacionDto) => {
    // El foco pasa a la fila siguiente (o a la anterior si era la última)
    const i = visibles.findIndex((x) => x.id === n.id)
    setFoco((visibles[i + 1] ?? visibles[i - 1])?.id ?? null)
    programar([n.id], 'Notificación eliminada')
  }

  const soltar = () => window.clearTimeout(largo.current)
  const pulsar = (id: string, e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || seleccion) return
    largo.current = window.setTimeout(() => { sinClic.current = true; setSeleccion(new Set([id])) }, PULSACION_LARGA_MS)
  }

  useEffect(() => { if (foco) document.getElementById(`aviso-${foco}`)?.focus() }, [foco, items])

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 text-[var(--color-text)]">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-sand)]">Tu cuenta</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">Notificaciones</h1>

      <div className="mt-6 flex min-h-10 items-center justify-between gap-3 text-sm">
        {seleccion ? (
          <div role="status" aria-live="polite" className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <span className="font-semibold">{marcadas} {marcadas === 1 ? 'seleccionada' : 'seleccionadas'}</span>
            <button type="button" disabled={!marcadas} onClick={() => programar([...seleccion], marcadas === 1 ? 'Notificación eliminada' : `${marcadas} notificaciones eliminadas`)}
              className="inline-flex min-h-11 items-center font-semibold text-[var(--color-danger)] underline-offset-2 hover:underline disabled:opacity-40">Eliminar</button>
            <button type="button" onClick={() => setSeleccion(null)} className="inline-flex min-h-11 items-center font-semibold underline-offset-2 hover:underline">Cancelar</button>
            <span className="ml-auto flex flex-wrap gap-x-4 text-xs text-[var(--color-text-muted)]">
              <button type="button" onClick={() => setSeleccion(new Set(visibles.map((n) => n.id)))} className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">Seleccionar todas las de esta página</button>
              <button type="button" onClick={() => setSeleccion(new Set(visibles.filter((n) => n.leida).map((n) => n.id)))} className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">Seleccionar leídas</button>
            </span>
          </div>
        ) : (
          <>
            <p className="text-[var(--color-text-muted)]">{visibles.length ? 'Tus avisos más recientes primero.' : ''}</p>
            <div className="relative flex items-center gap-3">
              <button type="button" disabled={!visibles.length} onClick={() => setSeleccion(new Set())} className="inline-flex min-h-11 items-center px-2 text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-40">Seleccionar</button>
              <button type="button" aria-label="Más opciones" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}
                className="grid h-11 w-11 place-items-center rounded-lg text-lg leading-none hover:bg-[var(--color-surface)]">⋯</button>
              {menu && (
                <div role="menu" className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
                  <button type="button" role="menuitem" disabled={!hayLeidas} onClick={() => { setMenu(false); setConfirmar(true) }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5">Eliminar leídas</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'}`}>{msg.texto}</p>}

      {error ? <div className="mt-8"><ErrorState error={error} onRetry={() => void cargar(0)} title="No pudimos cargar tus notificaciones" /></div>
        : !items ? <Loading label="Cargando tus notificaciones…" />
        : !visibles.length ? <p className="mt-10 text-center text-[var(--color-text-muted)]">No tienes notificaciones</p>
        : (
          <ul className="mt-4 space-y-2" aria-label="Notificaciones">
            {visibles.map((n) => {
              const conEnlace = !!n.enlace
              const elegida = !!seleccion?.has(n.id)
              return (
                <li key={n.id} onKeyDown={(e) => { if (e.key === 'Delete' && !seleccion) { e.preventDefault(); quitarUna(n) } }}
                  className={`group relative flex items-start gap-3 rounded-2xl border p-3 ${elegida ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'} bg-[var(--color-surface)] ${n.leida ? 'opacity-75' : ''}`}>
                  {seleccion && (
                    <input type="checkbox" checked={elegida} onChange={() => alternar(n.id)} aria-label={`Seleccionar: ${n.titulo}`} className="mt-3 h-4 w-4 shrink-0" />
                  )}
                  <div
                    id={`aviso-${n.id}`} tabIndex={conEnlace || !n.leida || seleccion ? 0 : undefined}
                    role={conEnlace || !n.leida || seleccion ? 'button' : undefined}
                    onClick={() => void abrir(n)} onKeyDown={(e) => { if (e.key === 'Enter') void abrir(n) }}
                    onPointerDown={(e) => pulsar(n.id, e)} onPointerUp={soltar} onPointerLeave={soltar} onPointerCancel={soltar}
                    className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl p-1 text-left ${conEnlace || !n.leida || seleccion ? 'cursor-pointer' : 'cursor-default'}`}>
                    <span aria-hidden="true" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violeta/15 text-[var(--color-accent)]" title={INFO_AVISO[n.tipo].titulo}>
                      <IconoAviso tipo={n.tipo} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {!n.leida && <i aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-violeta-claro" />}
                        {n.titulo}{!n.leida && <span className="sr-only"> (sin leer)</span>}
                      </span>
                      <span className="mt-0.5 block text-sm text-[var(--color-text-muted)]">{n.detalle}</span>
                      <span className="mt-1 block text-[11px] text-[var(--color-text-muted)]">{hora.format(new Date(n.creadaEn))}</span>
                    </span>
                    {conEnlace && !seleccion && <span aria-hidden="true" className="self-center text-[var(--color-text-muted)]">›</span>}
                  </div>
                  {!seleccion && (
                    <button type="button" aria-label="Eliminar notificación" title="Eliminar" onClick={(e) => { e.stopPropagation(); quitarUna(n) }}
                      className="-m-1 grid h-11 w-11 shrink-0 place-items-center text-[var(--color-text-muted)] opacity-0 transition-opacity hover:text-[var(--color-danger)] focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                      </svg>
                    </button>
                  )}
                </li>
              )
            })}
            {hayMas && <li ref={centinela} role="status" className="px-3 py-3 text-center text-xs text-[var(--color-text-muted)]">{cargandoMas ? 'Cargando más…' : ''}</li>}
          </ul>
        )}

      {deshacer && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm shadow-2xl">
          <span>{deshacer}</span>
          <button type="button" onClick={cancelarEliminacion} className="font-semibold underline-offset-2 hover:underline">Deshacer</button>
        </div>
      )}

      {confirmar && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="conf-t" className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p id="conf-t" className="font-semibold">¿Eliminar las notificaciones leídas? Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex justify-end gap-4 text-sm">
              <button type="button" autoFocus onClick={() => setConfirmar(false)} className="font-semibold underline-offset-2 hover:underline">Cancelar</button>
              <button type="button" onClick={() => void eliminarLeidas()} className="font-semibold text-[var(--color-danger)] underline-offset-2 hover:underline">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
