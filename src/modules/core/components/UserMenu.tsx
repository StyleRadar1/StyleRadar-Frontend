import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ROLE_LABEL, type Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { marcarSalidaVoluntaria } from '@/modules/identidad/states/salida'
import { ThemeSegment } from '@/modules/core/theme/ThemeSegment'
import { ROLE_DOT, avatarCls } from './roleTone'

/** Accesos del menú de cuenta según el rol (los mismos del prototipo, con las rutas de la app). */
const ITEMS: Record<Role, [string, string][]> = {
  COMPRADOR: [['/perfil', 'Mi cuenta'], ['/playlists', 'Mis playlists'], ['/segunda-mano', 'Mis publicaciones'], ['/alertas', 'Mis búsquedas y alertas'], ['/planes', 'Mi plan']],
  ADMIN_ALMACEN: [['/tienda/inventario', 'Mi tienda'], ['/tienda/suscripcion', 'Mi suscripción']],
  REPRESENTANTE_FUNDACION: [['/fundacion', 'Mi fundación'], ['/fundacion/donaciones', 'Donaciones'], ['/fundacion/estadisticas', 'Estadísticas']],
  ADMIN_STYLERADAR: [['/admin/estadisticas', 'Estadísticas'], ['/admin/usuarios', 'Usuarios'], ['/admin/pagos', 'Pagos']],
}

export const iniciales = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')

const itemCls = 'block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/85 hover:bg-white/10 focus:bg-white/10'

/** Botón de cuenta (arriba a la derecha): abre un menú con tu nombre, tu rol, tus accesos y cerrar sesión. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
  const navigate = useNavigate()
  const box = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!user) return null
  const firstName = user.name.split(/\s+/)[0]

  return (
    <div ref={box} className="relative flex items-center gap-2">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Mi cuenta: ${user.name}, ${ROLE_LABEL[user.role]}`}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 text-sm hover:bg-white/10 ${user.role === 'ADMIN_STYLERADAR' ? 'border-arena/60' : 'border-white/20'}`}
      >
        <span aria-hidden="true" className={`grid h-8 w-8 flex-none place-items-center rounded-full text-[0.6875rem] font-bold ${avatarCls(user.role)}`}>{iniciales(user.name)}</span>
        <span aria-hidden="true" className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block max-w-28 truncate font-semibold">{firstName}</span>
          <span className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-[.12em] text-white/70">
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: ROLE_DOT[user.role] }} />{ROLE_LABEL[user.role]}
          </span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" className={`text-white/60 transition ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {(user.role === 'ADMIN_ALMACEN' || user.role === 'REPRESENTANTE_FUNDACION') && (
        <button
          type="button"
          onClick={() => setAskLogout(true)}
          className="hidden md:flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-rose-400 hover:bg-rose-500/15 hover:text-rose-200 transition"
          aria-label={user.role === 'ADMIN_ALMACEN' ? 'Cerrar sesión de tienda' : 'Cerrar sesión de fundación'}
          title="Cerrar sesión"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Salir</span>
        </button>
      )}

      {open && (
        <div id={menuId} role="menu" aria-label="Mi cuenta" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/15 bg-grafito p-1.5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-3 pb-3 pt-2.5">
            <span aria-hidden="true" className={`grid h-10 w-10 flex-none place-items-center rounded-full text-xs font-bold ${avatarCls(user.role)}`}>{iniciales(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-white/70">{user.email}</p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2 py-0.5 text-[0.6563rem] font-bold uppercase tracking-[.12em]">
                <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: ROLE_DOT[user.role] }} />{ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <div className="py-1.5">
            {ITEMS[user.role].map(([to, label]) => (
              <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className={itemCls}>{label}</Link>
            ))}
          </div>
          <div className="border-t border-white/10 pt-1.5"><ThemeSegment /></div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setAskLogout(true) }} className={`${itemCls} mt-0.5 border-t border-white/10 pt-3 font-semibold text-[var(--sr-bad)]`}>Cerrar sesión</button>
        </div>
      )}

      {/* En el body: el encabezado tiene backdrop-filter y recortaría un diálogo fixed. */}
      {createPortal(
        <ConfirmDialog
          open={askLogout}
          title="¿Cerrar sesión?"
          confirmLabel="Cerrar sesión"
          cancelLabel="Seguir aquí"
          onConfirm={() => { setAskLogout(false); marcarSalidaVoluntaria(); navigate('/', { replace: true }); logout() }}
          onCancel={() => setAskLogout(false)}
        >
          Tendrás que volver a entrar con tu correo y contraseña.
        </ConfirmDialog>,
        document.body,
      )}
    </div>
  )
}
