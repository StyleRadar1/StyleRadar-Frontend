import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/modules/core/types/roles'
import { NotFound } from '@/modules/core/components/NotFound'
import { SessionExpiredOverlay } from '@/modules/core/components/SessionExpiredOverlay'
import { WelcomeOverlay } from '@/modules/core/components/WelcomeOverlay'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { RequireRole } from './RequireRole'

// Cada pantalla se carga solo cuando se visita (code splitting por módulo).
import LandingPage from '@/modules/landing/pages/LandingPage'
const Register = lazy(() => import('@/modules/identidad/pages/RegisterPage'))
const Profile = lazy(() => import('@/modules/identidad/pages/ProfilePage'))
const AdminUsers = lazy(() => import('@/modules/identidad/pages/AdminUsersPage'))
const Catalog = lazy(() => import('@/modules/catalogo/pages/CatalogPage'))
const ItemDetail = lazy(() => import('@/modules/catalogo/pages/ItemDetailPage'))
const MapPage = lazy(() => import('@/modules/mapa/pages/MapPage'))
const Store = lazy(() => import('@/modules/catalogo/pages/StorePage'))
const Inventory = lazy(() => import('@/modules/catalogo/pages/InventoryPage'))
const MyStore = lazy(() => import('@/modules/catalogo/pages/MiTiendaPage'))
const StoreInfo = lazy(() => import('@/modules/catalogo/pages/StoreInfoPage'))
const StoreStats = lazy(() => import('@/modules/catalogo/pages/StoreStatsPage'))
const Playlists = lazy(() => import('@/modules/catalogo/pages/PlaylistsPage'))
const Moderation = lazy(() => import('@/modules/catalogo/pages/ModerationPage'))
const TryOn = lazy(() => import('@/modules/experiencia/pages/TryOnPage'))
const ProbadorVirtual = lazy(() => import('@/modules/experiencia/pages/ProbadorVirtualPage'))
const SecondHand = lazy(() => import('@/modules/experiencia/pages/SecondHandPage'))
const PublishListing = lazy(() => import('@/modules/experiencia/pages/PublishListingPage'))
const Donate = lazy(() => import('@/modules/experiencia/pages/DonatePage'))
const Foundation = lazy(() => import('@/modules/experiencia/pages/FoundationPage'))
const FoundationHome = lazy(() => import('@/modules/experiencia/pages/FoundationHomePage'))
const Plans = lazy(() => import('@/modules/transacciones/pages/PlansPage'))
const Checkout = lazy(() => import('@/modules/transacciones/pages/CheckoutPage'))
const StoreSubscription = lazy(() => import('@/modules/transacciones/pages/StoreSubscriptionPage'))
const AdminPayments = lazy(() => import('@/modules/transacciones/pages/AdminPaymentsPage'))
const Alerts = lazy(() => import('@/modules/soporte/pages/AlertsPage'))
const Messages = lazy(() => import('@/modules/soporte/pages/MessagesPage'))
const Stats = lazy(() => import('@/modules/soporte/pages/StatsPage'))
const AdminStores = lazy(() => import('@/modules/administracion/pages/AdminStoresPage'))
const AdminStoreDetail = lazy(() => import('@/modules/administracion/pages/AdminStoreDetailPage'))
const AdminFoundations = lazy(() => import('@/modules/administracion/pages/AdminFoundationsPage'))
const AdminFoundationDetail = lazy(() => import('@/modules/administracion/pages/AdminFoundationDetailPage'))
const AdminPlaylists = lazy(() => import('@/modules/administracion/pages/AdminPlaylistsPage'))

const page = (el: ReactNode) => <Suspense fallback={<p className="p-10 text-white/60">Cargando…</p>}>{el}</Suspense>
const only = (roles: Role[], el: ReactNode) => page(<RequireRole roles={roles}>{el}</RequireRole>)

const USER: Role[] = ['COMPRADOR']
const STORE: Role[] = ['ADMIN_ALMACEN']
const FOUND: Role[] = ['REPRESENTANTE_FUNDACION']
const ANY: Role[] = ['COMPRADOR', 'ADMIN_ALMACEN', 'REPRESENTANTE_FUNDACION', 'ADMIN_STYLERADAR']

/** Raíz: la bienvenida al iniciar sesión vive aquí para verse aunque se pase del sitio al módulo de administración. */
function RootLayout() {
  return <><Outlet /><WelcomeOverlay /><SessionExpiredOverlay /></>
}

export const router = createBrowserRouter([{ element: <RootLayout />, children: [
  {
    element: <AppLayout />,
    children: [
      // Públicas
      { path: '/', element: <LandingPage /> },
      // Un solo inicio de sesion: el modal del landing (/?login). /login redirige ahi.
      { path: '/login', element: <Navigate to="/?login" replace /> },
      { path: '/registro', element: page(<Register />) },
      { path: '/catalogo', element: page(<Catalog />) },
      { path: '/catalogo/:id', element: page(<ItemDetail />) },
      { path: '/mapa', element: page(<MapPage />) },
      { path: '/tiendas/:id', element: page(<Store />) },
      { path: '/playlists', element: page(<Playlists />) },
      { path: '/playlists/:id', element: page(<Playlists />) },
      { path: '/playlist/:id', element: page(<Playlists />) },
      { path: '/perfil/playlists', element: page(<Playlists />) },
      { path: '/planes', element: page(<Plans />) },
      { path: '/pago/resultado', element: page(<Checkout />) },
      { path: '/suscripcion', element: page(<Checkout />) },
      // Usuario (comprador)
      { path: '/perfil', element: only(USER, <Profile />) },
      { path: '/probador', element: page(<ProbadorVirtual />) },
      { path: '/probador/avanzado', element: only(USER, <TryOn />) },
      { path: '/segunda-mano', element: only(USER, <SecondHand />) },
      { path: '/segunda-mano/publicar', element: only(USER, <PublishListing />) },
      { path: '/segunda-mano/:id/editar', element: only(USER, <PublishListing />) },
      { path: '/donar', element: only(USER, <Donate />) },
      { path: '/alertas', element: only(USER, <Alerts />) },
      { path: '/mensajes', element: only(ANY, <Messages />) },
      // Tienda
      { path: '/mi-tienda', element: only(STORE, <MyStore />) },
      { path: '/tienda/inventario', element: only(STORE, <Inventory />) },
      { path: '/tienda/informacion', element: only(STORE, <StoreInfo />) },
      { path: '/tienda/estadisticas', element: only(STORE, <StoreStats />) },
      { path: '/tienda/suscripcion', element: only(STORE, <StoreSubscription />) },
      // Fundación
      { path: '/fundacion', element: only(FOUND, <FoundationHome />) },
      { path: '/fundacion/donaciones', element: only(FOUND, <Foundation />) },
      { path: '/fundacion/estadisticas', element: only(FOUND, <Stats />) },
      { path: '*', element: <NotFound /> },
    ],
  },
  // Administrador: módulo propio con barra lateral (el layout ya exige el rol)
  {
    element: <AdminLayout />,
    children: [
      { path: '/admin', element: <Navigate to="/admin/estadisticas" replace /> },
      { path: '/admin/estadisticas', element: page(<Stats />) },
      { path: '/admin/usuarios', element: page(<AdminUsers />) },
      { path: '/admin/tiendas', element: page(<AdminStores />) },
      { path: '/admin/tiendas/:id', element: page(<AdminStoreDetail />) },
      { path: '/admin/fundaciones', element: page(<AdminFoundations />) },
      { path: '/admin/fundaciones/:id', element: page(<AdminFoundationDetail />) },
      { path: '/admin/moderacion', element: page(<Moderation />) },
      { path: '/admin/playlists', element: page(<AdminPlaylists />) },
      { path: '/admin/pagos', element: page(<AdminPayments />) },
    ],
  },
] }])
