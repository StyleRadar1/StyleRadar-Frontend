# Módulo experiencia · Squad 3 (Portal8080 / PT8080)

Probador virtual, Segunda vida (C2C) y donaciones. Microservicios: `ms-probador-virtual` (8092) y `ms-segunda-vida-donaciones` (8093), siempre a través del API Gateway (8080).

Requerimientos: RF-23 a RF-27 (probador), RF-33 a RF-39 (segunda mano), RF-42 y RF-44 a RF-49 (donaciones). RNF de front: RNF-06, RNF-07 y RNF-10.

## Pantallas

| Ruta | Rol | Pantalla | Jira |
|---|---|---|---|
| `/probador` | Usuario | Foto, prenda, prueba asíncrona, resultado y borrado | FE02 a FE06 (PT8080-44 a 48) |
| `/segunda-mano` | Usuario | Explorar con filtros y pestaña «Mis publicaciones» | FE09 y FE10 (PT8080-50 y 51) |
| `/segunda-mano/publicar` | Usuario | Asistente de publicación en 3 pantallas | FE08 (PT8080-26) |
| `/segunda-mano/:id/editar` | Usuario | El mismo asistente para editar | FE10 (PT8080-51) |
| `/donar` | Usuario | Prenda, fundación y entrega en 3 pantallas | FE11 y FE12 (PT8080-52 y 53) |
| `/fundacion/donaciones` | Fundación | Solicitudes, decisión y confirmación con comprobante | FE13 (PT8080-54) |

## Contratos provisionales

Están en `types/`. Son provisionales: se ajustan cuando cada microservicio publique su Swagger. Todas las rutas van al Gateway (`VITE_API_URL`) con `Authorization: Bearer <token>`.

| Método y ruta | Uso | Respuesta |
|---|---|---|
| `GET /api/tryon/garments` | Prendas que se pueden probar | `TryOnGarmentDto[]` |
| `POST /api/tryon/photos` (multipart `file`) | Subir la foto frontal | `{ photoId }` |
| `POST /api/tryon/jobs` + `Idempotency-Key` | Crear la prueba | `202 { jobId, status }` |
| `GET /api/tryon/jobs/{jobId}` | Estado de la prueba | `PENDING`, `PROCESSING`, `COMPLETED` (con `resultUrl` SAS y `expiresAt`), `FAILED` o `EXPIRED` |
| `DELETE /api/tryon/photos/{photoId}` | Borrar foto y resultados | `204` |
| `GET /api/second-hand/listings` | Publicaciones disponibles con filtros `texto`, `conservacion`, `talla`, `precioMin`, `precioMax` | `ListingDto[]` |
| `GET /api/second-hand/listings/mine` | Publicaciones propias | `ListingDto[]` |
| `POST /api/second-hand/listings` (multipart `data` + hasta 4 `files`) | Publicar | `201 ListingDto` |
| `PUT /api/second-hand/listings/{id}` | Editar (solo DISPONIBLE) | `ListingDto` o `409` |
| `PATCH /api/second-hand/listings/{id}/status` | `VENDIDA` o `RETIRADA` | `ListingDto`, `403` o `409` |
| `GET /api/donations/foundations` | Fundaciones por cercanía | `FoundationDto[]` |
| `POST /api/donations` (multipart `data` + hasta 4 `files`) | Solicitud con logística | `201 DonationDto` o `409` si está duplicada |
| `GET /api/donations/foundation/requests` | Solicitudes de la fundación del representante | `DonationDto[]` |
| `PATCH /api/donations/{id}/status` | `APROBADA`, `RECHAZADA` (con `justificacion`), `EN_RECOGIDA` o `ENTREGADA` (genera `comprobante`) | `DonationDto`, `403` o `409` |

**Errores.** El front muestra el `message` que envíe el backend para los 4xx; para 0 (sin conexión), 401, 403, 409 y 5xx usa los mensajes de `core/api/errors.ts`. Un 401 cierra la sesión y ofrece volver a entrar.

## Por acordar con el backend

- **RF-34:** los estados de conservación. Hoy son Como nuevo, Muy bueno y Bueno (`types/secondhand.dto.ts`).
- **Foto del probador:** formatos y límites. Hoy son JPG, PNG o WEBP de hasta 8 MB y mínimo 400 px por lado (`utils/photoRules.ts`).
- **Job del probador:** si el Gateway acepta `Idempotency-Key`, cuánto dura la URL SAS y cada cuánto consultar (`hooks/useTryOnJob.ts`, objeto `POLL`).
- **Fundación del representante:** cómo se asocia la cuenta a su fundación (en la demo, `f-1` es Fundación Abrigo Bogotá).

## Datos simulados y escenarios de error

Con `VITE_USE_MOCKS=true` todo responde con datos de prueba y la app muestra el aviso «Modo demostración». **Esto no es integración real**: en Jira se reporta como mock hasta conectar el Gateway.

Para grabar los casos negativos se agrega `?mock=<escenario>` a la URL. Se pueden combinar con comas y duran lo que dura la pestaña. La lista está en `core/api/mockScenario.ts`:

`sin-red`, `subida-falla`, `sin-permiso`, `sesion-vencida`, `job-falla`, `job-expira`, `resultado-expirado`, `borrado-falla`, `catalogo-vacio`, `conflicto` y `duplicado`.

Por ejemplo, `/probador?mock=job-falla` o `/segunda-mano?mock=sin-red`. Para volver a la normalidad: `?mock=`.

## Pruebas

`npm test` corre 33 pruebas (Vitest y Testing Library) en `__tests__/`:

- **Reglas:** fotos, precio, pasos del asistente, fundaciones compatibles y logística.
- **Job del probador:** 202 con jobId, que no se dupliquen jobs, estados fallido y vencido, corte de red y reanudación, cancelación.
- **Pantallas completas:** el probador con resultado, URL vencida y borrado con fallo; el asistente con atrás sin perder datos, máximo 4 fotos, precio inválido y error del API; explorar con filtros; venta, retiro y 409; donación con 409 por duplicado; el panel de fundación con justificación, confirmación antes de tiempo y 403.

**Pendiente:**
- pruebas E2E en navegador real (Playwright);
- auditoría Lighthouse;
- recorrido completo con lector de pantalla.

Se registran como brechas en FE07 y FE14.
