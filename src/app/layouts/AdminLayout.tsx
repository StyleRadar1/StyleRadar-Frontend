import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_CHANGED, adminStoreService } from '@/modules/administracion/services/adminService'
import { moderationService } from '@/modules/catalogo/services/moderationService'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { EnvironmentBanner, MockBanner } from '@/modules/core/components/Status'
import { iniciales } from '@/modules/core/components/UserMenu'
import { Logo } from '@/modules/core/design-system'
import { AppearancePicker } from '@/modules/core/theme'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import { marcarSalidaVoluntaria } from '@/modules/identidad/states/salida'
import { env } from '@/configs/env'
import { RequireRole } from '../RequireRole'
import '@/styles/verdelo-dashboard.css'

const ico = (d: ReactNode) => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">{d}</svg>
const ICONOS = {
  chart: ico(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  users: ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></>),
  store: ico(<><path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6" /></>),
  gift: ico(<><rect x="3" y="8" width="18" height="13" rx="1.5" /><path d="M3 12h18M12 8v13M12 8S10.5 3 8 3.5 7 8 12 8zm0 0s1.5-5 4-4.5S17 8 12 8z" /></>),
  shield: ico(<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />),
  list: ico(<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />),
  card: ico(<><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></>),
  home: ico(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z" />),
  out: ico(<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H3" />),
}

/** Secciones del módulo de administración, en el orden del prototipo. Sin `to` = aún no existe en React. */
const SECCIONES: { to?: string; label: string; icon: keyof typeof ICONOS; badge?: 'publicaciones' | 'tiendas' }[] = [
  { to: '/admin/estadisticas', label: 'Estadísticas', icon: 'chart' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
  { to: '/admin/tiendas', label: 'Tiendas', icon: 'store', badge: 'tiendas' },
  { to: '/admin/fundaciones', label: 'Fundaciones', icon: 'gift' },
  { to: '/admin/moderacion', label: 'Publicaciones', icon: 'shield', badge: 'publicaciones' },
  { to: '/admin/playlists', label: 'Playlists', icon: 'list' },
  { to: '/admin/pagos', label: 'Pagos', icon: 'card' },
]

/**
 * Módulo de administración (el del prototipo): barra lateral con las secciones, barra superior con la ruta
 * y el contenido de cada página. Reemplaza el menú del sitio en todas las rutas /admin.
 */
export function AdminLayout() {
  return (
    <RequireRole roles={['ADMIN_STYLERADAR']}>
      <AdminShell />
    </RequireRole>
  )
}

function AdminShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [pendientes, setPendientes] = useState<{ publicaciones: number; tiendas: number }>({ publicaciones: 0, tiendas: 0 })
  const [salir, setSalir] = useState(false)
  const actual = SECCIONES.find((s) => s.to && pathname.startsWith(s.to))?.label ?? 'Administración'

  // Insignias: publicaciones esperando moderación y tiendas esperando verificación
  useEffect(() => {
    let activo = true
    const cargar = () => {
      moderationService.getPending().then((l) => { if (activo) setPendientes((p) => ({ ...p, publicaciones: l.length })) }).catch(() => {})
      adminStoreService.list().then((l) => { if (activo) setPendientes((p) => ({ ...p, tiendas: l.filter((t) => t.verificacion === 'Pendiente').length })) }).catch(() => {})
    }
    cargar()
    window.addEventListener(ADMIN_CHANGED, cargar)
    return () => { activo = false; window.removeEventListener(ADMIN_CHANGED, cargar) }
  }, [pathname])

  if (!user) return null
  const enlace = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'sr-verdelo-nav-active font-semibold text-blanco' : 'text-white/70 hover:bg-white/5 hover:text-blanco'}`

  const nav = (
    <>
      {SECCIONES.map((s) => {
        const badge = s.badge ? pendientes[s.badge] || null : null
        return s.to ? (
          <NavLink key={s.label} to={s.to} className={enlace}>
            {ICONOS[s.icon]}<span className="flex-1">{s.label}</span>
            {badge && <span className="rounded-full bg-violeta px-2 text-[11px] font-bold text-blanco">{badge}<span className="sr-only"> pendientes</span></span>}
          </NavLink>
        ) : (
          <span key={s.label} aria-disabled="true" className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/35">
            {ICONOS[s.icon]}<span className="flex-1">{s.label}</span><span className="text-[10px] font-bold uppercase tracking-[.12em]">Pronto</span>
          </span>
        )
      })}
    </>
  )

  return (
    <div className="sr-verdelo-shell flex min-h-screen flex-col">
      {env.useMocks && <MockBanner />}
      {env.appEnvironment === 'qa' && <EnvironmentBanner environment="qa" />}
      <div className="flex flex-1">
        {/* Barra lateral */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#181520]/80 backdrop-blur-xl lg:flex">
          <Link to="/admin/estadisticas" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
            <Logo className="h-8 w-auto" />
            <span><b className="block leading-tight">StyleRadar</b><span className="block text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Módulo de administración</span></span>
          </Link>
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violeta text-xs font-bold text-blanco shadow-[0_0_18px_rgba(72,17,154,0.55)]">{iniciales(user.name)}</span>
            <span className="min-w-0"><b className="block truncate text-sm">{user.name}</b><span className="block text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Administrador</span></span>
          </div>
          <nav aria-label="Administración" className="flex-1 space-y-1 overflow-y-auto p-3">{nav}</nav>
          <div className="space-y-1 border-t border-white/10 p-3">
            <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-blanco">{ICONOS.home}Volver al radar</Link>
            <button type="button" onClick={() => setSalir(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/5 hover:text-blanco">{ICONOS.out}Cerrar sesión</button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barra superior */}
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#181520]/75 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-4 md:px-8">
              <Link to="/admin/estadisticas" className="lg:hidden" aria-label="StyleRadar, administración"><Logo className="h-7 w-auto" /></Link>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/60">
                <span className="max-sm:hidden">Administración <span aria-hidden="true">/</span> </span><span className="text-blanco">{actual}</span>
              </p>
              <div className="ml-auto flex items-center gap-2">
                <AppearancePicker />
                <span className="flex items-center gap-2 rounded-full border border-white/15 py-1 pl-1 pr-3">
                  <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-violeta text-[10px] font-bold text-blanco">{iniciales(user.name)}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[.14em]">Admin</span>
                </span>
              </div>
              <button type="button" onClick={() => setSalir(true)} className="rounded-lg px-2 py-1.5 text-sm text-white/70 hover:text-blanco lg:hidden">Salir</button>
            </div>
            {/* En pantallas pequeñas las secciones van en una fila desplazable */}
            <nav aria-label="Administración (móvil)" className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden [&>*]:shrink-0 [&>*]:py-2">{nav}</nav>
          </header>

          <main className="flex-1 px-4 py-8 md:px-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
        </div>
      </div>

      <ConfirmDialog open={salir} title="¿Cerrar sesión?" confirmLabel="Cerrar sesión" cancelLabel="Seguir aquí"
        onConfirm={() => { setSalir(false); marcarSalidaVoluntaria(); navigate('/', { replace: true }); logout() }} onCancel={() => setSalir(false)}>
        Tendrás que volver a entrar con tu correo y contraseña.
      </ConfirmDialog>
    </div>
  )
}
