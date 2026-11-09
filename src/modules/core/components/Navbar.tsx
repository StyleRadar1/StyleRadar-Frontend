import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/modules/core/design-system'
import { ROLE_LABEL, type Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { ThemeSelect } from '@/modules/core/theme/ThemeSelect'

const LINKS: Record<Role | 'GUEST', [string, string][]> = {
  GUEST: [['/catalogo', 'Catálogo'], ['/mapa', 'Mapa'], ['/playlists', 'Playlists']],
  COMPRADOR: [['/catalogo', 'Catálogo'], ['/mapa', 'Mapa'], ['/probador', 'Probador'], ['/playlists', 'Playlists'], ['/segunda-mano', 'Segunda mano'], ['/mensajes', 'Mensajes']],
  ADMIN_ALMACEN: [['/tienda/inventario', 'Inventario'], ['/tienda/estadisticas', 'Estadísticas'], ['/tienda/suscripcion', 'Suscripción'], ['/mensajes', 'Mensajes']],
  REPRESENTANTE_FUNDACION: [['/fundacion/donaciones', 'Donaciones'], ['/fundacion/estadisticas', 'Estadísticas'], ['/mensajes', 'Mensajes']],
  ADMIN_STYLERADAR: [['/admin/usuarios', 'Usuarios'], ['/admin/moderacion', 'Moderación'], ['/admin/pagos', 'Pagos'], ['/admin/estadisticas', 'Estadísticas']],
}

const DOT: Record<Role, string> = { COMPRADOR: 'bg-violeta-claro', ADMIN_ALMACEN: 'bg-arena', REPRESENTANTE_FUNDACION: 'bg-lavanda', ADMIN_STYLERADAR: 'bg-blanco' }

export function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const links = LINKS[user?.role ?? 'GUEST']
  const linkCls = ({ isActive }: { isActive: boolean }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/10 text-blanco' : 'text-white/75 hover:text-blanco'}`

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-grafito/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-4" aria-label="Principal">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold"><Logo className="h-8 w-auto" />StyleRadar</Link>
        <div className="ml-auto hidden items-center gap-1 md:flex">
          {links.map(([to, label]) => <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>)}
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <ThemeSelect className="max-md:hidden" />
          {user ? (
            <>
              <span className="hidden items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider sm:inline-flex">
                <i className={`h-2 w-2 rounded-full ${DOT[user.role]}`} />{ROLE_LABEL[user.role]}
              </span>
              <button onClick={logout} className="rounded-lg px-3 py-2 text-sm text-white/75 hover:text-blanco">Salir</button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg bg-violeta px-4 py-2 text-sm font-semibold">Iniciar sesión</Link>
          )}
          <button className="rounded-lg border border-white/20 px-3 py-2 md:hidden" aria-expanded={open} aria-label="Abrir menú" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </nav>
      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          {links.map(([to, label]) => <NavLink key={to} to={to} className={linkCls} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <ThemeSelect className="px-3 py-2" />
        </div>
      )}
    </header>
  )
}
