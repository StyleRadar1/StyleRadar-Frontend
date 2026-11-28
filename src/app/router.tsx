import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROLE_HOME, type Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
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
import { RouteErrorBoundary } from './RouteErrorBoundary'

// Cada pantalla se carga solo cuando se visita (code splitting por módulo).
const LandingPage = lazy(() => import('@/modules/landing/pages/LandingPage'))
const Home = lazy(() => import('@/modules/inicio/pages/HomePage'))
const Register = lazy(() => import('@/modules/identidad/pages/RegisterPage'))
const Login = lazy(() => import('@/modules/identidad/pages/LoginPage'))
const ResetPassword = lazy(() => import('@/modules/identidad/pages/ResetPasswordPage'))
const Profile = lazy(() => import('@/modules/identidad/pages/ProfilePage'))
const AdminUsers = lazy(() => import('@/modules/identidad/pages/AdminUsersPage'))
const AdminUserDetail = lazy(() => import('@/modules/identidad/pages/AdminUserDetailPage'))
const Catalog = lazy(() => import('@/modules/catalogo/pages/CatalogPage'))
const ItemDetail = lazy(() => import('@/modules/catalogo/pages/ItemDetailPage'))
const MapPage = lazy(() => import('@/modules/mapa/pages/MapPage'))
const Store = lazy(() => import('@/modules/catalogo/pages/StorePage'))
const FoundationPublic = lazy(() => import('@/modules/experiencia/pages/FoundationPublicPage'))
const Inventory = lazy(() => import('@/modules/catalogo/pages/InventoryPage'))
const MyStore = lazy(() => import('@/modules/catalogo/pages/MiTiendaPage'))
const StoreInfo = lazy(() => import('@/modules/catalogo/pages/StoreInfoPage'))
const StoreRegister = lazy(() => import('@/modules/catalogo/pages/StoreRegisterPage'))
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
const AvisosBandeja = lazy(() => import('@/modules/soporte/pages/NotificationsPage'))
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
    <RequireRole roles={['STORE_ADMIN']}>
      <RequireStoreActiveSub>{el}</RequireStoreActiveSub>
    </RequireRole>,
  )

const USER: Role[] = ['BUYER']
const USER_OR_STORE: Role[] = ['BUYER', 'STORE_ADMIN']
const STORE: Role[] = ['STORE_ADMIN']
const FOUND: Role[] = ['FOUNDATION_REPRESENTATIVE']
const ANY: Role[] = ['BUYER', 'STORE_ADMIN', 'FOUNDATION_REPRESENTATIVE', 'STYLERADAR_ADMIN']

export function Portada() {
  const { user } = useAuth()
  const { search } = useLocation()

  // Durante el inicio de sesión (/?login) el modal lleva a la página guardada o al inicio del rol.
  // Si aquí se redirigiera, esta redirección llegaría después y se perdería la página original.
  if (user && !new URLSearchParams(search).has('login')) return <Navigate to={ROLE_HOME[user.role]} replace />
  // Sin sesión, la portada siempre es el landing. La marca de "landing visto"
  // ya no debe expulsar a /catalogo: el catálogo se abre explícitamente desde
  // los enlaces del landing.
  return page(<LandingPage />)
}

/** Raíz: la bienvenida al iniciar sesión y el fondo aurora a nivel de layout (excepto en rutas excluidas). */
function RootLayout() {
  const { pathname } = useLocation()
  const excluded = isAuroraExcluded(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

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

export const router = createBrowserRouter([{ element: <RootLayout />, errorElement: <RouteErrorBoundary />, children: [
  {
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Públicas
      { path: '/', element: <Portada /> },
      { path: '/login', element: page(<Login />) },
      { path: '/registro', element: page(<Register />) },
      { path: '/restablecer-contrasena', element: page(<ResetPassword />) },
      { path: '/catalogo', element: page(<Catalog />) },
      { path: '/catalogo/:id', element: page(<ItemDetail />) },
      { path: '/mapa', element: page(<MapPage />) },
      { path: '/tiendas/:id', element: page(<Store />) },
      { path: '/tienda/:id', element: page(<Store />) },
      { path: '/fundaciones/:id', element: page(<FoundationPublic />) },
      { path: '/fundacion/:id', element: page(<FoundationPublic />) },
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
      { path: '/inicio', element: only(USER, <Home />) },
      { path: '/perfil', element: only(USER, <Profile />) },
      { path: '/perfil/pagos', element: only(USER, <BuyerPayments />) },
      { path: '/probador', element: only(ANY, <ProbadorVirtual />) },
      { path: '/probador/arma-tu-look', element: only(ANY, <ProbadorVirtual />) },
      { path: '/probador/avanzado', element: only(USER, <TryOn />) },
      { path: '/segunda-mano', element: page(<SecondHand />) },
      { path: '/segunda-mano/publicar', element: only(USER_OR_STORE, <PublishListing />) },
      { path: '/segunda-mano/:id/editar', element: only(USER_OR_STORE, <PublishListing />) },
      { path: '/donar', element: only(USER_OR_STORE, <Donate />) },
      { path: '/alertas', element: only(USER, <Alerts />) },
      { path: '/mensajes', element: only(ANY, <Messages />) },
      { path: '/avisos', element: only(['BUYER', 'STORE_ADMIN', 'FOUNDATION_REPRESENTATIVE'], <AvisosBandeja />) },
      { path: '/avisos/preferencias', element: only(['BUYER', 'STORE_ADMIN', 'FOUNDATION_REPRESENTATIVE'], <AvisosPreferencias />) },
      // Tienda (rutas de gestión y publicación protegidas por RequireStoreActiveSub; suscripción siempre accesible)
      { path: '/mi-tienda', element: onlyStoreActive(<MyStore />) },
      { path: '/tienda/inventario', element: onlyStoreActive(<Inventory />) },
      { path: '/tienda/informacion', element: onlyStoreActive(<StoreInfo />) },
      // F-21: registrar el almacén no exige suscripción (una tienda nueva todavía no la tiene).
      { path: '/tienda/registro', element: only(STORE, <StoreRegister />) },
      { path: '/tienda/estadisticas', element: <Navigate to="/mi-tienda" replace /> },
      { path: '/tienda/suscripcion', element: only(STORE, <StoreSubscription />) },
      { path: '/tienda/suscripcion/activar', element: only(STORE, <StoreActivateSubscription />) },
      // Fundación
      { path: '/fundacion', element: only(FOUND, <FoundationHome />) },
      { path: '/fundacion/donaciones', element: only(FOUND, <Foundation />) },
      { path: '/fundacion/estadisticas', element: <Navigate to="/fundacion" replace /> },
      ...(ErroresDemo ? [{ path: '/dev/errores', element: page(<ErroresDemo />) }] : []),
      { path: '*', element: <NotFound /> },
    ],
  },
  // Administrador: módulo propio con barra lateral (el layout ya exige el rol)
  {
    element: <AdminLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/admin', element: <Navigate to="/admin/estadisticas" replace /> },
      { path: '/admin/estadisticas', element: page(<Stats />) },
      { path: '/admin/usuarios', element: page(<AdminUsers />) },
      { path: '/admin/usuarios/:id', element: page(<AdminUserDetail />) },
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