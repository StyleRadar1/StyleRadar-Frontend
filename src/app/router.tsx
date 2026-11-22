import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@/modules/core/types/roles'
import { NotFound } from '@/modules/core/components/NotFound'
import { SessionExpiredOverlay } from '@/modules/core/components/SessionExpiredOverlay'
import { SinConexion } from '@/modules/core/components/SinConexion'
import { WelcomeOverlay } from '@/modules/core/components/WelcomeOverlay'
import { CookieBanner } from '@/modules/legal/components/CookieBanner'
import { AuroraBackground, isAuroraExcluded } from '@/modules/core/design-system'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { RequireRole } from './RequireRole'
import { RequireStoreActiveSub } from './RequireStoreActiveSub'

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
const StoreActivateSubscription = lazy(() => import('@/modules/transacciones/pages/StoreActivateSubscriptionPage'))
const BuyerPayments = lazy(() => import('@/modules/transacciones/pages/BuyerPaymentsPage'))
const AdminPayments = lazy(() => import('@/modules/transacciones/pages/AdminPaymentsPage'))
const Alerts = lazy(() => import('@/modules/soporte/pages/AlertsPage'))
const Messages = lazy(() => import('@/modules/soporte/pages/MessagesPage'))
const AvisosPreferencias = lazy(() => import('@/modules/soporte/pages/PreferencesPage'))
const Stats = lazy(() => import('@/modules/soporte/pages/StatsPage'))
const AdminStores = lazy(() => import('@/modules/administracion/pages/AdminStoresPage'))
const AdminStoreDetail = lazy(() => import('@/modules/administracion/pages/AdminStoreDetailPage'))
const AdminFoundations = lazy(() => import('@/modules/administracion/pages/AdminFoundationsPage'))
const AdminFoundationDetail = lazy(() => import('@/modules/administracion/pages/AdminFoundationDetailPage'))
const AdminPlaylists = lazy(() => import('@/modules/administracion/pages/AdminPlaylistsPage'))
// Cumplimiento Legal (Colombia)
const LegalIndex = lazy(() => import('@/modules/legal/pages/LegalIndexPage'))
const LegalDocument = lazy(() => import('@/modules/legal/pages/LegalDocumentPage'))
const Pqrs = lazy(() => import('@/modules/legal/pages/PqrsPage'))
const HelpCenter = lazy(() => import('@/modules/legal/pages/HelpCenterPage'))
// Vitrina de las piezas de error: solo en desarrollo, no llega al build de QA ni producción.
const ErroresDemo = import.meta.env.DEV ? lazy(() => import('@/modules/core/pages/ErroresDemo')) : null

const page = (el: ReactNode) => <Suspense fallback={<p className="p-10 text-white/60">Cargando…</p>}>{el}</Suspense>
const only = (roles: Role[], el: ReactNode) => page(<RequireRole roles={roles}>{el}</RequireRole>)
const onlyStoreActive = (el: ReactNode) =>
  page(
    <RequireRole roles={['ADMIN_ALMACEN']}>
      <RequireStoreActiveSub>{el}</RequireStoreActiveSub>
    </RequireRole>,
  )

const USER: Role[] = ['COMPRADOR']
const USER_OR_STORE: Role[] = ['COMPRADOR', 'ADMIN_ALMACEN']
const STORE: Role[] = ['ADMIN_ALMACEN']
const FOUND: Role[] = ['REPRESENTANTE_FUNDACION']
const ANY: Role[] = ['COMPRADOR', 'ADMIN_ALMACEN', 'REPRESENTANTE_FUNDACION', 'ADMIN_STYLERADAR']

/** Raíz: la bienvenida al iniciar sesión y el fondo aurora a nivel de layout (excepto en rutas excluidas). */
function RootLayout() {
  const { pathname } = useLocation()
  const excluded = isAuroraExcluded(pathname)

  return (
    <div className="relative min-h-screen">
      {!excluded && (
        <AuroraBackground
          fixed
        />
      )}
      <div className="relative z-10 min-h-screen">
        <Outlet />
      </div>
      <WelcomeOverlay />
      <SessionExpiredOverlay />
      <SinConexion />
      <CookieBanner />
    </div>
  )
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
      { path: '/tienda/:id', element: page(<Store />) },
      { path: '/playlists', element: page(<Playlists />) },
      { path: '/playlists/:id', element: page(<Playlists />) },
      { path: '/playlist/:id', element: page(<Playlists />) },
      { path: '/perfil/playlists', element: page(<Playlists />) },
      { path: '/planes', element: page(<Plans />) },
      { path: '/pago/resultado', element: page(<Checkout />) },
      { path: '/suscripcion', element: page(<Checkout />) },
      // Cumplimiento Legal y Derechos del Usuario (Colombia)
      { path: '/legal', element: page(<LegalIndex />) },
      { path: '/legal/pqrs', element: page(<Pqrs />) },
      { path: '/legal/centro-ayuda', element: page(<HelpCenter />) },
      { path: '/legal/:slug', element: page(<LegalDocument />) },
      // Usuario (comprador)
      { path: '/perfil', element: only(USER, <Profile />) },
      { path: '/perfil/pagos', element: only(USER, <BuyerPayments />) },
      { path: '/probador', element: page(<ProbadorVirtual />) },
      { path: '/probador/arma-tu-look', element: page(<ProbadorVirtual />) },
      { path: '/probador/avanzado', element: only(USER, <TryOn />) },
      { path: '/segunda-mano', element: page(<SecondHand />) },
      { path: '/segunda-mano/publicar', element: only(USER_OR_STORE, <PublishListing />) },
      { path: '/segunda-mano/:id/editar', element: only(USER_OR_STORE, <PublishListing />) },
      { path: '/donar', element: only(USER_OR_STORE, <Donate />) },
      { path: '/alertas', element: only(USER, <Alerts />) },
      { path: '/mensajes', element: only(ANY, <Messages />) },
      { path: '/avisos/preferencias', element: only(['COMPRADOR', 'ADMIN_ALMACEN', 'REPRESENTANTE_FUNDACION'], <AvisosPreferencias />) },
      // Tienda (rutas de gestión y publicación protegidas por RequireStoreActiveSub; suscripción siempre accesible)
      { path: '/mi-tienda', element: onlyStoreActive(<MyStore />) },
      { path: '/tienda/inventario', element: onlyStoreActive(<Inventory />) },
      { path: '/tienda/informacion', element: onlyStoreActive(<StoreInfo />) },
      { path: '/tienda/estadisticas', element: onlyStoreActive(<StoreStats />) },
      { path: '/tienda/suscripcion', element: only(STORE, <StoreSubscription />) },
      { path: '/tienda/suscripcion/activar', element: only(STORE, <StoreActivateSubscription />) },
      // Fundación
      { path: '/fundacion', element: only(FOUND, <FoundationHome />) },
      { path: '/fundacion/donaciones', element: only(FOUND, <Foundation />) },
      { path: '/fundacion/estadisticas', element: only(FOUND, <Stats />) },
      ...(ErroresDemo ? [{ path: '/dev/errores', element: page(<ErroresDemo />) }] : []),
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