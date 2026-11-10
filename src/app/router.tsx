import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import type { Role } from '@/modules/core/types/roles'
import { NotFound } from '@/modules/core/components/NotFound'
import { AppLayout } from './layouts/AppLayout'
import { RequireRole } from './RequireRole'

// Cada pantalla se carga solo cuando se visita (code splitting por módulo).
import LandingPage from '@/modules/landing/pages/LandingPage'
const Login = lazy(() => import('@/modules/identidad/pages/LoginPage'))
const Register = lazy(() => import('@/modules/identidad/pages/RegisterPage'))
const Profile = lazy(() => import('@/modules/identidad/pages/ProfilePage'))
const AdminUsers = lazy(() => import('@/modules/identidad/pages/AdminUsersPage'))
const Catalog = lazy(() => import('@/modules/catalogo/pages/CatalogPage'))
const ItemDetail = lazy(() => import('@/modules/catalogo/pages/ItemDetailPage'))
const MapPage = lazy(() => import('@/modules/catalogo/pages/MapPage'))
const Store = lazy(() => import('@/modules/catalogo/pages/StorePage'))
const Inventory = lazy(() => import('@/modules/catalogo/pages/InventoryPage'))
const Playlists = lazy(() => import('@/modules/catalogo/pages/PlaylistsPage'))
const Moderation = lazy(() => import('@/modules/catalogo/pages/ModerationPage'))
const TryOn = lazy(() => import('@/modules/experiencia/pages/TryOnPage'))
const ProbadorVirtual = lazy(() => import('@/modules/experiencia/pages/ProbadorVirtualPage'))
const SecondHand = lazy(() => import('@/modules/experiencia/pages/SecondHandPage'))
const PublishListing = lazy(() => import('@/modules/experiencia/pages/PublishListingPage'))
const Donate = lazy(() => import('@/modules/experiencia/pages/DonatePage'))
const Foundation = lazy(() => import('@/modules/experiencia/pages/FoundationPage'))
const Plans = lazy(() => import('@/modules/transacciones/pages/PlansPage'))
const StoreSubscription = lazy(() => import('@/modules/transacciones/pages/StoreSubscriptionPage'))
const AdminPayments = lazy(() => import('@/modules/transacciones/pages/AdminPaymentsPage'))
const Alerts = lazy(() => import('@/modules/soporte/pages/AlertsPage'))
const Messages = lazy(() => import('@/modules/soporte/pages/MessagesPage'))
const Stats = lazy(() => import('@/modules/soporte/pages/StatsPage'))

const page = (el: ReactNode) => <Suspense fallback={<p className="p-10 text-white/60">Cargando…</p>}>{el}</Suspense>
const only = (roles: Role[], el: ReactNode) => page(<RequireRole roles={roles}>{el}</RequireRole>)

const USER: Role[] = ['COMPRADOR']
const STORE: Role[] = ['ADMIN_ALMACEN']
const FOUND: Role[] = ['REPRESENTANTE_FUNDACION']
const ADMIN: Role[] = ['ADMIN_STYLERADAR']
const ANY: Role[] = ['COMPRADOR', 'ADMIN_ALMACEN', 'REPRESENTANTE_FUNDACION', 'ADMIN_STYLERADAR']

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // Públicas
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: page(<Login />) },
      { path: '/registro', element: page(<Register />) },
      { path: '/catalogo', element: page(<Catalog />) },
      { path: '/catalogo/:id', element: page(<ItemDetail />) },
      { path: '/mapa', element: page(<MapPage />) },
      { path: '/tiendas/:id', element: page(<Store />) },
      { path: '/playlists', element: page(<Playlists />) },
      { path: '/planes', element: page(<Plans />) },
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
      { path: '/tienda/inventario', element: only(STORE, <Inventory />) },
      { path: '/tienda/estadisticas', element: only(STORE, <Stats />) },
      { path: '/tienda/suscripcion', element: only(STORE, <StoreSubscription />) },
      // Fundación
      { path: '/fundacion/donaciones', element: only(FOUND, <Foundation />) },
      { path: '/fundacion/estadisticas', element: only(FOUND, <Stats />) },
      // Administrador
      { path: '/admin/usuarios', element: only(ADMIN, <AdminUsers />) },
      { path: '/admin/moderacion', element: only(ADMIN, <Moderation />) },
      { path: '/admin/pagos', element: only(ADMIN, <AdminPayments />) },
      { path: '/admin/estadisticas', element: only(ADMIN, <Stats />) },
      { path: '*', element: <NotFound /> },
    ],
  },
])
