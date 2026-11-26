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
  BUYER: [['/perfil', 'Mi cuenta'], ['/playlists', 'Mis playlists'], ['/segunda-mano', 'Mis publicaciones (Segunda mano)'], ['/donar', 'Donar a fundación'], ['/alertas', 'Mis búsquedas y alertas'], ['/avisos/preferencias', 'Preferencias de avisos'], ['/planes', 'Mi plan']],
  STORE_ADMIN: [['/tienda/inventario', 'Mi tienda'], ['/donar', 'Donar a fundación'], ['/tienda/suscripcion', 'Mi suscripción'], ['/avisos/preferencias', 'Preferencias de avisos']],
  FOUNDATION_REPRESENTATIVE: [['/fundacion', 'Mi fundación'], ['/fundacion/donaciones', 'Donaciones'], ['/fundacion/estadisticas', 'Estadísticas'], ['/avisos/preferencias', 'Preferencias de avisos']],
  STYLERADAR_ADMIN: [['/admin/estadisticas', 'Estadísticas'], ['/admin/usuarios', 'Usuarios'], ['/admin/pagos', 'Pagos']],
}

export const iniciales = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')

const itemCls = 'block w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--sr-text-primary)] hover:bg-[var(--sr-bg-2,var(--color-surface-muted))] focus:bg-[var(--sr-bg-2,var(--color-surface-muted))]'

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
        className={`flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 text-sm text-[var(--sr-hero-text)] transition hover:bg-[var(--sr-surface)]/70 ${user.role === 'STYLERADAR_ADMIN' ? 'border-arena/60' : 'border-[var(--sr-border-control)]'}`}
      >
        <span aria-hidden="true" className={`grid h-8 w-8 flex-none place-items-center rounded-full text-[11px] font-bold ${avatarCls(user.role)}`}>{iniciales(user.name)}</span>
        <span aria-hidden="true" className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block max-w-28 truncate font-semibold">{firstName}</span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--sr-hero-text-muted)]">
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: ROLE_DOT[user.role] }} />{ROLE_LABEL[user.role]}
          </span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" className={`text-[var(--sr-hero-text-muted)] transition ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label="Mi cuenta" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-[var(--sr-border-subtle)] bg-[var(--sr-surface-raised)] p-1.5 text-[var(--sr-text-primary)] shadow-2xl">
          <div className="flex items-center gap-3 border-b border-[var(--sr-border-subtle)] px-3 pb-3 pt-2.5">
            <span aria-hidden="true" className={`grid h-10 w-10 flex-none place-items-center rounded-full text-xs font-bold ${avatarCls(user.role)}`}>{iniciales(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--sr-text-primary)]">{user.name}</p>
              <p className="truncate text-xs text-[var(--sr-text-secondary)]">{user.email}</p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--sr-border-subtle)] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[.12em] text-[var(--sr-text-primary)]">
                <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: ROLE_DOT[user.role] }} />{ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <div className="py-1.5">
            {ITEMS[user.role].map(([to, label]) => (
              <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className={itemCls}>{label}</Link>
            ))}
          </div>
          <div className="border-t border-[var(--sr-border-subtle)] pt-1.5"><ThemeSegment /></div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setAskLogout(true) }} className={`${itemCls} mt-0.5 border-t border-[var(--sr-border-subtle)] pt-3 font-semibold text-[var(--sr-bad)]`}>Cerrar sesión</button>
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
