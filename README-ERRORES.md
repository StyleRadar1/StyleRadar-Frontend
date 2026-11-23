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
| Consultar inventario y resumen | `/tienda/inventario` (`?mock=sin-permiso`) | `GET /api/v1/almacenes/{tiendaId}/catalogo`, `GET /api/v1/inventario/sedes/{sedeId}/disponibles`, `GET /api/v1/inventario/prenda/{prendaId}` |
| Agregar prenda / editar stock / precio / tallas / estado | `/tienda/inventario` (`?mock=regla`, `?mock=sin-permiso`) | `POST /api/v1/prendas` + `POST /api/v1/inventario/lote`, `PATCH /api/v1/inventario/prenda/{prendaId}/sede/{sedeId}/tallas/{talla}`, `PUT /api/v1/prendas/{id}`, `DELETE /api/v1/prendas/{id}` |
| Perfil e info pública de tienda | `/mi-tienda`, `/tienda/informacion` (`?mock=sin-permiso`, `?mock=subida-falla`) | Simulación local de perfil/portada (sin endpoint dedicado aún en `inventoryService`) |

---

### 5. `feature/carlos-perfil-admin-errores`

Errores del panel de **Administración**:
- **Detalle y verificación de tiendas (`/admin/tiendas/:id`)**:
  - Motivo de rechazo mínimo 10 caracteres (`400`), tienda ya revisada (`409`), falta de RUT para aprobar o extensión de prueba fuera de periodo gratuito (`422`).
- **Fundaciones (`/admin/fundaciones`, `/admin/fundaciones/:id`)**:
  - Validación de formulario con foco al primer error (`400`), fundación duplicada o ya inactiva (`409`), y recurso inexistente (`404`).
- **Playlists destacadas (`/admin/playlists`)**:
  - Límite máximo de 3 playlists destacadas (`422` en mock real o `code: LIMITE_DESTACADAS` del back / `409` en simulación `?mock=conflicto`) con toast de advertencia.
- **Moderación de publicaciones (`/admin/moderacion`)**:
  - Motivo de rechazo obligatorio individual o en lote (`400`, `code: MOTIVO_REQUERIDO`) y detección de prenda ya moderada (`422`, `code: PRENDA_NO_PENDIENTE` / `?mock=regla`) con recarga de pendientes.

| Pantalla / acción | Ruta en frontend | Endpoint backend |
|---|---|---|
| Tiendas y verificación / extensión | `/admin/tiendas`, `/admin/tiendas/:id` (`?mock=conflicto`, `?mock=regla`) | `GET /api/admin/tiendas`, `GET /api/admin/tiendas/{id}`, `PUT /api/admin/tiendas/{id}/verificacion`, `POST /api/admin/tiendas/{id}/extender-prueba` |
| Fundaciones (crear/editar/estado) | `/admin/fundaciones`, `/admin/fundaciones/:id` (`?mock=conflicto`, `?mock=regla`) | `GET/POST /api/admin/fundaciones`, `GET/PUT /api/admin/fundaciones/{id}`, `PUT /api/admin/fundaciones/{id}/estado` |
| Playlists destacadas (máx. 3) | `/admin/playlists` (`?mock=conflicto`) | `GET /api/v1/playlists/populares`, `PUT/DELETE /api/v1/playlists/{id}/destacar` |
| Moderación de prendas | `/admin/moderacion` (`?mock=regla`) | `GET /api/v1/prendas/pendientes`, `PUT /api/v1/prendas/{id}/moderacion`, `PUT /api/v1/prendas/pendientes/almacenes/{almacenId}/moderacion` (historial en sesión; sin `/historial`) |

---

## Endpoints y errores por pantalla (Catálogo, Mapa, Inventario, Moderación y Playlists — RES-128)

Para validar contra QA con mocks desactivados se usa el modo `qa` (`npm run build:qa` o `.env.qa`) con:

```env
VITE_APP_ENV=qa
VITE_API_URL=https://styleradar-gateway-qa.azurewebsites.net
VITE_USE_MOCKS=false
```

> Nota: `VITE_API_URL` va **sin** `/api/v1` al final, porque `apiClient` ya antepone `/api/v1/...` (y `/api/admin/...` en administración) en cada petición.

Todas las peticiones salen desde `apiClient` (`src/modules/core/api/apiClient.ts`) hacia el **API Gateway**. Cuando el backend responde con un cuerpo `ProblemDetail` (`{ type, title, status, detail, instance, code, timestamp }`, más errores por campo), `aApiError()` prioriza **`MENSAJES_POR_CODIGO[code]`** en `src/modules/core/api/mensajes.ts` y usa el mensaje seguro por estado HTTP (`MENSAJES[kindFromStatus(status)]`) si `code` no llega o no está catalogado. HTTP `401` limpia el token y dispara `sr:sesion-expirada`; las fallas sin respuesta HTTP disparan `avisarSinConexion`.

| Módulo / Pantalla | Ruta frontend | Endpoints reales (API Gateway) | Códigos HTTP y `ProblemDetail.code` | Qué muestra el front |
|---|---|---|---|---|
| **Catálogo** | `/catalogo` | `GET /api/v1/prendas` (`orden=RECIENTES\|REPUTACION\|DISTANCIA`, filtros y `lat`/`lng`) | `400` (`PARAMETRO_INVALIDO`, `DATOS_INVALIDOS`, `RANGO_PRECIO_INVALIDO`, `UBICACION_REQUERIDA`), `500` (`ERROR_INTERNO`), `0` | Si falta ubicación al ordenar por cercanía (`UBICACION_REQUERIDA`), muestra aviso para activar GPS o elegir barrio sin error técnico; estados vacíos diferenciados si no hay prendas en catálogo vs. sin coincidencias con filtros. |
| **Detalle de prenda** | `/catalogo/:id` | `GET /api/v1/prendas/{id}`, `GET /api/v1/prendas/{id}/similares`, `GET /api/v1/inventario/prenda/{prendaId}`, `POST /api/v1/inventario/reserva` | `404` (`PRENDA_NO_ENCONTRADA`, `INVENTARIO_NO_ENCONTRADO`), `409`, `500` (`ERROR_INTERNO`) | `404` de prenda redirige/muestra escena no encontrada; `INVENTARIO_NO_ENCONTRADO` deja el listado de tallas sin marcas erróneas; `409` en reserva deshabilita la talla agotada y explica el motivo. |
| **Tienda pública** | `/tiendas/:id` | `GET /api/v1/stores/{nit}`, `GET /api/v1/almacenes/{id}/catalogo`, `GET /api/v1/almacenes/{id}/novedades`, `GET /api/v1/inventario/prenda/{prendaId}` | `404` (`ALMACEN_NO_ENCONTRADO`, `PRENDA_NO_ENCONTRADA`, `INVENTARIO_NO_ENCONTRADO`), `500` (`ERROR_INTERNO`) | Con `VITE_USE_MOCKS=false` muestra `Loading` real y `ErrorState` con reintento ante fallos sin volver a datos ficticios (`404` muestra «Tienda no encontrada»). El catálogo, tallas y novedades (máx. 3) vienen del backend; si falla inventario puntual cae de forma segura sin romper la página. |
| **Mapa** | `/mapa` | `GET /api/v1/almacenes` (`lat`, `lng`, `radioKm`, `categoriaId`; sin `lat`/`lng` devuelve todas por nombre), `GET /api/v1/fundaciones/cercanas` (`lat`, `lng`, `radioKm`), `GET /api/v1/almacenes/{id}/catalogo/resumen`, `GET /api/v1/almacenes/{id}/distancia` (`lat`, `lng`) | `400` (`PARAMETRO_INVALIDO`, `UBICACION_REQUERIDA`, `COORDENADA_FUERA_DE_RANGO`), `404` (`ALMACEN_NO_ENCONTRADO`), `422` (`COORDENADA_FUERA_DE_RANGO`, `RADIO_INVALIDO`), `500` (`ERROR_INTERNO`) | Validación de coordenadas y radio mediante `ErrorState` o `Aviso` seguro; resumen de hasta 4 prendas sin datos ficticios; estado vacío si no hay puntos o si no hay tiendas dentro del radio. |
| **Inventario de tienda** | `/tienda/inventario` | `GET /api/v1/almacenes/{tiendaId}/catalogo`, `GET /api/v1/inventario/sedes/{sedeId}/disponibles`, `GET /api/v1/inventario/prenda/{prendaId}`, `POST /api/v1/prendas` + `POST /api/v1/inventario/lote`, `PUT /api/v1/prendas/{id}`, `PATCH /api/v1/inventario/prenda/{prendaId}/sede/{sedeId}/tallas/{talla}`, `DELETE /api/v1/prendas/{id}` | `400` (`DATOS_INVALIDOS`, `PARAMETRO_INVALIDO`, `TALLA_INVALIDA`, `CANTIDAD_INVALIDA`), `403` (`ALMACEN_SUSPENDIDO`, `INVENTARIO_SUSPENDIDO`, `ACCESO_DENEGADO`), `404` (`PRENDA_NO_ENCONTRADA`, `INVENTARIO_NO_ENCONTRADO`, `TALLA_NO_REGISTRADA`), `422` (`FOTOGRAFIAS_EXCEDIDAS`, `PRENDA_RETIRADA`, `PRENDA_YA_RETIRADA`), `500` (`ERROR_INTERNO`) | `403` por suspensión muestra banner con enlace directo a `/tienda/suscripcion` sin ocultar la vista ya cargada; `400` marca el campo afectado; `422` avisa mediante toast/banner sin exponer mensajes crudos ni recurrir a datos de prueba. |
| **Moderación** | `/admin/moderacion` | `GET /api/v1/prendas/pendientes`, `PUT /api/v1/prendas/{id}/moderacion`, `PUT /api/v1/prendas/pendientes/almacenes/{almacenId}/moderacion` | `400` (`MOTIVO_REQUERIDO`, `DATOS_INVALIDOS`), `403` (`ACCESO_DENEGADO`), `404` (`PRENDA_NO_ENCONTRADA`, `ALMACEN_NO_ENCONTRADO`), `422` (`PRENDA_NO_PENDIENTE`), `500` (`ERROR_INTERNO`) | Las decisiones se envían sin `moderadorId` (el backend toma el moderador de la sesión autenticada). Exige motivo en rechazos individuales o por almacén (`MOTIVO_REQUERIDO`) debajo del campo; `PRENDA_NO_PENDIENTE` muestra toast y recarga las publicaciones pendientes (el historial vive solo en sesión). |
| **Playlists (usuario)** | `/playlists`, `/playlists/:id` | `GET /api/v1/playlists`, `GET /api/v1/playlists/destacadas`, `GET /api/v1/playlists/me`, `GET /api/v1/playlists/me/guardadas`, `GET /api/v1/playlists/{id}`, `POST /api/v1/playlists`, `PUT /api/v1/playlists/{id}`, `DELETE /api/v1/playlists/{id}`, `POST /api/v1/playlists/{id}/prendas`, `DELETE /api/v1/playlists/{id}/prendas/{prendaId}`, `POST /api/v1/playlists/{id}/like`, `POST /api/v1/playlists/{id}/guardar` | `400` (`DATOS_INVALIDOS`, `PARAMETRO_INVALIDO`), `401` (`USUARIO_NO_AUTENTICADO`), `403` (`PLAYLIST_PRIVADA`, `ACCESO_DENEGADO`), `404` (`PLAYLIST_NO_ENCONTRADA`, `PRENDA_NO_ESTA_EN_PLAYLIST`), `422` (`PLAYLIST_SIN_PRENDAS`, `DESCRIPCION_MUY_LARGA`, `LIMITE_PRENDAS_PLAYLIST`, `PRENDA_YA_EN_PLAYLIST`), `500` (`ERROR_INTERNO`) | Las consultas `/me` y `/me/guardadas` solo se ejecutan cuando existe sesión activa para no disparar `401` a visitantes públicos. `403` y `404` de detalle muestran la escena `Esta playlist no existe o no está disponible.`; `422` de límite muestra contador `15/15` junto al botón. Cada pestaña (`Todas`, `Destacadas`, `Creadas por ti`, `Guardadas`) tiene estado vacío propio y sin datos mock al fallar o venir vacío. |
| **Playlists (admin)** | `/admin/playlists` | `GET /api/v1/playlists/populares`, `PUT /api/v1/playlists/{id}/destacar`, `DELETE /api/v1/playlists/{id}/destacar` | `403` (`ACCESO_DENEGADO`), `404` (`PLAYLIST_NO_ENCONTRADA`), `409` / `422` (`LIMITE_DESTACADAS`), `500` (`ERROR_INTERNO`) | Destacar o quitar destacado está restringido al administrador de StyleRadar (cualquier otro rol recibe `403 ACCESO_DENEGADO`). `LIMITE_DESTACADAS` (409 o 422) muestra aviso de límite máximo de 3 playlists destacadas sin revertir el resto de la tabla. |

### Verificación en QA contra `https://styleradar-gateway-qa.azurewebsites.net`

Consultas verificadas directamente contra el API Gateway de QA:
- `GET /api/v1/prendas` -> `200` (6 prendas aprobadas del `Almacén Pruebas QA`).
- `GET /api/v1/almacenes` -> `200` (funciona sin `lat`/`lng`; devuelve `id: "fc942335-ab30-350a-b6a5-577cf0ca2fb5"`).
- `GET /api/v1/fundaciones/cercanas?lat=4.65&lng=-74.06&radioKm=20` -> `200` (`Fundación Pruebas QA`).
- `GET /api/v1/almacenes/{id}/catalogo`, `/novedades` y `/catalogo/resumen` -> `200` (`totalPrendas: 6`).
- `GET /api/v1/playlists` -> `200` y `GET /api/v1/playlists/destacadas` -> `200` (`[]`).
- `GET /api/v1/stores` y `GET /api/v1/stores/{nit}` (`900555777-1`) -> `200`.

Observaciones del backend detectadas en las respuestas de QA:
- **UUID vs NIT en detalle de tienda**: `ms-geolocalizacion` (`/api/v1/almacenes`) y `ms-item-catalogo` (`/api/v1/prendas`) identifican el almacén por UUID (`fc942335-ab30-350a-b6a5-577cf0ca2fb5`), mientras `ms-tiendas` (`/api/v1/stores/{nit}`) consulta por NIT (`900555777-1`) y responde `404` si recibe el UUID. En `storePublicService.getByIdAsync`, cuando `/stores/{id}` devuelve `404`, el front busca la ficha base en `GET /api/v1/almacenes` junto al catálogo y novedades (sin llamar `GET /api/v1/almacenes/{id}`).
- **URL de fotografía con espacio en las prendas QA**: `fotografias[0]` viene con `https://raw.githubusercontent.com/JUANNICOLASA Frontend-Style-Radar/...` (falta `/` o tiene espacio entre usuario y repositorio), por lo que el navegador no podrá cargar la imagen mientras no se corrija en los datos de QA.
- **Inventario por prenda en QA**: `GET /api/v1/inventario/prenda/{prendaId}` devolvió `404` para la prenda consultada (`60225941-268e-43ad-ba79-95607298ee75`); las pantallas públicas ya toleran este `404` sin romper la vista.
- **Codificación UTF-8 en `ms-tiendas`**: `GET /api/v1/stores` y `GET /api/v1/stores/900555777-1` devuelven `tradeName: "AlmacÃ©n Pruebas QA"` y `description` con `Ã©` / `Ã³`.
