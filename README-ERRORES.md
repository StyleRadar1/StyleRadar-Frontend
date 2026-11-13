# Flujo de errores — Unificación en `Flujo_De_Errores`

Resumen completo del flujo de errores unificado en la rama **`Flujo_De_Errores`** a partir del trabajo de todo el equipo (**Cristian**, **Daniel** y **Carlos**), cómo se unificaron los componentes compartidos y dónde verificar cada caso en el frontend (con `?mock=...` cuando `VITE_USE_MOCKS=true`) y contra el API Gateway.

> Nota sobre `?mock=`: los escenarios de prueba aplican únicamente mientras `?mock=...` esté en la URL actual (en la barra superior aparece **`Simulación activa: ?mock=...`** con el botón **`Quitar simulación`** para limpiarlo). Al navegar a una URL sin `?mock=` la simulación se desactiva automáticamente.

---

## Ramas integradas en `Flujo_De_Errores`

### 1. Ramas de Cristian (7 ramas)
- `origin/feature/Core_Errores_E`: base de `EscenaError`, ilustraciones grandes animadas (`Perchero`, `Tornamesa`, `Etiqueta`, `Maniqui` y `errores.css`), `ErrorBoundary`, `useToast`, `useColaReintento`, `useSesionExpirada`, vista de prueba `/dev/errores` (`ErroresDemo`) y manejo de `ApiError` / campos por formulario.
- `origin/feature/InicioDeSesion_E`: errores en login, registro y recuperación de contraseña (`400` validaciones, `401`, `403` cuenta suspendida, `409` correo duplicado, `429` límite de intentos).
- `origin/feature/PerfilUsuario_E`: errores en perfil de usuario, cambio de barrio/datos y foto (`400`, `401`, `404`, `500` con subida/reintento).
- `origin/feature/PerfilAdmin_E`: estados de error del perfil de administración (usuarios, resumen y configuración general).
- `origin/feature/Planes_E`: errores al consultar o seleccionar planes y validaciones de cambio de suscripción.
- `origin/feature/Pagos_E`: errores de pasarela, método de pago y reintento/confirmación en flujo de suscripción.
- `origin/feature/Playlist_E`: errores al consultar, crear o modificar playlists del usuario (`400`, `403`, `404`, `409`).

### 2. Rama de Daniel (1 rama)
- `origin/feature/flujo-errores-daniel`: flujo de errores completo para la **experiencia del comprador** (radar/catálogo, detalle de prenda, reseñas, mensajes y solicitudes), incluyendo 22 escenarios `?mock=...` dedicados en `mockScenario.ts` y soporte de `ApiError.code`.

### 3. Ramas de Carlos (5 ramas)
- `feature/carlos-core-errores-ui`: componentes reutilizables (`ErrorScene`, `ErrorCard`, `FieldError`, `ErrorBanner`, `ErrorToast`, `SessionExpiredOverlay`, `ErrorState`, `MockBanner`) y escenarios `limite` (`429`) y `regla` (`422`).
- `feature/carlos-segunda-mano-donaciones-errores`: errores en segunda mano y donaciones.
- `feature/carlos-perfil-fundacion-errores`: errores en el panel de fundación (`/fundacion`).
- `feature/carlos-perfil-tienda-errores`: errores en inventario, mi tienda e información de tienda.
- `feature/carlos-perfil-admin-errores`: errores de administración en tiendas, fundaciones, playlists destacadas y moderación.

---

## Criterios de unificación en piezas compartidas

Al consolidar `Core_Errores_E`, `flujo-errores-daniel` y `carlos-core-errores-ui`, se dejaron las versiones más completas y visuales:

- **Ilustraciones grandes (`ErrorScene`, `ErrorCard` y `NotFound`)**:
  - `NotFound` (`*`) usa `EscenaError` con la escena grande del **perchero 404** y enlaces tanto a `/catalogo` (**Volver al catálogo**) como a `/` (**Volver al inicio**).
  - `ErrorScene` y `ErrorCard` (`src/modules/core/components/ErrorScene.tsx`) delegan en las escenas animadas grandes de `./errores/Escenas` (`perchero`, `tornamesa`, `etiqueta`, `maniqui`) y `EscenaError`.
- **`ApiError` (`src/modules/core/api/apiClient.ts`)**:
  - Conserva tanto `fields` (errores de validación por campo de Cristian y Carlos) como `code` (`ErrorCode` de Daniel, ya sea como 3er o 4to argumento).
- **Escenarios simulados (`src/modules/core/api/mockScenario.ts`)**:
  - Incluye todos los escenarios de Carlos/Cristian (`sin-red`, `caido`, `lento`, `sesion-vencida`, `sin-permiso`, `no-existe`, `conflicto`, `duplicado`, `subida-falla`, `limite`, `regla`) más los 22 escenarios de comprador de Daniel y la limpieza automática cuando la URL actual no trae `?mock=`.
- **Sesión vencida global (`src/app/router.tsx`)**:
  - Conserva `/dev/errores` (`ErroresDemo`) para visualizar las escenas grandes de error y mantiene `<SessionExpiredOverlay />` en `RootLayout` junto con `SesionVencida.tsx` compatible.
- **Donaciones y perfil de fundación (`donationService.ts`)**:
  - Combina la validación `400` al intentar donarse a su propia fundación (`/donar`) con las validaciones `403` y `409` en el panel de fundación (`/fundacion`).

---

## Detalle de las ramas de Carlos

### 1. `feature/carlos-core-errores-ui` (base compartida)

Componentes reutilizables y utilidades comunes para todo el flujo de errores:
- **Escenas y tarjetas (`ErrorScene`, `ErrorCard`)**: integradas con las ilustraciones grandes animadas (`Perchero` `404`/`409`, `Tornamesa` `503`/red, `Etiqueta` `401` y `Maniqui` `429`).
- **Microfeedback (`FieldError`, `ErrorBanner`, `ErrorToast`)**: errores por campo con foco al primer campo inválido, banners de permiso/suspensión (`403`) y toasts autocerrables (`409` / `422`).
- **Sesión vencida (`SessionExpiredOverlay`)**: modal `401` global que conserva la ruta de retorno sin abrirse tras cierre voluntario.
- **NotFound & Status (`NotFound`, `ErrorState`, `MockBanner`)**: 404 unificado, renderizado según tipo de error y barra superior con estado y botón para limpiar `?mock=`.
- **Escenarios nuevos en `mockScenario.ts`**: `limite` (`429`) y `regla` (`422`).

| Qué verificar | Ruta en frontend | Endpoint / mecanismo |
|---|---|---|
| Ruta inexistente (404 animado) | `/ruta-no-existe` | Router wildcard `*` |
| Galería de escenas de error | `/dev/errores` | Componente `ErroresDemo` |
| Fallo de red / servidor | `/catalogo?mock=sin-red` | Interceptado en `failIfScenario` |
| Sesión vencida (modal 401) | `/segunda-mano?mock=sesion-vencida` | Evento `sr:sesion-expirada` / HTTP `401` |

---

### 2. `feature/carlos-segunda-mano-donaciones-errores`

Errores en **Segunda mano** y **Donar ropa**:
- **Publicar / editar prenda (`/segunda-mano/publicar`, `/segunda-mano/:id/editar`)**:
  - Validación de fotos (formato, tamaño `<= 5 MB`, límite de cantidad y error `500` de subida con reintento).
  - Validación de título, precio (`> 0`), talla, descripción y carga de prenda `404` / `403` / `409` al editar.
- **Mis publicaciones (`/segunda-mano`)**:
  - Transición `Marcar como vendida`: valida selección de comprador válido y que no sea el mismo vendedor (`400`), bloqueo si ya fue vendida/donada (`409`), y envío de `userId` y `compradorId` como query params.
- **Donar ropa (`/donar`)**:
  - Manejo de auto-donación (`400`), fundación inactiva o categoría no aceptada (`422`), solicitud duplicada (`409`), sesión expirada (`401`) y errores de carga del catálogo de fundaciones.

| Pantalla / acción | Ruta en frontend | Endpoint backend |
|---|---|---|
| Listar / ver / crear / editar prenda | `/segunda-mano`, `/segunda-mano/publicar`, `/segunda-mano/:id/editar` | `GET /api/second-hand/listings`, `GET /api/second-hand/listings/mine`, `GET/PUT /api/second-hand/listings/{id}`, `POST /api/second-hand/listings` |
| Marcar prenda como vendida | `/segunda-mano` (`?mock=conflicto`, `?mock=regla`) | `PATCH /api/v1/segunda-mano/{id}/sell?userId=...&compradorId=...` |
| Cambiar estado (retirar/donar) | `/segunda-mano` | `PATCH /api/second-hand/listings/{id}/status` |
| Enviar donación | `/donar` (`?mock=duplicado`, `?mock=regla`, `?mock=subida-falla`) | `GET /api/donations/foundations`, `POST /api/donations` |

---

### 3. `feature/carlos-perfil-fundacion-errores`

Errores en **Solicitudes de donación** del perfil de fundación:
- **Acceso denegado (`403`)**: `ErrorBanner` cuando la cuenta no pertenece a la fundación (`?mock=sin-permiso`).
- **Conflicto de estado (`409`)**: `ErrorToast` cuando otra fundación ya reclamó la prenda o la entrega es anterior a la fecha acordada, recargando automáticamente la lista (`?mock=conflicto`).
- **Rechazo sin motivo (`422`)**: `FieldError` y foco automático si la justificación tiene menos de `10` caracteres.
- **Solicitud inexistente (`404`)**: estado claro si la solicitud ya no existe.

| Pantalla / acción | Ruta en frontend | Endpoint backend |
|---|---|---|
| Solicitudes de donación | `/fundacion/donaciones` (`?mock=sin-permiso`, `?mock=conflicto`) | `GET /api/donations/foundation/requests`, `PATCH /api/donations/{id}/status` |

---

### 4. `feature/carlos-perfil-tienda-errores`

Errores en **Inventario de la tienda**, **Mi tienda** e **Información de tienda**:
- **Inventario (`/tienda/inventario`)**:
  - Inventario suspendido o sin permisos (`403`) con `ErrorBanner` (`?mock=sin-permiso`).
  - Validaciones `400` / `422`: talla inexistente, stock negativo, precio `<= 0`, intento de eliminar la última talla, prenda retirada (`RETIRADO`), y campos obligatorios al agregar prenda.
  - Recarga segura sin borrar el inventario visible cuando falla una actualización puntual.
- **Mi tienda & Información (`/mi-tienda`, `/tienda/informacion`)**:
  - Validación de portada/galería, dirección, horario, redes/WhatsApp, errores de subida (`?mock=subida-falla`) y aviso de tienda suspendida (`?mock=sin-permiso`).

| Pantalla / acción | Ruta en frontend | Endpoint backend |
|---|---|---|
| Consultar inventario y resumen | `/tienda/inventario` (`?mock=sin-permiso`) | `GET /tienda/inventario`, `GET /tienda/inventario/resumen` |
| Agregar prenda / editar stock / precio / tallas / estado | `/tienda/inventario` (`?mock=regla`, `?mock=sin-permiso`) | `POST /tienda/inventario`, `PATCH /tienda/inventario/{prendaId}/stock`, `PATCH /tienda/inventario/{prendaId}/precio`, `DELETE /tienda/inventario/{prendaId}/tallas/{talla}`, `POST /tienda/inventario/{prendaId}/toggle-estado` |
| Perfil e info pública de tienda | `/mi-tienda`, `/tienda/informacion` (`?mock=sin-permiso`, `?mock=subida-falla`) | Simulación local de perfil/portada (sin endpoint dedicado aún en `inventoryService`) |

---

### 5. `feature/carlos-perfil-admin-errores`

Errores del panel de **Administración**:
- **Detalle y verificación de tiendas (`/admin/tiendas/:id`)**:
  - Motivo de rechazo mínimo 10 caracteres (`400`), tienda ya revisada (`409`), falta de RUT para aprobar o extensión de prueba fuera de periodo gratuito (`422`).
- **Fundaciones (`/admin/fundaciones`, `/admin/fundaciones/:id`)**:
  - Validación de formulario con foco al primer error (`400`), fundación duplicada o ya inactiva (`409`), y recurso inexistente (`404`).
- **Playlists destacadas (`/admin/playlists`)**:
  - Límite máximo de 3 playlists destacadas (`422` en mock real / `409` en simulación `?mock=conflicto`) con toast de advertencia.
- **Moderación de publicaciones (`/admin/moderacion`)**:
  - Motivo de rechazo obligatorio individual o en lote (`400`, `RF-61`) y detección de prenda ya moderada (`422` / `?mock=regla`) con recarga de pendientes.

| Pantalla / acción | Ruta en frontend | Endpoint backend |
|---|---|---|
| Tiendas y verificación / extensión | `/admin/tiendas`, `/admin/tiendas/:id` (`?mock=conflicto`, `?mock=regla`) | `GET /api/admin/tiendas`, `GET /api/admin/tiendas/{id}`, `PUT /api/admin/tiendas/{id}/verificacion`, `POST /api/admin/tiendas/{id}/extender-prueba` |
| Fundaciones (crear/editar/estado) | `/admin/fundaciones`, `/admin/fundaciones/:id` (`?mock=conflicto`, `?mock=regla`) | `GET/POST /api/admin/fundaciones`, `GET/PUT /api/admin/fundaciones/{id}`, `PUT /api/admin/fundaciones/{id}/estado` |
| Playlists destacadas (máx. 3) | `/admin/playlists` (`?mock=conflicto`) | `GET /api/admin/playlists`, `PUT /api/admin/playlists/{id}/destacada` |
| Moderación de prendas | `/admin/moderacion` (`?mock=regla`) | `GET /api/moderacion/pendientes`, `GET /api/moderacion/historial`, `POST /api/moderacion/decidir`, `POST /api/moderacion/decidir-lote` |
