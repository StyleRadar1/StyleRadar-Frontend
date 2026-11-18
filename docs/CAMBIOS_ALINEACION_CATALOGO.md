# Cambios de Alineación Back–Front (Catálogo, Inventario, Geolocalización y Playlists)

**Rama:** `feature/carlos-alineacion-back-front` (base: `UNIFICADO-REACT`)  
**Autor:** Carlos Sánchez

---

## 1. Alcance y exclusiones

- **Módulos trabajados:**
  - `src/modules/catalogo`: Catálogo público, detalle de prenda, inventario de tienda, Mi Tienda, página pública de tienda, moderación y playlists (`ms-item-catalogo`, `ms-inventario`, `ms-playlist`).
  - `src/modules/mapa`: Mapa de Bogotá, pines de tiendas/fundaciones, categorías, resumen de catálogo, fundaciones cercanas y cálculo de distancia (`ms-geolocalizacion` + `ms-item-catalogo`).
  - `src/modules/administracion`: únicamente `adminPlaylistService` dentro de `src/modules/administracion/services/adminService.ts` (`ms-playlist` · populares y destacar).
  - `src/modules/experiencia`: únicamente `foundations()` dentro de `src/modules/experiencia/services/donationService.ts` (`ms-geolocalizacion`).

- **Exclusiones deliberadas (no tocadas a propósito):**
  - **Landing (`src/modules/landing` y `src/components/landing`):** Intacta al 100 % para evitar conflictos de merge con los ajustes de estilos que está realizando Kevin.
  - **Enrutamiento (`src/app/router.tsx`):** Sin diferencias respecto a `UNIFICADO-REACT` (se conservó `/tienda/inventario` como única ruta de inventario).
  - **Servicios de otros microservicios (`identidad`, `transacciones`, `soporte` y resto de `administracion` / `experiencia`):** No modificados.

---

## 2. Archivos nuevos

- **Ningún archivo de código nuevo.** Toda la alineación de DTOs, servicios, hooks, mocks, vistas y pruebas se implementó sobre archivos ya existentes de `UNIFICADO-REACT`.
- **`docs/CAMBIOS_ALINEACION_CATALOGO.md`:** Único archivo creado en la rama, para documentar esta entrega y facilitar el merge final del equipo (no se tocó el `README.md` raíz).

---

## 3. Archivos modificados (destacando compartidos)

> **Total frente a `UNIFICADO-REACT`:** 33 archivos modificados (`M`), 0 eliminados.

### Archivos compartidos o propensos a conflicto al hacer merge (revisar con prioridad)

| Archivo | Qué se cambió | Qué debe conservarse al hacer merge |
|---|---|---|
| `src/modules/administracion/services/adminService.ts` | Solo se ajustó `adminPlaylistService`: en modo API consume `GET /api/v1/playlists/populares` y `PUT`/`DELETE /api/v1/playlists/{id}/destacar`, mapeando a `AdminPlaylistDto`. | **Preservar** `adminStoreService` y `adminFoundationService` de otras ramas; **conservar** nuestro `toAdminPlaylistDto` y las rutas `/playlists/populares` + `/destacar` en `adminPlaylistService`. |
| `src/modules/experiencia/services/donationService.ts` | Solo se actualizó `foundations(coords?)` en modo API para consultar `GET /api/v1/fundaciones/cercanas` con `{ lat, lng, radioKm }`. | **Preservar** el resto de métodos de donaciones del módulo `experiencia`; **conservar** el endpoint `/api/v1/fundaciones/cercanas` en `foundations()`. |
| `src/modules/catalogo/types/item.dto.ts` | Fuente única de constantes unificadas (`TIPOS_PRENDA_UNIFICADOS`, `COLORES_UNIFICADOS`, `ESTILOS_UNIFICADOS`, `MARCAS_TIENDAS_UNIFICADAS`, `TALLAS_POR_TIPO`, `ORDENES_UNIFICADOS`), `tipoTalla?` y `lat`/`lng` en `ItemFiltersDto`. | **No revertir** estas constantes compartidas; otros módulos pueden importarlas en lugar de duplicar listas. |
| `src/modules/catalogo/pages/CatalogPage.tsx` | Panel con los 12 tipos, 8 colores, 11 marcas/tiendas, 5 estilos, tallas agrupadas (selección independiente de `34`/`36` por grupo `tipoTalla`), solo 3 ordenamientos (`RECIENTES`, `REPUTACION`, `DISTANCIA`) con GPS/zonas y sin filtro `cercaDe` ni `Para ti`. | **Conservar** `filtroTipoTalla`, los 3 ordenamientos y el envío de `lat`/`lng` (sin reintroducir `cercaDe`, `rel`, `new`, `rep` ni `Streetwear`/`Techwear`). |
| `src/modules/catalogo/pages/InventoryPage.tsx` y `InventoryPage.css` | Nuevos estados (`ULTIMAS_UNIDADES`, `AGOTADA`, `RETIRADO`), alerta con `motivoRechazo`, selector `tipoPrenda`, máximo 5 fotos, sin input de marca, modal de edición (`PUT /api/v1/prendas/{id}`) y pie `.inv-card__foot` en 2 filas (`.inv-card__foot-top` + `.inv-card__actions`) para evitar desborde. | **Conservar** el formulario sin campo `marca`, el layout en dos filas del footer de tarjeta y `white-space: nowrap` en `.inv-status`. |
| `src/modules/catalogo/pages/PlaylistsPage.tsx` | Selector de `estilo` (`CASUAL`..`VINTAGE`), selección de 1 a 15 prendas iniciales al crear, lectura de `usuarioId` en `esMia`/`creadasPorTi` y conexión real de `handleGuardar` con `usePlaylists().save()`. | **Conservar** `estilo`, `prendasIniciales` obligatorias (>= 1) y la compatibilidad con `usuarioId` sin romper `creador`. |
| `src/modules/mapa/pages/MapPage.tsx` y `MapCard.tsx` | Filtro por categoría de almacén (`categoriaId`), distancia con coma decimal a 2 dígitos (`formatDistanciaKm`), consulta de `/almacenes/{id}/catalogo/resumen` (hasta 4 prendas + `totalPrendas`) y render condicional sin campos inventados. | **Conservar** `<p>Lo que ofrece</p>` exacto (tests), el uso de `categoriaId` y el render condicional en `MapCard.tsx`. |

### Resto de archivos modificados por módulo

- **Catálogo (`src/modules/catalogo`):**
  - `services/itemService.ts`: Normalización de respuesta del back (`fotografias[0]`, `almacenId`), `getSimilar(id)` (`GET /api/v1/prendas/{id}/similares`), limpieza de query params y filtrado mock por `tipoTalla` (`ROPA`/`PANTALON`/`CALZADO`/`UNICA`).
  - `components/CatalogMegaMenu.tsx`: Estilos y tipos alineados con las listas unificadas (`Urbano`, `Formal`, `Deportivo`, singular en `tipo`).
  - `components/ItemCard.tsx`: Lectura compatible con `fotografias[0]` y tienda desde `almacenId`.
  - `pages/ItemDetailPage.tsx`: Sección titulada **«Prendas similares»** conectada a `itemService.getSimilar(id)` y consulta de tallas en `/api/v1/inventario/prenda/{id}`.
  - `mocks/items.ts`: Estilos alineados (`Casual`, `Formal`, `Deportivo`, `Urbano`, `Vintage`) y `Enterizo` → `Conjunto`.
  - `__tests__/Catalog.test.tsx`: Pruebas actualizadas para los 3 ordenamientos y listas unificadas sin `cercaDe`.

- **Inventario y Tienda (`src/modules/catalogo`):**
  - `types/inventory.dto.ts`: Enums `DISPONIBLE | ULTIMAS_UNIDADES | NUEVA_PRENDA | AGOTADA | SUSPENDIDO | RETIRADO`, `PublicationStatus` (`PENDIENTE | APROBADA | RECHAZADA | RETIRADA`), `PrendaRequestDto`, `InventarioLoteRequestDto`, `UpdateInventoryItemDto`.
  - `mocks/inventory.ts`: Mocks con `ULTIMAS_UNIDADES`, `AGOTADA`, tallas de pantalón y ejemplo rechazado (`inv-5`).
  - `services/inventoryService.ts` y `hooks/useInventory.ts`: `validatePrendaFields`, asignación automática de marca desde la tienda, conexión a `POST /api/v1/prendas`, `POST /api/v1/inventario/lote`, `PUT /api/v1/prendas/{id}`, `PATCH /api/v1/inventario/prenda/{prendaId}/sede/{sedeId}/tallas/{talla}`, `DELETE /api/v1/prendas/{id}` y paso automático de `RECHAZADA` → `PENDIENTE` al editar.
  - `pages/MiTiendaPage.tsx`: Tallas, estilos, estados y tipos alineados; soporte de marca automática.
  - `services/storePublicService.ts` y `pages/StorePage.tsx`: Mapeo de las 11 tiendas, consumo de `GET /api/v1/almacenes/{id}/catalogo`, `/inventario/prenda/{prendaId}` y `GET /api/v1/almacenes/{id}/novedades` (máximo 3 prendas semanales).

- **Moderación (`src/modules/catalogo`):**
  - `types/moderation.dto.ts`: Añadido `almacenId?`, `BackendModerationRequestDto` y `ModerationPendingResponseDto` (grupos).
  - `services/moderationService.ts` y `hooks/useModeration.ts`: Parseo de `{ tipoPublicador, total, grupos }` en `GET /api/v1/prendas/pendientes`, envío de `{ decision: 'APROBADA' | 'RECHAZADA', motivo, moderadorId }` y `almacenId` en lote, y eliminación de llamada HTTP a `/api/v1/prendas/historial` (se usa historial en sesión).

- **Playlists (`src/modules/catalogo`):**
  - `types/playlist.dto.ts`: `ESTILOS_PLAYLIST`, `PlaylistEstilo`, `usuarioId?`, `UpdatePlaylistDto`.
  - `services/playlistService.ts` y `hooks/usePlaylists.ts`: `normalizePlaylist` (mapeando `usuarioId`), mínimo 1 prenda y `estilo` al crear, lectura de `likes` y `guardados` desde la playlist devuelta por `/like` y `/guardar`, y método `save()`.

- **Mapa (`src/modules/mapa`):**
  - `types/map.dto.ts`: `CATEGORIAS_ALMACEN` (7 categorías incluyendo `Calzado`), `categoriaId?`, `totalPrendas?` y campos descriptivos opcionales en `MapPinDto`.
  - `utils/mapUtils.ts`: `filterPins(pins, filter, categoriaId?)` y `formatDistanciaKm(km)` (`"1,25 km"`).
  - `services/mapService.ts`: `getAll({ lat, lng, radioKm, categoriaId })` sin datos falsos de respaldo en modo API, `nearbyFoundations` (`/api/v1/fundaciones/cercanas`) y `getCatalogSummary` (`/api/v1/almacenes/{id}/catalogo/resumen`).
  - `components/BubbleColumn.tsx`: Render condicional de `pin.barrio` opcional.
  - `mocks/mapData.ts`: Categorías alineadas (`Deportivo`, `Vintage`, `Calzado`, `Urbano`) con `categoriaId` y distancia con dos decimales y coma.

---

## 4. Cambios críticos de contrato (no revertir en el merge)

### Rutas REST esperadas por el backend
- **Catálogo (`ms-item-catalogo`):**
  - `GET /api/v1/prendas` (usa `orden=RECIENTES | REPUTACION | DISTANCIA`, `lat`, `lng`; **no enviar** `cercaDe`, `origen`, `categoria` ni ordenamientos viejos).
  - `GET /api/v1/prendas/{id}/similares` (sección «Prendas similares», máx. 10).
  - `POST /api/v1/prendas`, `PUT /api/v1/prendas/{id}`, `DELETE /api/v1/prendas/{id}` (no usar `/api/v1/inventario/prenda`, `/precio`, `/stock` ni `/toggle-estado`).
  - `GET /api/v1/almacenes/{id}/catalogo`, `/catalogo/resumen` (máx. 4 prendas), `/novedades` (máx. 3 prendas).
  - `GET /api/v1/prendas/pendientes` (formato `{ tipoPublicador, total, grupos }`) y `PUT /api/v1/prendas/{id}/moderacion` / `.../almacenes/{almacenId}/moderacion` (sin `GET /api/v1/prendas/historial`).
- **Inventario (`ms-inventario`):**
  - `POST /api/v1/inventario/lote` (`{ prendaId, sedeId, tipoPrenda, tallas }`).
  - `PATCH /api/v1/inventario/prenda/{prendaId}/sede/{sedeId}/tallas/{talla}` (`{ unidades }`).
  - `GET /api/v1/inventario/prenda/{prendaId}` y `GET /api/v1/inventario/sedes/{sedeId}/disponibles`.
- **Geolocalización (`ms-geolocalizacion`):**
  - `GET /api/v1/almacenes` (recibe `lat`, `lng`, `radioKm`, `categoriaId`).
  - `GET /api/v1/almacenes/{id}/distancia?lat&lng` (formato mostrado con coma decimal y 2 decimales).
  - `GET /api/v1/fundaciones/cercanas?lat&lng&radioKm`.
- **Playlists (`ms-playlist`):**
  - `GET/POST /api/v1/playlists`, `POST /api/v1/playlists/{id}/like` y `/guardar` (devuelven el objeto playlist con `likes` y `guardados`).
  - `GET /api/v1/playlists/populares` y `PUT` / `DELETE /api/v1/playlists/{id}/destacar` (en reemplazo de `/api/v1/admin/playlists*`).

### Listas unificadas y enums
- **Tipos de prenda (12):** `Saco`, `Chaqueta`, `Buzo`, `Suéter`, `Camisa`, `Camiseta`, `Pantalón`, `Falda`, `Vestido`, `Conjunto`, `Calzado`, `Accesorio`.
- **Colores (8):** `Negro`, `Blanco`, `Gris`, `Azul`, `Café`, `Beige`, `Crudo`, `Plata`.
- **Estilos (5):** `Casual`, `Formal`, `Deportivo`, `Urbano`, `Vintage` (en playlist en mayúsculas: `CASUAL`, `FORMAL`, `DEPORTIVO`, `URBANO`, `VINTAGE`).
- **Marcas / Tiendas (11):** `Kicks Local`, `Luna Store`, `Nómada Studio`, `Segunda mano`, `The Local Lab`, `Ropero 57`, `Norte Denim`, `Casa Tweed`, `Sastrería Antonia`, `Calle 85 Store`, `Nora Vintage`.
- **Tallas por `TipoTalla` / `TipoPrendaInventario`:** `ROPA` (`XS`–`XXL`), `PANTALON` (`26`–`36`), `CALZADO` (`34`–`45`), `UNICA` (`Única`).
- **Categorías de almacén (mapa):** `Casual`, `Formal`, `Deportivo`, `Urbano`, `Vintage`, `Accesorios`, `Calzado`.
- **Estados:** Inventario (`DISPONIBLE`, `ULTIMAS_UNIDADES`, `NUEVA_PRENDA`, `AGOTADA`, `SUSPENDIDO`, `RETIRADO`), Publicación (`PENDIENTE`, `APROBADA`, `RECHAZADA`, `RETIRADA`) y Moderación (`decision: 'APROBADA' | 'RECHAZADA'`, `moderadorId`).

### Validaciones obligatorias en front
- **Prendas:** `nombre` 3–60 caracteres; `tipo`, `color` y `estilo` obligatorios (≤ 20); `marca` tomada automáticamente de la tienda (no se pide en formulario, ≤ 30); `precio` > 0 y ≤ `10.000.000` COP; **1 a 5 fotografías** (URL ≤ 300 caracteres).
- **Playlists:** `estilo` obligatorio y entre **1 y 15 prendas** (`prendaIds`) al crear; campo de autor leído por `usuarioId` (texto) con respaldo en `creador`.
