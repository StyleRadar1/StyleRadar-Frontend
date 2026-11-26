[⬅ Volver al README Principal](../../README.md)

---

## <img src="https://img.shields.io/badge/SECCIÓN_01-5600EF?style=for-the-badge" height="20" align="absmiddle" /> 1. ROLES, MÓDULOS, EQUIPOS Y MAPA DE RUTAS

La aplicación implementa control de acceso basado en roles (**RBAC**) desde el router principal ([`src/app/router.tsx`](../../src/app/router.tsx)) y [`src/modules/core/types/roles.ts`](../../src/modules/core/types/roles.ts).

### Roles del Sistema y Pantalla de Inicio

| Rol en el Token / Sistema | Etiqueta UI | Ruta de Inicio (`ROLE_HOME`) | Alcance Principal |
| :--- | :--- | :--- | :--- |
| **Visitante (Público)** | Público | `/` | Landing, catálogo público, detalle de prenda, mapa, perfil público de tiendas, playlists, planes y `/legal`. |
| `BUYER` | Usuario | `/catalogo` | Feed personalizado, perchero de recomendaciones, probador virtual IA, segunda vida, donaciones, alertas, chat y pagos. |
| `STORE_ADMIN` | Tienda | `/mi-tienda` | Gestión del almacén, inventario por sedes y tallas, fotos, distintivos automáticos, estadísticas, chat y suscripción. |
| `FOUNDATION_REPRESENTATIVE` | Fundación | `/fundacion` | Gestión de solicitudes de donación, estados logísticos, comprobantes y estadísticas de la fundación. |
| `STYLERADAR_ADMIN` | Admin | `/admin/estadisticas` | Panel lateral administrativo: analítica global, usuarios, verificación de tiendas, fundaciones, moderación, playlists y pagos. |

> [!NOTE]
> Las vistas de gestión de almacén (`/mi-tienda`, `/tienda/inventario`, `/tienda/informacion`, `/tienda/estadisticas`) están protegidas adicionalmente por la guarda `RequireStoreActiveSub`, asegurando que solo operen con suscripción activa (el registro inicial en `/tienda/registro` y la activación en `/tienda/suscripcion` siempre quedan accesibles).

---

### Módulos en `src/modules/` y Equipos de Backend

La base de código está organizada en **10 módulos** alineados con los equipos de StyleRadar:

| Módulo (`src/modules/`) | Equipo de Backend | Microservicios Consumidos (vía API Gateway) | Requerimientos Asociados |
| :--- | :--- | :--- | :--- |
| `identidad/` | **Estación CADche · Identidad** | `ms-auth`, `ms-usuarios` (perfil, tallas, estilos, feed, búsquedas guardadas) | `SR-RF-01` a `06`, `113`, `115` |
| `catalogo/` | **Estación RESTrepo · Catálogo** | `ms-item-catalogo`, `ms-inventario`, `ms-playlist`, `ms-tiendas` | `SR-RF-07` a `16`, `22`, `50` a `61`, `69` a `72`, `74` |
| `mapa/` | **Estación RESTrepo · Catálogo** | `ms-geolocalizacion` y resumen de `ms-item-catalogo` (Mapbox) | `SR-RF-17` a `21`, `28` |
| `experiencia/` | **Estación Portal 8080 · Probador Virtual y Donaciones** | `ms-probador-virtual`, `ms-segunda-vida-donaciones` | `SR-RF-23` a `27`, `33` a `39`, `42` a `49`, `107` a `109` |
| `transacciones/` | **NQS · Pagos y Estadísticas** | `ms-pagos-suscripciones` (Mercado Pago) | `SR-RF-67`, `68`, `75`, `93` a `103` |
| `soporte/` | **Estación Guatoque Jiraguas** y **NQS** | `ms-notificaciones`, `ms-chat`, `RabbitMQ` y `ms-estadisticas` | `SR-RF-29` a `32`, `40`, `41`, `73`, `76` a `91` |
| `administracion/` | **Transversal (Admin)** | `ms-tiendas`, `ms-usuarios`, `ms-item-catalogo`, `ms-playlist`, `ms-pagos-suscripciones`, `ms-segunda-vida-donaciones` | `SR-RF-62` a `66`, `119`, `120` |
| `legal/` | **Transversal (Legal)** | Cumplimiento normativo colombiano, cookies, PQRS y Centro de Ayuda | Marco Ley 1581 / Ley 1480 / SIC |
| `core/` y `landing/` | **Base Común** | API Gateway (`api-gateway`), Auth refresh, Design System, Temas A11y y Errores | Infraestructura transversal |

---

### Mapa Completo de Rutas Activas (46 Páginas)

<details>
<summary><b>Click para ver la matriz completa de rutas por grupo de acceso</b></summary>

<br>

#### Rutas Públicas y Legales

| Ruta | Pantalla / Componente | Observaciones |
| :--- | :--- | :--- |
| `/` | `LandingPage` | Portada principal y modal de acceso (`/?login`). `/login` redirige a `/?login`. |
| `/registro` | `RegisterPage` | Registro de usuario, tienda o fundación con consentimientos legales desglosados. |
| `/catalogo`, `/catalogo/:id` | `CatalogPage`, `ItemDetailPage` | Perchero recomendado, catálogo filtrable, feed *Para ti*, detalle y reserva de talla. |
| `/mapa` | `MapPage` | Mapa interactivo de tiendas y fundaciones con radio en km (Mapbox GL). |
| `/tiendas/:id`, `/tienda/:id` | `StorePage` | Perfil público de almacén aliado, novedades y catálogo propio. |
| `/playlists`, `/playlists/:id`, `/playlist/:id`, `/perfil/playlists` | `PlaylistsPage` | Exploración y gestión de playlists de moda. |
| `/planes`, `/pago/resultado`, `/suscripcion` | `PlansPage`, `CheckoutPage` | Consulta de planes y resultado de checkout de suscripción. |
| `/legal`, `/legal/pqrs`, `/legal/centro-ayuda`, `/legal/:slug` | `LegalIndexPage`, `PqrsPage`, `HelpCenterPage`, `LegalDocumentPage` | Directorio legal (18 documentos), formulario de PQRS con radicado y centro de ayuda. |
| `/probador`, `/probador/arma-tu-look` | `ProbadorVirtualPage` | Acceso al armador de looks y enlace al probador avanzado. |
| `/segunda-mano` | `SecondHandPage` | Exploración de prendas de segunda vida. |

#### Rutas Protegidas por Rol

| Rol / Guarda | Rutas |
| :--- | :--- |
| `BUYER` | `/perfil`, `/perfil/pagos`, `/probador/avanzado`, `/donar`, `/alertas` |
| `BUYER` \| `STORE_ADMIN` | `/segunda-mano/publicar`, `/segunda-mano/:id/editar`, `/donar` |
| `BUYER` \| `STORE_ADMIN` \| `FOUNDATION_REPRESENTATIVE` | `/avisos/preferencias` |
| Cualquier rol autenticado (`ANY`) | `/mensajes` |
| `STORE_ADMIN` (con `RequireStoreActiveSub`) | `/mi-tienda`, `/tienda/inventario`, `/tienda/informacion`, `/tienda/estadisticas` |
| `STORE_ADMIN` (siempre accesibles) | `/tienda/registro`, `/tienda/suscripcion`, `/tienda/suscripcion/activar` |
| `FOUNDATION_REPRESENTATIVE` | `/fundacion`, `/fundacion/donaciones`, `/fundacion/estadisticas` |
| `STYLERADAR_ADMIN` (`AdminLayout`) | `/admin` (redirige a `/admin/estadisticas`), `/admin/estadisticas`, `/admin/usuarios`, `/admin/usuarios/:id`, `/admin/tiendas`, `/admin/tiendas/:id`, `/admin/fundaciones`, `/admin/fundaciones/:id`, `/admin/moderacion`, `/admin/playlists`, `/admin/pagos` |
| Solo en desarrollo (`import.meta.env.DEV`) | `/dev/errores` (`ErroresDemo`: vitrina de ilustraciones y estados de error) |

</details>

---

[⬅ Volver al README Principal](../../README.md)
