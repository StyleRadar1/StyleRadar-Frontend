import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { notificationService } from '../services/notificationService'
import type { NotificacionDto } from '../types/notification.dto'

const hora = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

/** RF-31: campana del menú con el contador de avisos sin leer y el panel de los más recientes. */
export function NotificationBell() {
  const count = useUnreadCount(true)
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<NotificacionDto[] | null>(null)
  const [error, setError] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    let active = true
    notificationService.list()
      .then((l) => { if (active) { setList(l); setError('') } })
      .catch((e) => { if (active) setError(errorMessage(e, 'No pudimos cargar tus avisos.')) })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { active = false; document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [open])

  const openItem = async (n: NotificacionDto) => {
    setOpen(false)
    if (!n.leida) await notificationService.markRead(n.id).catch(() => {})
    if (n.enlace) navigate(n.enlace)
  }
  const readAll = async () => {
    try {
      await notificationService.markAllRead()
      setList((l) => l?.map((n) => ({ ...n, leida: true })) ?? l)
    } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}
        aria-label={count ? `Notificaciones, ${count} sin leer` : 'Notificaciones'}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/20 hover:bg-white/10">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5">
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />
        </svg>
        {count > 0 && (
          <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-violeta px-1 text-[0.6875rem] font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div id={panelId} role="region" aria-label="Notificaciones" className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-grafito p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <p className="font-semibold">Notificaciones</p>
            {!!list?.some((n) => !n.leida) && <button type="button" onClick={readAll} className="text-xs font-semibold underline">Marcar todo como leído</button>}
          </div>
          {error ? <p role="alert" className="px-1 py-3 text-sm text-[#ffb4b4]">{error}</p>
            : !list ? <p role="status" className="px-1 py-3 text-sm text-white/60">Cargando…</p>
            : !list.length ? <p className="px-1 py-3 text-sm text-white/70">Sin notificaciones. Aquí te avisaremos cuando vuelva una prenda o llegue algo que buscas.</p>
            : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {list.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => openItem(n)} className={`w-full rounded-xl p-3 text-left hover:bg-white/5 ${n.leida ? 'text-white/65' : ''}`}>
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {!n.leida && <i aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-violeta-claro" />}
                        {n.titulo}{!n.leida && <span className="sr-only"> (sin leer)</span>}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/70">{n.detalle}</span>
                      <span className="mt-1 block text-[0.6875rem] text-white/45">{hora.format(new Date(n.creadaEn))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          <Link to="/alertas" onClick={() => setOpen(false)} className="mt-2 block rounded-xl border border-white/15 px-3 py-2 text-center text-sm font-semibold">Ver búsquedas y alertas</Link>
        </div>
      )}
    </div>
  )
}
