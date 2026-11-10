import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ROLE_LABEL, type Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'

/** Accesos del menú de cuenta según el rol (los mismos del prototipo, con las rutas de la app). */
const ITEMS: Record<Role, [string, string][]> = {
  COMPRADOR: [['/perfil', 'Mi cuenta'], ['/playlists', 'Mis playlists'], ['/mensajes', 'Mensajes'], ['/segunda-mano', 'Mis publicaciones'], ['/alertas', 'Mis búsquedas y alertas'], ['/planes', 'Mi plan']],
  ADMIN_ALMACEN: [['/tienda/inventario', 'Mi tienda'], ['/mensajes', 'Mensajes'], ['/tienda/suscripcion', 'Mi suscripción']],
  REPRESENTANTE_FUNDACION: [['/fundacion/donaciones', 'Mis donaciones'], ['/fundacion/estadisticas', 'Estadísticas'], ['/mensajes', 'Mensajes']],
  ADMIN_STYLERADAR: [['/admin/estadisticas', 'Estadísticas'], ['/admin/usuarios', 'Usuarios'], ['/admin/pagos', 'Pagos']],
}

export const iniciales = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')

const itemCls = 'block w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/85 hover:bg-white/10 focus:bg-white/10'

/** Botón de cuenta (arriba a la derecha): abre un menú con tu nombre, tu rol, tus accesos y cerrar sesión. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
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
    <div ref={box} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Mi cuenta: ${user.name}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/20 py-1 pl-1 pr-3 text-sm font-semibold hover:bg-white/10"
      >
        <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-violeta text-[11px] font-bold text-white">{iniciales(user.name)}</span>
        <span className="hidden max-w-28 truncate sm:inline">{firstName}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" className={`text-white/60 transition ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label="Mi cuenta" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/15 bg-grafito p-1.5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-3 pb-3 pt-2.5">
            <span aria-hidden="true" className="grid h-10 w-10 flex-none place-items-center rounded-full bg-violeta text-xs font-bold text-white">{iniciales(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-white/60">{ROLE_LABEL[user.role]} · {user.email}</p>
            </div>
          </div>
          <div className="py-1.5">
            {ITEMS[user.role].map(([to, label]) => (
              <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className={itemCls}>{label}</Link>
            ))}
          </div>
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
          onConfirm={() => { setAskLogout(false); logout() }}
          onCancel={() => setAskLogout(false)}
        >
          Tendrás que volver a entrar con tu correo y contraseña.
        </ConfirmDialog>,
        document.body,
      )}
    </div>
  )
}
