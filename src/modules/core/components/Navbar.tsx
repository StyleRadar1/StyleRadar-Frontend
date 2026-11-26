import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import { type Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { ThemeSelect } from '@/modules/core/theme/ThemeSelect'
import { MessagesLink } from '@/modules/soporte/components/MessagesLink'
import { NotificationBell } from '@/modules/soporte/components/NotificationBell'
import { UserMenu } from './UserMenu'

const LINKS: Record<Role | 'GUEST', [string, string][]> = {
  GUEST: [['/catalogo', 'Catálogo'], ['/mapa', 'Mapa'], ['/segunda-mano', 'Segunda mano'], ['/playlists', 'Playlists'], ['/planes', 'Planes']],
  BUYER: [['/catalogo', 'Catálogo'], ['/mapa', 'Mapa'], ['/probador', 'Probador'], ['/segunda-mano', 'Segunda mano'], ['/playlists', 'Playlists'], ['/planes', 'Planes']],
  STORE_ADMIN: [['/mi-tienda', 'Mi tienda'], ['/tienda/inventario', 'Inventario'], ['/donar', 'Donaciones'], ['/tienda/estadisticas', 'Estadísticas'], ['/tienda/suscripcion', 'Suscripción']],
  FOUNDATION_REPRESENTATIVE: [['/fundacion', 'Mi fundación'], ['/fundacion/donaciones', 'Donaciones'], ['/fundacion/estadisticas', 'Estadísticas']],
  STYLERADAR_ADMIN: [['/admin/usuarios', 'Usuarios'], ['/admin/moderacion', 'Moderación'], ['/admin/pagos', 'Pagos'], ['/admin/estadisticas', 'Estadísticas']],
}

export function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const links = LINKS[user?.role ?? 'GUEST']
  const esAdmin = user?.role === 'STYLERADAR_ADMIN'
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap px-3.5 py-1.5 text-sm font-medium transition ${
      isActive
        ? 'rounded-full bg-violeta text-white shadow-sm'
        : 'rounded-lg text-[var(--sr-hero-text-muted)] hover:text-[var(--sr-hero-text)] hover:bg-[var(--sr-surface)]/50'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--sr-border-subtle)] bg-[var(--sr-hero-bar)]/85 backdrop-blur-xl transition-colors duration-300">
      {esAdmin && (
        <p className="bg-arena px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-grafito">
          <span aria-hidden="true">● </span><b className="uppercase tracking-[.12em]">Modo administrador</b>
          <span className="max-sm:hidden"> · Los cambios afectan a todas las cuentas</span>
        </p>
      )}
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-4" aria-label="Principal">
        {/* La tienda no tiene el logo que lleva al landing: su inicio es «Mi tienda» en el menú. */}
        {user?.role !== 'STORE_ADMIN' && (
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-[var(--sr-hero-text)]">
            <Logo className="h-8 w-auto" />StyleRadar
            {esAdmin && <span className="rounded-full bg-arena px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.14em] text-grafito">Admin</span>}
          </Link>
        )}
        <div className="ml-auto hidden items-center gap-1 md:flex">
          {links.map(([to, label]) => <NavLink key={to} to={to} end className={linkCls}>{label}</NavLink>)}
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          {/* Con sesión, el tema está en el menú de cuenta; para tienda y fundación se muestra directo en barra */}
          {(!user || user.role === 'STORE_ADMIN' || user.role === 'FOUNDATION_REPRESENTATIVE') && <ThemeSelect className="max-md:hidden" />}
          {user ? (
            <>
              {/* RF-73: la tienda (y quien compra o la fundación) responde desde el ícono de mensajes */}
              {user.role !== 'STYLERADAR_ADMIN' && <MessagesLink />}
              {/* Misma campana para persona, tienda y fundación: los avisos llegan por usuario, no por rol */}
              {user.role !== 'STYLERADAR_ADMIN' && <NotificationBell />}
              <UserMenu />
            </>
          ) : (
            <Link to="/?login" className="rounded-lg bg-violeta px-4 py-2 text-sm font-semibold text-[var(--sr-text-on-accent)]">Iniciar sesión</Link>
          )}
          <button className="rounded-lg border border-[var(--sr-border-control)] text-[var(--sr-hero-text)] px-3 py-2 md:hidden" aria-expanded={open} aria-label="Abrir menú" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </nav>
      {open && (
        <div className="flex flex-col gap-1 border-t border-[var(--sr-border-subtle)] bg-[var(--sr-hero-bar)]/95 px-4 py-3 md:hidden">
          {links.map(([to, label]) => <NavLink key={to} to={to} end className={linkCls} onClick={() => setOpen(false)}>{label}</NavLink>)}
          {(!user || user.role === 'STORE_ADMIN' || user.role === 'FOUNDATION_REPRESENTATIVE') && <ThemeSelect className="px-3 py-2" />}
        </div>
      )}
    </header>
  )
}
