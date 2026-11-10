import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import type { Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { ThemeSelect } from '@/modules/core/theme/ThemeSelect'
import { MessagesLink } from '@/modules/soporte/components/MessagesLink'
import { NotificationBell } from '@/modules/soporte/components/NotificationBell'
import { UserMenu } from './UserMenu'

const LINKS: Record<Role | 'GUEST', [string, string][]> = {
  GUEST: [['/catalogo', 'Catálogo'], ['/mapa', 'Mapa'], ['/playlists', 'Playlists'], ['/planes', 'Planes']],
  COMPRADOR: [['/catalogo', 'Catálogo'], ['/mapa', 'Mapa'], ['/probador', 'Probador'], ['/playlists', 'Playlists'], ['/planes', 'Planes']],
  ADMIN_ALMACEN: [['/tienda/inventario', 'Inventario'], ['/tienda/estadisticas', 'Estadísticas'], ['/tienda/suscripcion', 'Suscripción']],
  REPRESENTANTE_FUNDACION: [['/fundacion', 'Mi fundación'], ['/fundacion/donaciones', 'Donaciones'], ['/fundacion/estadisticas', 'Estadísticas']],
  ADMIN_STYLERADAR: [['/admin/usuarios', 'Usuarios'], ['/admin/moderacion', 'Moderación'], ['/admin/pagos', 'Pagos'], ['/admin/estadisticas', 'Estadísticas']],
}

export function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const links = LINKS[user?.role ?? 'GUEST']
  const esAdmin = user?.role === 'ADMIN_STYLERADAR'
  const linkCls = ({ isActive }: { isActive: boolean }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/10 text-blanco' : 'text-white/75 hover:text-blanco'}`

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-grafito/70 backdrop-blur-xl">
      {esAdmin && (
        <p className="bg-arena px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-grafito">
          <span aria-hidden="true">● </span><b className="uppercase tracking-[.12em]">Modo administrador</b>
          <span className="max-sm:hidden"> · Los cambios afectan a todas las cuentas</span>
        </p>
      )}
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-4" aria-label="Principal">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <Logo className="h-8 w-auto" />StyleRadar
          {esAdmin && <span className="rounded-full bg-arena px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.14em] text-grafito">Admin</span>}
        </Link>
        <div className="ml-auto hidden items-center gap-1 md:flex">
          {links.map(([to, label]) => <NavLink key={to} to={to} end className={linkCls}>{label}</NavLink>)}
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          {/* Con sesión, el tema está en el menú de cuenta. */}
          {!user && <ThemeSelect className="max-md:hidden" />}
          {user ? (
            <>
              {/* RF-73: la tienda (y quien compra o la fundación) responde desde el ícono de mensajes */}
              {user.role !== 'ADMIN_STYLERADAR' && <MessagesLink />}
              {user.role === 'COMPRADOR' && <NotificationBell />}
              <UserMenu />
            </>
          ) : (
            <Link to="/?login" className="rounded-lg bg-violeta px-4 py-2 text-sm font-semibold">Iniciar sesión</Link>
          )}
          <button className="rounded-lg border border-white/20 px-3 py-2 md:hidden" aria-expanded={open} aria-label="Abrir menú" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </nav>
      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          {links.map(([to, label]) => <NavLink key={to} to={to} end className={linkCls} onClick={() => setOpen(false)}>{label}</NavLink>)}
          {!user && <ThemeSelect className="px-3 py-2" />}
        </div>
      )}
    </header>
  )
}
