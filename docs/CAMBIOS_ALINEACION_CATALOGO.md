# Cambios de Alineación Back–Front (Catálogo, Inventario, Geolocalización, Playlists y Errores por `code`)

**Rama:** `feature/carlos-alineacion-back-front` (base: `UNIFICADO-REACT`)  
**Autor:** Carlos Sánchez

---

## 1. Alcance y exclusiones

- **Módulos trabajados:**
  - `src/modules/core`: Soporte transversal de errores `ProblemDetail` (`code` y `timestamp`) en `apiClient.ts`, `errors.ts` y `mensajes.ts` (y su prueba en `MensajesSeguros.test.ts`).
  - `src/modules/catalogo`: Catálogo público, detalle de prenda, inventario de tienda, Mi Tienda, página pública de tienda, moderación y playlists (`ms-item-catalogo`, `ms-inventario`, `ms-playlist`).
  - `src/modules/mapa`: Mapa de Bogotá, pines de tiendas/fundaciones, categorías, resumen de catálogo, fundaciones cercanas y cálculo de distancia (`ms-geolocalizacion` + `ms-item-catalogo`).
  - `src/modules/administracion`: `adminPlaylistService` en `adminService.ts` y manejo de `LIMITE_DESTACADAS` en `AdminPlaylistsPage.tsx` (`ms-playlist`).
  - `src/modules/experiencia`: únicamente `foundations()` dentro de `donationService.ts` (`ms-geolocalizacion`).

- **Exclusiones deliberadas (no tocadas a propósito):**
  - **Landing (`src/modules/landing` y `src/components/landing`):** Intacta al 100 % para evitar conflictos de merge con los ajustes de estilos que está realizando Kevin.
  - **Enrutamiento (`src/app/router.tsx`):** Sin diferencias respecto a `UNIFICADO-REACT` (se conservó `/tienda/inventario` como única ruta de inventario).
  - **Servicios propios de otros microservicios (`identidad`, `transacciones`, `soporte` y resto de `administracion` / `experiencia`):** No modificados; `MENSAJES_POR_CODIGO` convive sin alterar códigos existentes como `LIMITE_PLAN`.

---

## 2. Archivos nuevos

- **Ningún archivo de código nuevo.** Toda la alineación de DTOs, servicios, hooks, mocks, manejo de errores, vistas y pruebas se implementó sobre archivos ya existentes de `UNIFICADO-REACT`.
- **`docs/CAMBIOS_ALINEACION_CATALOGO.md`:** Único archivo creado en la rama, para documentar esta entrega y facilitar el merge final del equipo (no se tocó el `README.md` raíz).

---

## 3. Archivos modificados (destacando compartidos)

> **Total frente a `UNIFICADO-REACT`:** 45 archivos modificados (`M`), 1 archivo nuevo (`docs/CAMBIOS_ALINEACION_CATALOGO.md`), 0 eliminados.

### Archivos compartidos o propensos a conflicto al hacer merge (revisar con prioridad)

| Archivo | Qué se cambió | Qué debe conservarse al hacer merge |
|---|---|---|
| `src/modules/core/api/apiClient.ts`, `errors.ts` y `mensajes.ts` | `ApiError` ahora guarda `code` y `timestamp` de `ProblemDetail`; `MENSAJES_POR_CODIGO` y `mensajePorCodigo()` seleccionan el texto amigable según `code` manteniendo fallback por estado HTTP cuando no llega `code`. | **Preservar** `MENSAJES` y `camposDelError` existentes; **conservar** `MENSAJES_POR_CODIGO`, `mensajePorCodigo` y `timestamp` en `aApiError()` / `errorMessage()`. |
| `src/modules/administracion/services/adminService.ts` y `pages/AdminPlaylistsPage.tsx` | Solo se ajustó `adminPlaylistService` (`GET /api/v1/playlists/populares` paginado vía `content` o lista y `PUT`/`DELETE /api/v1/playlists/{id}/destacar`, leyendo `totalPrendas`) y el manejo de `code === 'LIMITE_DESTACADAS'`. | **Preservar** `adminStoreService` y `adminFoundationService`; **conservar** `toAdminPlaylistDto`, las rutas reales y la detección de `LIMITE_DESTACADAS`. |
| `src/modules/experiencia/services/donationService.ts` | Solo se actualizó `foundations(coords?)` en modo API para consultar `GET /api/v1/fundaciones/cercanas` con `{ lat, lng, radioKm }`. | **Preservar** el resto de métodos de donaciones del módulo `experiencia`; **conservar** `/api/v1/fundaciones/cercanas`. |
| `src/modules/catalogo/types/item.dto.ts` | Fuente única de constantes unificadas (`TIPOS_PRENDA_UNIFICADOS`, `COLORES_UNIFICADOS`, `ESTILOS_UNIFICADOS`, `MARCAS_TIENDAS_UNIFICADAS`, `TALLAS_POR_TIPO`, `ORDENES_UNIFICADOS`), `tipoTalla?` y `lat`/`lng` en `ItemFiltersDto`. | **No revertir** estas constantes compartidas; otros módulos pueden importarlas en lugar de duplicar listas. |
| `src/modules/catalogo/pages/CatalogPage.tsx` y `CatalogPage.css` | Panel unificado (12 tipos, 8 colores, 11 marcas/tiendas, 5 estilos, tallas agrupadas con `34`/`36` independientes por `tipoTalla`), 3 ordenamientos (`RECIENTES`, `REPUTACION`, `DISTANCIA` con `UBICACION_REQUERIDA`), sin `cercaDe`, sin barra superior `CatalogMegaMenu`, sin descuentos ni etiquetas del perchero (renombrado a `RELEVANTE`), con animación colapsable `.sr-rack-collapse` al filtrar y estado vacío diferenciado (`«Aún no hay prendas en el catálogo»` + plegado del perchero cuando no hay prendas sin filtros vs. `«No encontramos prendas con esos filtros»` + botón `Quitar filtros`). | **Conservar** `filtroTipoTalla`, los 3 ordenamientos, la ausencia de barra superior/descuentos, `.sr-rack-collapse` y los estados vacíos diferenciados (no reintroducir `cercaDe`, `rel`, `new`, `rep` ni `CatalogMegaMenu`). |
| `src/modules/catalogo/pages/InventoryPage.tsx` y `InventoryPage.css` | Estados `ULTIMAS_UNIDADES`/`AGOTADA`/`RETIRADO`, alerta con `motivoRechazo`, `tipoPrenda`, máx. 5 fotos, sin input de marca, modal de edición, pie `.inv-card__foot` en 2 filas y manejo por `code` (`ALMACEN_SUSPENDIDO`, `INVENTARIO_SUSPENDIDO`, `ACCESO_DENEGADO`, `PRENDA_RETIRADA`, `PRENDA_YA_RETIRADA`, `FOTOGRAFIAS_EXCEDIDAS`). | **Conservar** el formulario sin `marca`, el layout en dos filas del footer de tarjeta y el manejo de errores por `code`. |
| `src/modules/catalogo/pages/PlaylistsPage.tsx` y `utils/erroresPlaylist.ts` | Selector de `estilo` (`CASUAL`..`VINTAGE`), 1–15 prendas iniciales, lectura de `usuarioId`, conexión de `handleGuardar` a `save()`, pestañas (`Todas`, `Creadas por ti`, `Guardadas`) siempre visibles con estado vacío del carrusel (`«Aún no hay playlists disponibles»`, `«Aún no has creado ninguna playlist»`, `«No tienes playlists guardadas»`), eliminación de referencias visibles `RNF-12`, del chip `En tornamesa` y de emojis (`🔒`, `👁️`, `🔀`), y manejo por `code` (`PLAYLIST_SIN_PRENDAS`, `DESCRIPCION_MUY_LARGA`, `USUARIO_NO_AUTENTICADO`, `PRENDA_YA_EN_PLAYLIST`, `LIMITE_PRENDAS_PLAYLIST`, `PRENDA_NO_ESTA_EN_PLAYLIST`). | **Conservar** `estilo`, `prendasIniciales` obligatorias (>= 1), `usuarioId`, las pestañas siempre visibles con su estado vacío, la interfaz sin `RNF-12`/`En tornamesa`/emojis y el mapeo de códigos de error. |
| `src/modules/mapa/pages/MapPage.tsx` y `MapCard.tsx` | Filtro por `categoriaId`, distancia con coma decimal a 2 dígitos (`formatDistanciaKm`), `/almacenes/{id}/catalogo/resumen` (4 prendas + `totalPrendas`), render condicional sin datos ficticios y manejo de errores por `code` (`COORDENADA_FUERA_DE_RANGO`, `RADIO_INVALIDO`). | **Conservar** `<p>Lo que ofrece</p>` exacto, `categoriaId`, el render condicional en `MapCard.tsx` y el manejo por `code`. |

### Resto de archivos modificados por módulo

- **Pruebas Core (`src/modules/core/__tests__`):**
  - `MensajesSeguros.test.ts`: Caso nuevo que verifica la prioridad de `ProblemDetail.code` y captura de `timestamp`.
- **Catálogo (`src/modules/catalogo`):**
  - `services/itemService.ts`: Normalización de respuesta (`fotografias[0]`, `almacenId`, `motivoRechazo ?? motivo`), `extractStockMapFromInventory()` / `extractAvailableTallasFromInventory()` (compatibles con `sedes[].variantes[]`), `getSimilar(id)` y filtrado mock por `tipoTalla`.
  - `hooks/useItems.ts`: Exposición y resolución de error según `code`.
  - `components/ItemCard.tsx`: Sin cambio de foto en hover y sin badges ni precios de descuento.
  - `components/CatalogMegaMenu.tsx`: Valores alineados (ya no se renderiza en `CatalogPage.tsx`).
  - `pages/ItemDetailPage.tsx`: Sección **«Prendas similares»** (`getSimilar`, etiqueta `Recomendaciones` sin `RF-16`), tallas desde `extractAvailableTallasFromInventory()` y precio sin bloque de descuento.
  - `mocks/items.ts`: Estilos alineados, `Enterizo` → `Conjunto`, galerías limpias (sin fotos de otras prendas) y sin `precioAnterior`/`descuento`.
  - `__tests__/Catalog.test.tsx`: Pruebas actualizadas para los 3 ordenamientos, listas unificadas sin `cercaDe` y estados vacíos (catálogo sin prendas vs. sin coincidencias con filtros).
- **Inventario y Tienda (`src/modules/catalogo`):**
  - `types/inventory.dto.ts`: Nuevos estados, `PrendaRequestDto`, `InventarioLoteRequestDto` (incluye `fechaPublicacion`), `UpdateInventoryItemDto`.
  - `mocks/inventory.ts`: Estados actualizados, tallas de pantalón y ejemplo rechazado (`inv-5`).
  - `services/inventoryService.ts` y `hooks/useInventory.ts`: Validaciones (`validatePrendaFields`), marca automática desde tienda, lectura de `sedes[].variantes[]` y `motivoRechazo ?? motivo`, conexión a `/api/v1/prendas` y `/api/v1/inventario/*` (con `fechaPublicacion` en lote) y transición `RECHAZADA` → `PENDIENTE` al editar.
  - `pages/MiTiendaPage.tsx`: Tallas, estilos, estados y tipos alineados; marca automática.
  - `services/storePublicService.ts`, `pages/StorePage.tsx` y `__tests__/Inventory.test.tsx`: 11 tiendas, `/almacenes/{id}/catalogo` + `extractAvailableTallasFromInventory()`, `/almacenes/{id}/novedades` (máximo 3 prendas con encabezado `ÚLTIMOS 7 DÍAS` sin `SR-RF-20`) y validación en inventario sin texto `RF-50 a RF-60`.
- **Moderación (`src/modules/catalogo`):**
  - `types/moderation.dto.ts`, `services/moderationService.ts`, `hooks/useModeration.ts`, `pages/ModerationPage.tsx`: Grupos en `/pendientes`, envío de `decision`/`motivo`/`moderadorId` + `almacenId`, historial en sesión (sin `/historial`), subtítulo `Administración` (sin `RF-61`) y manejo de `MOTIVO_REQUERIDO` / `PRENDA_NO_PENDIENTE`.
- **Playlists (`src/modules/catalogo`):**
  - `types/playlist.dto.ts`, `services/playlistService.ts`, `hooks/usePlaylists.ts`, `__tests__/Playlists.test.tsx` y `__tests__/PlaylistErrores.test.tsx`: `ESTILOS_PLAYLIST`, `usuarioId`, soporte desglosado en `playlist.prendas` (`prendaId`, `nombrePrenda`, `disponible === false`), envío de `nombrePrenda` en `addItem`, lectura de `likes`/`guardados` de la respuesta completa, `save()`, limpieza de etiquetas `RNF-12` y pruebas de estados vacíos por pestaña en el carrusel.
- **Mapa (`src/modules/mapa`):**
  - `types/map.dto.ts`, `utils/mapUtils.ts`, `services/mapService.ts`, `components/BubbleColumn.tsx`, `mocks/mapData.ts`: `CATEGORIAS_ALMACEN` (con `Calzado`), `formatDistanciaKm`, `/fundaciones/cercanas`, `/almacenes/{id}/catalogo/resumen`, render condicional sin datos de ejemplo.

---

## 4. Cambios críticos de contrato (no revertir en el merge)

### Rutas REST y formato de errores (`ProblemDetail`)
- **Errores estándar (`ProblemDetail`):** Todos los servicios devuelven `{ type, title, status, detail, instance, code, timestamp }` (y `errors` en 400 de validación). En el front **no** se muestra `detail` del backend directamente salvo `fields` (`errors`), sino el mensaje mapeado desde `MENSAJES_POR_CODIGO[code]`.
- **Códigos `code` soportados:** `PARAMETRO_INVALIDO`, `DATOS_INVALIDOS`, `RANGO_PRECIO_INVALIDO`, `UBICACION_REQUERIDA`, `PRENDA_NO_ENCONTRADA`, `ALMACEN_NO_ENCONTRADO`, `COORDENADA_FUERA_DE_RANGO`, `RADIO_INVALIDO`, `INVENTARIO_NO_ENCONTRADO`, `ALMACEN_SUSPENDIDO`, `FOTOGRAFIAS_EXCEDIDAS`, `TALLA_INVALIDA`, `CANTIDAD_INVALIDA`, `INVENTARIO_SUSPENDIDO`, `ACCESO_DENEGADO`, `PRENDA_RETIRADA`, `TALLA_NO_REGISTRADA`, `PRENDA_YA_RETIRADA`, `PRENDA_NO_PENDIENTE`, `MOTIVO_REQUERIDO`, `PLAYLIST_SIN_PRENDAS`, `USUARIO_NO_AUTENTICADO`, `PLAYLIST_NO_ENCONTRADA`, `DESCRIPCION_MUY_LARGA`, `LIMITE_PRENDAS_PLAYLIST`, `PRENDA_YA_EN_PLAYLIST`, `PRENDA_NO_ESTA_EN_PLAYLIST`, `PLAYLIST_PRIVADA`, `LIMITE_DESTACADAS`, `ERROR_INTERNO`.
- **Rutas principales:**
  - `ms-item-catalogo`: `GET /api/v1/prendas` (`orden=RECIENTES | REPUTACION | DISTANCIA`, `lat`, `lng`), `GET /api/v1/prendas/{id}/similares`, `POST/PUT/DELETE /api/v1/prendas`, `GET /api/v1/almacenes/{id}/catalogo`, `/catalogo/resumen`, `/novedades`, `GET /api/v1/prendas/pendientes` (`{ tipoPublicador, total, grupos }`), `PUT .../moderacion` (sin `/historial`).
  - `ms-inventario`: `POST /api/v1/inventario/lote` (incluye `fechaPublicacion`), `PATCH /api/v1/inventario/prenda/{prendaId}/sede/{sedeId}/tallas/{talla}` (`{ unidades }`), `GET /api/v1/inventario/prenda/{prendaId}` (`sedes[].variantes[]`), `GET /api/v1/inventario/sedes/{sedeId}/disponibles`.
  - `ms-geolocalizacion`: `GET /api/v1/almacenes` (`lat`, `lng`, `radioKm`, `categoriaId`), `GET /api/v1/almacenes/{id}/distancia?lat&lng`, `GET /api/v1/fundaciones/cercanas?lat&lng&radioKm`.
  - `ms-playlist`: `GET/POST /api/v1/playlists`, `POST /api/v1/playlists/{id}/prendas` (`{ prendaId, nombrePrenda }`), `POST .../like` y `.../guardar`, `GET /api/v1/playlists/populares` (`Page` con `content`), `PUT/DELETE /api/v1/playlists/{id}/destacar`.

### Listas unificadas, enums y validaciones
- **Tipos (12):** `Saco`, `Chaqueta`, `Buzo`, `Suéter`, `Camisa`, `Camiseta`, `Pantalón`, `Falda`, `Vestido`, `Conjunto`, `Calzado`, `Accesorio`.
- **Colores (8):** `Negro`, `Blanco`, `Gris`, `Azul`, `Café`, `Beige`, `Crudo`, `Plata`.
- **Estilos (5):** `Casual`, `Formal`, `Deportivo`, `Urbano`, `Vintage` (`CASUAL..VINTAGE` en playlists).
- **Marcas / Tiendas (11):** `Kicks Local`, `Luna Store`, `Nómada Studio`, `Segunda mano`, `The Local Lab`, `Ropero 57`, `Norte Denim`, `Casa Tweed`, `Sastrería Antonia`, `Calle 85 Store`, `Nora Vintage` (la marca sale automáticamente de la tienda al publicar).
- **Tallas:** `ROPA` (`XS`–`XXL`), `PANTALON` (`26`–`36`), `CALZADO` (`34`–`45`), `UNICA` (`Única`), con selección diferenciada por grupo en catálogo.
- **Categorías mapa (7):** `Casual`, `Formal`, `Deportivo`, `Urbano`, `Vintage`, `Accesorios`, `Calzado`.
- **Estados:** Inventario (`DISPONIBLE`, `ULTIMAS_UNIDADES`, `NUEVA_PRENDA`, `AGOTADA`, `SUSPENDIDO`, `RETIRADO`), Publicación (`PENDIENTE`, `APROBADA`, `RECHAZADA`, `RETIRADA`) y Moderación (`APROBADA`, `RECHAZADA` con `motivo` y `moderadorId`).
- **Validaciones:** Prenda (`nombre` 3–60, `tipo`/`color`/`estilo` ≤ 20, `marca` ≤ 30 automática, `precio` ≤ 10.000.000 COP, 1–5 fotos con URL ≤ 300, sin descuentos en UI de catálogo); Playlist (`estilo` y 1–15 prendas al crear, `usuarioId` texto).
