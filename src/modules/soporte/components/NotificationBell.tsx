import { useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/modules/core/api/apiClient'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { NOTIFICATIONS_CHANGED, notificationService } from '../services/notificationService'
import { abrirCampana } from '../services/notificationStream'
import type { NotificacionDto } from '../types/notification.dto'
import { INFO_AVISO } from '../utils/tiposAviso'
import { IconoAviso } from './IconoAviso'
import './NotificationBell.css'

const hora = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

const FOCO = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sr-focus)]'
/** Botón secundario del manual: borde redondeado, sin relleno. */
const SECUNDARIO = 'inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--sr-border-control)] px-2 text-center text-xs font-semibold text-[var(--sr-text-primary)] transition hover:bg-[var(--sr-surface)]'

/** Campana de línea de 1,6 px (manual de identidad). */
function IconoCampana({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />
    </svg>
  )
}

/** RF-31: campana del menú con el contador de avisos sin leer y el panel de los más recientes. */
export function NotificationBell() {
  const count = useUnreadCount(true)
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<NotificacionDto[] | null>(null)
  const [pagina, setPagina] = useState(0)
  const [hayMas, setHayMas] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)
  const rol = useContext(AuthContext)?.user?.role
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [intento, setIntento] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const navigate = useNavigate()
  // El panel se pinta fuera del encabezado (que tiene `backdrop-blur` y atraparía un elemento fijo) y se coloca bajo la campana.
  // En celular ocupa el ancho de la pantalla; antes se salía por el borde izquierdo y los avisos no se podían leer.
  const [pos, setPos] = useState({ top: 64, right: 12 })
  useLayoutEffect(() => {
    if (!open) return
    const colocar = () => {
      const r = box.current?.getBoundingClientRect()
      // clientWidth y no innerWidth: así no cuenta la barra de desplazamiento y el panel queda alineado con el ícono
      if (r) setPos({ top: Math.round(r.bottom + 8), right: Math.max(12, Math.round(document.documentElement.clientWidth - r.right)) })
    }
    colocar()
    window.addEventListener('resize', colocar)
    window.addEventListener('scroll', colocar, true)
    return () => { window.removeEventListener('resize', colocar); window.removeEventListener('scroll', colocar, true) }
  }, [open])

  // Tiempo real: cada aviso nuevo sube el contador y, si la campana ya cargó, entra arriba sin repetirse
  useEffect(() => abrirCampana((n) => {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
    setList((l) => (l && !l.some((x) => x.id === n.id) ? [n, ...l] : l))
  }), [])

  useEffect(() => {
    if (!open) return
    let active = true
    notificationService.page(0)
      .then((p) => { if (active) { setList(p.items); setPagina(0); setHayMas(p.hasNext); setError('') } })
      .catch(() => { if (active) setError('No pudimos cargar tus avisos. Intenta en unos minutos.') })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      const dentro = e.target as Node
      if (!box.current?.contains(dentro) && !panelRef.current?.contains(dentro)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { active = false; document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [open, intento])

  // Al llegar al final de la lista se piden más avisos, sin botón
  const cargarMas = useCallback(async () => {
    if (cargandoMas || !hayMas) return
    setCargandoMas(true)
    try {
      const p = await notificationService.page(pagina + 1)
      setList((l) => [...(l ?? []), ...p.items.filter((n) => !(l ?? []).some((x) => x.id === n.id))])
      setPagina((n) => n + 1)
      setHayMas(p.hasNext)
    } catch { setHayMas(false) } finally { setCargandoMas(false) }
  }, [cargandoMas, hayMas, pagina])

  const openItem = async (n: NotificacionDto) => {
    setOpen(false)
    if (!n.leida) {
      try { await notificationService.markRead(n.id) } catch (e) {
        // 404 o 403: el aviso ya no está (o no es de esta persona). Se quita sin mostrar su ID
        if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
          setList((l) => l?.filter((x) => x.id !== n.id) ?? l)
          setAviso('Ese aviso ya no está. Actualizamos la lista.')
          setOpen(true)
          return
        }
      }
    }
    if (n.enlace) navigate(n.enlace)
  }
  // Mientras la lista carga se usa el contador general; si tampoco ha llegado, no se afirma nada (nunca «al día» sin saberlo)
  const sinLeer = list ? list.filter((n) => !n.leida).length : count
  const subtitulo = sinLeer > 0 ? `${sinLeer} sin leer` : list ? 'Estás al día' : 'Buscando tus avisos…'
  const readAll = async () => {
    try {
      await notificationService.markAllRead()
      setList((l) => l?.map((n) => ({ ...n, leida: true })) ?? l)
    } catch { setError('No pudimos marcar tus avisos como leídos. Intenta de nuevo.') }
  }

  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}
        aria-label={count ? `Notificaciones, ${count} sin leer` : 'Notificaciones'}
        className="relative grid h-11 w-11 place-items-center rounded-lg border border-white/20 hover:bg-white/10">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-5 w-5">
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />
        </svg>
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-violeta px-1 text-[11px] font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label="Notificaciones"
          style={{ top: pos.top, '--campana-der': `${pos.right}px` } as CSSProperties}
          className="sr-campana inset-x-3 z-50 max-h-[calc(100dvh-5.5rem)] sm:inset-x-auto sm:right-[var(--campana-der)] sm:w-[24rem]"
        >
          <span aria-hidden="true" className="sr-campana-pico" />

          <div className="sr-campana-cab">
            <span aria-hidden="true" className="sr-campana-icono"><IconoCampana className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-tight text-[var(--sr-text-primary)]">Notificaciones</p>
              <p className={`text-xs ${sinLeer ? 'font-semibold text-[var(--sr-accent-text)]' : 'text-[var(--sr-text-secondary)]'}`}>
                {subtitulo}
              </p>
            </div>
            {sinLeer > 0 && (
              <button type="button" onClick={readAll} className={`min-h-11 shrink-0 rounded-full px-3 text-xs font-semibold text-[var(--sr-accent-text)] underline-offset-2 hover:underline ${FOCO}`}>
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="sr-campana-cuerpo" onScroll={(e) => { const t = e.currentTarget; if (t.scrollTop + t.clientHeight >= t.scrollHeight - 48) void cargarMas() }}>
            {aviso && <p role="status" className="mb-2 rounded-xl bg-[var(--sr-info-bg)] px-3 py-2 text-xs text-[var(--sr-text-primary)]">{aviso}</p>}

            {error ? (
              <div role="alert" className="m-1 flex flex-col items-start gap-2 rounded-2xl bg-[var(--sr-bad-bg)] p-3 text-sm text-[var(--sr-text-primary)]">
                <p>{error}</p>
                <button type="button" onClick={() => { setError(''); setList(null); setIntento((n) => n + 1) }}
                  className={`inline-flex min-h-11 items-center rounded-full border border-[var(--sr-border-control)] px-4 text-xs font-semibold ${FOCO}`}>
                  Reintentar
                </button>
              </div>
            ) : !list ? (
              <div role="status" aria-label="Cargando notificaciones" className="space-y-3 p-2">
                <span className="sr-only">Cargando…</span>
                {[0, 1, 2].map((i) => (
                  <div key={i} aria-hidden="true" className="flex items-start gap-3">
                    <span className="sr-campana-esqueleto h-9 w-9 shrink-0 !rounded-full" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="sr-campana-esqueleto h-3 w-3/4" />
                      <div className="sr-campana-esqueleto h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !list.length ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <span aria-hidden="true" className="sr-campana-icono sr-campana-icono--grande"><IconoCampana className="h-6 w-6" /></span>
                <p className="font-bold text-[var(--sr-text-primary)]">Sin notificaciones</p>
                <p className="text-sm text-[var(--sr-text-secondary)]">Aquí te avisaremos cuando vuelva una prenda o llegue algo que buscas.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {list.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => openItem(n)} disabled={!n.enlace && n.leida}
                      data-sin-leer={n.leida ? undefined : ''}
                      className={`sr-campana-fila ${FOCO}`}>
                      <span title={INFO_AVISO[n.tipo].titulo} aria-hidden="true" className="sr-campana-chip"><IconoAviso tipo={n.tipo} className="h-[18px] w-[18px]" /></span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-snug ${n.leida ? 'font-medium text-[var(--sr-text-secondary)]' : 'font-bold text-[var(--sr-text-primary)]'}`}>
                          {n.titulo}{!n.leida && <span className="sr-only"> (sin leer)</span>}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--sr-text-secondary)]">{n.detalle}</span>
                        <span className="mt-1 block text-xs text-[var(--sr-text-muted)]">{hora.format(new Date(n.creadaEn))}</span>
                      </span>
                      {!n.leida && <i aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--sr-accent)]" />}
                    </button>
                  </li>
                ))}
                {cargandoMas && <li role="status" className="px-3 py-2 text-center text-xs text-[var(--sr-text-muted)]">Cargando más…</li>}
              </ul>
            )}
          </div>

          <div className="sr-campana-pie">
            <Link to="/avisos" onClick={() => setOpen(false)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violeta px-4 text-sm font-semibold text-white transition hover:bg-violeta-claro ${FOCO}`}>
              Ver todas las notificaciones
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <div className={`grid gap-2 ${rol === 'BUYER' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {rol === 'BUYER' && <Link to="/alertas" onClick={() => setOpen(false)} className={`${SECUNDARIO} ${FOCO}`}>Ver búsquedas y alertas</Link>}
              <Link to="/avisos/preferencias" onClick={() => setOpen(false)} className={`${SECUNDARIO} ${FOCO}`}>Preferencias de avisos</Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
