# Validación de sesión en Tiendas — PR #5

Fecha de ejecución: 18 de octubre de 2026 (America/Bogota; registros GitHub en UTC del 19 de octubre).
Rama: `fix/sesion-tiendas-sin-recordarme`. Base de main: `0c60fabffd425da0585ee3bd300ebdcd0558d248`.
PR #4 confirmado como fusionado en GitHub y como ancestro de HEAD; main actualizado exclusivamente mediante fast-forward. Trabajo realizado en worktree aislado. Los dos archivos .idea sin seguimiento del checkout original se conservaron intactos.

## Defecto original y solución

SRX conserva el login sin Recordarme en tmpSession; SRX.me() y SRX.role() ya reflejan esa autenticación. El detector anterior de tiendas ignoraba ese estado y buscaba claves de localStorage/sessionStorage mediante una expresión regular. Esto dejaba al comprador temporal con html.sr-guest y la composición pública, y permitía falsos positivos con preferencias ajenas a la sesión.

`19-tiendas-landing.js` ahora considera autenticado únicamente un estado con SRX.me() y SRX.role(). `sync()` sigue siendo el único punto que alterna html.sr-guest. No se crea almacenamiento ni una sesión adicional.

`05-core.js` emite el evento síncrono `sr:authchange` después de establecer el login, después de confirmar y limpiar el logout y después de las limpiezas de sesión inválida que ya existían en start()/route(). En login la notificación ocurre antes de esperar closeAuth(). Un logout cancelado retorna sin notificación ni cambios. Tiendas escucha este evento y mantiene su sincronización inicial y los listeners de storage/hashchange.

El intervalo de 700 ms conserva exclusivamente la carga de las fotografías decorativas: la autenticación dejó de depender de ese intervalo. La función de fotografías y el interceptor de enlaces a Tiendas son idénticos a la base. No cambian sesiones, persistencia, cuentas, datos demo ni permisos del router.

## Archivos modificados

- [05-core.js](../../prototipo/StyleRadar_prototipo/js/05-core.js): notificaciones del estado de autenticación.
- [19-tiendas-landing.js](../../prototipo/StyleRadar_prototipo/js/19-tiendas-landing.js): consulta de SRX y listener síncrono.
- Este informe y su carpeta de evidencias son nuevos. No se modifica documentación previa.

## Método y resumen

Chrome real `Chrome/154.0.8037.57`, ejecutado en modo headless con CDP, perfil independiente y servidor HTTP local que sirve la carpeta completa. Se utilizaron los formularios y botones demo existentes; los controles se accionaron con click DOM después de verificar su geometría y el hit-test. No se simularon respuestas de SRX ni se imprimieron contraseñas. Se emuló dispositivo móvil/táctil para 390 × 844 y 768 × 1024; escritorio 1440 × 900, DPR 1.

La ejecución anterior utilizó una copia íntegra e inmutable del prototipo de main antes de editar. El estado de login se examinó al primer muestreo en que SRX.role() devuelve el rol, sin esperar 700 ms. Un listener de auditoría registra la clase sr-guest durante la misma notificación de autenticación. Las esperas de las capturas se usan para fotografías/fuentes, después de registrar el resultado funcional.

- Casos funcionales finales: **48/48 PASS** (T01–T16 en cada tamaño).
- Base anterior: **15/48 PASS**, 33 FAIL por estado visual incorrecto o actualización tardía; esto no significa que todos esos flujos perdieran la sesión.
- Enrutador local: **285/285 PASS** (19 destinos × 5 estados de acceso × 3 tamaños).
- Responsive final: **21/21 PASS** (7 vistas × 3 tamaños), además de 9 comprobaciones de viewport incluidas en la ejecución funcional.
- Sintaxis: los **20 JavaScript** pasan `node --check`.
- Consola: **0 excepciones nuevas**; mismas firmas y cantidades de errores en las ejecuciones comparables del enrutador.
- **15 capturas reales**: 3 anteriores y 12 posteriores, JPEG sin recortes ni reescalado.

## Matriz funcional completa

Persistida significa presencia de la clave sr:session en localStorage; no presupone validez. SRX.role() devuelve null para invitado. La sección visible describe la sección que participa en el layout; en una vista privada del router ambas secciones de portada quedan ocultas. Los estados inicial y observado incluyen sesión en memoria y persistencia sin revelar su contenido.

T07 y T08 ejecutan dos variantes independientes, preparando de nuevo la sesión entre ellas. La fila principal recoge el estado inicial de la primera variante y el resultado de la última; las subtablas conservan ambos resultados. En particular, cancelar el logout no cambia una sesión temporal en persistente: la variante persistente comienza con un nuevo login con Recordarme.

### Móvil — 390 × 844

| Caso | Estado inicial | Acción | SRX.role() | sr:session persistida | html.sr-guest | Sección visible | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|---|---|---|---|
| T01 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Abrir portada sin sesión | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T02 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Abrir Tiendas desde navegación pública | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T03 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Login comprador con Recordarme desmarcado; observar al primer estado autenticado | user | no | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T04 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Abrir Tiendas sin Recordarme | user | no | no | #tiendas (comprador) | rol=user; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T05 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Login comprador con Recordarme; observar al primer estado autenticado | user | sí | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T06 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Abrir Tiendas con Recordarme | user | sí | no | #tiendas (comprador) | rol=user; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T07 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Confirmar logout en sesión persistente y temporal | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T08 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Cancelar logout en ambos tipos de sesión | user | sí | no | #tiendas (comprador) | rol=user; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T09 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Recargar con sesión temporal | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T10 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Recargar con sesión persistente | user | sí | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Alternar portada, catálogo y tiendas sin Recordarme | user | no | no | #tiendas (comprador) | rol=user; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T12 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Logout confirmado y login del siguiente rol sin Recordarme | store | no | no | ninguna; vista del router | rol=store; persistida=no; sr-guest=no; sección=ninguna; vista=mi-tienda | rol=store; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-tienda | PASS |
| T13 | rol=store; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-tienda | Logout confirmado y login del siguiente rol sin Recordarme | found | no | no | ninguna; vista del router | rol=found; persistida=no; sr-guest=no; sección=ninguna; vista=mi-fundacion | rol=found; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-fundacion | PASS |
| T14 | rol=found; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-fundacion | Logout confirmado y login del siguiente rol sin Recordarme | admin | no | no | ninguna; vista del router | rol=admin; persistida=no; sr-guest=no; sección=ninguna; vista=admin | rol=admin; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=admin | PASS |
| T15 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Probar sesiones inválidas al cargar y al invalidar la cuenta en memoria | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T16 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Recargar con preferencias ajenas a autenticación en ambos almacenamientos | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |

Subcomprobaciones de los casos con más de una variante:

| Caso | Variante / destino | Estado observado | Resultado |
|---|---|---|---|
| T07 | persistente | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T07 | temporal | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T08 | temporal | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T08 | persistente | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #/catalogo | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=catalogo | PASS |
| T11 | #inicio | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #tiendas | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #/catalogo | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=catalogo | PASS |
| T11 | #inicio | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T15 | cuenta-inexistente | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | objeto-vacio | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | json-invalido | rol=invitado; memoria=no; persistida=sí; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | invalidacion-en-memoria | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |

### Tablet — 768 × 1024

| Caso | Estado inicial | Acción | SRX.role() | sr:session persistida | html.sr-guest | Sección visible | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|---|---|---|---|
| T01 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Abrir portada sin sesión | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T02 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Abrir Tiendas desde navegación pública | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T03 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Login comprador con Recordarme desmarcado; observar al primer estado autenticado | user | no | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T04 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Abrir Tiendas sin Recordarme | user | no | no | #tiendas (comprador) | rol=user; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T05 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Login comprador con Recordarme; observar al primer estado autenticado | user | sí | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T06 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Abrir Tiendas con Recordarme | user | sí | no | #tiendas (comprador) | rol=user; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T07 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Confirmar logout en sesión persistente y temporal | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T08 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Cancelar logout en ambos tipos de sesión | user | sí | no | #tiendas (comprador) | rol=user; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T09 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Recargar con sesión temporal | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T10 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Recargar con sesión persistente | user | sí | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Alternar portada, catálogo y tiendas sin Recordarme | user | no | no | #tiendas (comprador) | rol=user; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T12 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Logout confirmado y login del siguiente rol sin Recordarme | store | no | no | ninguna; vista del router | rol=store; persistida=no; sr-guest=no; sección=ninguna; vista=mi-tienda | rol=store; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-tienda | PASS |
| T13 | rol=store; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-tienda | Logout confirmado y login del siguiente rol sin Recordarme | found | no | no | ninguna; vista del router | rol=found; persistida=no; sr-guest=no; sección=ninguna; vista=mi-fundacion | rol=found; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-fundacion | PASS |
| T14 | rol=found; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-fundacion | Logout confirmado y login del siguiente rol sin Recordarme | admin | no | no | ninguna; vista del router | rol=admin; persistida=no; sr-guest=no; sección=ninguna; vista=admin | rol=admin; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=admin | PASS |
| T15 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Probar sesiones inválidas al cargar y al invalidar la cuenta en memoria | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T16 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Recargar con preferencias ajenas a autenticación en ambos almacenamientos | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |

Subcomprobaciones de los casos con más de una variante:

| Caso | Variante / destino | Estado observado | Resultado |
|---|---|---|---|
| T07 | persistente | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T07 | temporal | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T08 | temporal | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T08 | persistente | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #/catalogo | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=catalogo | PASS |
| T11 | #inicio | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #tiendas | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #/catalogo | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=catalogo | PASS |
| T11 | #inicio | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T15 | cuenta-inexistente | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | objeto-vacio | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | json-invalido | rol=invitado; memoria=no; persistida=sí; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | invalidacion-en-memoria | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |

### Escritorio — 1440 × 900

| Caso | Estado inicial | Acción | SRX.role() | sr:session persistida | html.sr-guest | Sección visible | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|---|---|---|---|
| T01 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Abrir portada sin sesión | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T02 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Abrir Tiendas desde navegación pública | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T03 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Login comprador con Recordarme desmarcado; observar al primer estado autenticado | user | no | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T04 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Abrir Tiendas sin Recordarme | user | no | no | #tiendas (comprador) | rol=user; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T05 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Login comprador con Recordarme; observar al primer estado autenticado | user | sí | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T06 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Abrir Tiendas con Recordarme | user | sí | no | #tiendas (comprador) | rol=user; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T07 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Confirmar logout en sesión persistente y temporal | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T08 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Cancelar logout en ambos tipos de sesión | user | sí | no | #tiendas (comprador) | rol=user; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T09 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Recargar con sesión temporal | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T10 | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | Recargar con sesión persistente | user | sí | no | #tiendas (comprador) | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Alternar portada, catálogo y tiendas sin Recordarme | user | no | no | #tiendas (comprador) | rol=user; persistida=no; sr-guest=no; sección=comprador | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T12 | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | Logout confirmado y login del siguiente rol sin Recordarme | store | no | no | ninguna; vista del router | rol=store; persistida=no; sr-guest=no; sección=ninguna; vista=mi-tienda | rol=store; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-tienda | PASS |
| T13 | rol=store; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-tienda | Logout confirmado y login del siguiente rol sin Recordarme | found | no | no | ninguna; vista del router | rol=found; persistida=no; sr-guest=no; sección=ninguna; vista=mi-fundacion | rol=found; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-fundacion | PASS |
| T14 | rol=found; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=mi-fundacion | Logout confirmado y login del siguiente rol sin Recordarme | admin | no | no | ninguna; vista del router | rol=admin; persistida=no; sr-guest=no; sección=ninguna; vista=admin | rol=admin; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=admin | PASS |
| T15 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Probar sesiones inválidas al cargar y al invalidar la cuenta en memoria | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T16 | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | Recargar con preferencias ajenas a autenticación en ambos almacenamientos | invitado | no | sí | #tiendas-landing (pública) | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=publica | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |

Subcomprobaciones de los casos con más de una variante:

| Caso | Variante / destino | Estado observado | Resultado |
|---|---|---|---|
| T07 | persistente | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T07 | temporal | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T08 | temporal | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T08 | persistente | rol=user; memoria=sí; persistida=sí; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #/catalogo | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=catalogo | PASS |
| T11 | #inicio | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #tiendas | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T11 | #/catalogo | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=ninguna; vista del router; vista=catalogo | PASS |
| T11 | #inicio | rol=user; memoria=sí; persistida=no; sr-guest=no; sección=#tiendas (comprador); vista=portada | PASS |
| T15 | cuenta-inexistente | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | objeto-vacio | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | json-invalido | rol=invitado; memoria=no; persistida=sí; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |
| T15 | invalidacion-en-memoria | rol=invitado; memoria=no; persistida=no; sr-guest=sí; sección=#tiendas-landing (pública); vista=portada | PASS |

### Persistencia y sesiones inválidas

Sin Recordarme, la sesión existe únicamente en memoria y desaparece al recargar. Con Recordarme, sr:session permanece y la recarga conserva el comprador. Confirmar logout elimina la sesión y la clave; cancelar conserva ambos estados. Cada cambio de rol de las pruebas se realiza después de un logout confirmado.

T15 incluye cuenta inexistente, objeto vacío, JSON malformado e invalidación de la cuenta en memoria seguida de route(). Los tres primeros se prueban cargando un documento nuevo. El JSON malformado deja la clave presente, tal como hacía el core original: mem.get() devuelve null y el usuario continúa como invitado. No se introduce limpieza adicional. La invalidación en memoria no se guarda en la base demo y se descarta al cargar el siguiente documento.

T16 agrega preferencias no relacionadas en ambos almacenamientos (ui:user-theme y ui:login-panel). Ninguna cambia el estado invitado.

### Actualización oportuna

En T03 y T05 la clase ya está corregida al primer estado autenticado. En el registro authEvents de las evidencias, cada notificación de login lleva el rol válido y guest=false; las de logout/invalidez llevan role=null y guest=true. No hay sondeo de autenticación en setInterval. El cierre cancelado no emite eventos adicionales. La validación utiliza la implementación real del formulario, incluido su tiempo original de comprobación; no lo modifica.

## Accesos por rol

Se recorrieron las 19 rutas para invitado, comprador (user), tienda (store), fundación (found) y administrador (admin), en los tres tamaños. Los identificadores de tienda, fundación, playlist y vendedor se obtuvieron de los datos/enlaces reales del prototipo. Se comprueban destino alcanzado o redirección/bloqueo, rol conservado y clase visual.

| Destino | Acceso que conserva el router original |
|---|---|
| Inicio, catálogo, categoría, tienda pública, fundación pública, mapa, vendedor, funciones | Invitado y comprador |
| Playlist | Invitado, comprador y tienda |
| Marca | Los cinco estados |
| Perfil, probador, vender | Comprador |
| Mensajes | Comprador, tienda y fundación |
| Mi tienda | Tienda |
| Cuenta | Tienda y fundación |
| Mi fundación, donaciones | Fundación |
| Administración/resumen | Administrador |

Las 285 comprobaciones finales confirman el enrutador local. No certifican autorización de servidor. La comparación anterior también alcanza los destinos permitidos y rechaza los restringidos; sus 228 fallos del chequeo combinado corresponden a sr-guest incorrecto para sesiones temporales, no a nuevos fallos de permisos.

## Regresión responsive

Se revisaron portada, categorías, tiendas públicas, tiendas de comprador, formulario de login, confirmación de logout y menú (sheet móvil/tablet; navegación de escritorio). No se añadieron estilos. Los formularios de login, los botones del diálogo y la navegación de T01–T16 se accionaron en cada tamaño.

| Tamaño | Vista | innerWidth | Ancho cliente | scrollWidth | Overflow horizontal | Poppins | Imágenes cargadas / proporciones | Resultado |
|---|---|---:|---:|---:|---|---|---|---|
| movil | portada | 390 | 390 | 390 | no | sí | sí / sí | PASS |
| movil | categorias | 390 | 390 | 390 | no | sí | sí / sí | PASS |
| movil | tiendas-publicas | 390 | 390 | 390 | no | sí | sí / sí | PASS |
| movil | tiendas-comprador | 390 | 390 | 390 | no | sí | sí / sí | PASS |
| movil | login | 390 | 390 | 390 | no | sí | sí / sí | PASS |
| movil | logout-confirmacion | 390 | 390 | 390 | no | sí | sí / sí | PASS |
| movil | menu | 390 | 390 | 390 | no | sí | sí / sí | PASS |
| tablet | portada | 768 | 768 | 768 | no | sí | sí / sí | PASS |
| tablet | categorias | 768 | 768 | 768 | no | sí | sí / sí | PASS |
| tablet | tiendas-publicas | 768 | 768 | 768 | no | sí | sí / sí | PASS |
| tablet | tiendas-comprador | 768 | 768 | 768 | no | sí | sí / sí | PASS |
| tablet | login | 768 | 768 | 768 | no | sí | sí / sí | PASS |
| tablet | logout-confirmacion | 768 | 768 | 768 | no | sí | sí / sí | PASS |
| tablet | menu | 768 | 768 | 768 | no | sí | sí / sí | PASS |
| escritorio | portada | 1440 | 1425 | 1425 | no | sí | sí / sí | PASS |
| escritorio | categorias | 1440 | 1425 | 1425 | no | sí | sí / sí | PASS |
| escritorio | tiendas-publicas | 1440 | 1425 | 1425 | no | sí | sí / sí | PASS |
| escritorio | tiendas-comprador | 1440 | 1425 | 1425 | no | sí | sí / sí | PASS |
| escritorio | login | 1440 | 1440 | 1440 | no | sí | sí / sí | PASS |
| escritorio | logout-confirmacion | 1440 | 1440 | 1440 | no | sí | sí / sí | PASS |
| escritorio | menu | 1440 | 1425 | 1425 | no | sí | sí / sí | PASS |

En todas las vistas: CSS1Compat, doctype html, UTF-8 y meta viewport width=device-width, initial-scale=1. En escritorio, la barra vertical puede reducir clientWidth a 1425 mientras innerWidth sigue siendo 1440; esto no es desbordamiento. Los cinco personajes se recorrieron con los controles originales hasta 05: cinco imágenes cargadas y object-fit: contain en cada tamaño. Las imágenes lazy fuera del carrusel visible se verificaron después de desplazarse hacia ellas; no se consideran recursos rotos por no haberse cargado antes de entrar en pantalla.

Las fotografías de tiendas y el personaje público se conservan visualmente; las capturas comparativas muestran el cambio de composición previsto. No se detectaron deformaciones de las imágenes inspeccionadas. Los 173 recursos del prototipo siguen idénticos por SHA-256.

## Capturas antes / después

| Tamaño | Antes: comprador sin Recordarme con composición pública | Después: comprador sin Recordarme con sección de comprador | Pública correcta después |
|---|---|---|---|
| movil | [Antes](evidencias-sesion-tiendas/antes/movil-T04-sin-recordarme.jpg) | [Después](evidencias-sesion-tiendas/despues/movil-T04-sin-recordarme.jpg) | [Invitado](evidencias-sesion-tiendas/despues/movil-T02-invitado.jpg) |
| tablet | [Antes](evidencias-sesion-tiendas/antes/tablet-T04-sin-recordarme.jpg) | [Después](evidencias-sesion-tiendas/despues/tablet-T04-sin-recordarme.jpg) | [Invitado](evidencias-sesion-tiendas/despues/tablet-T02-invitado.jpg) |
| escritorio | [Antes](evidencias-sesion-tiendas/antes/escritorio-T04-sin-recordarme.jpg) | [Después](evidencias-sesion-tiendas/despues/escritorio-T04-sin-recordarme.jpg) | [Invitado](evidencias-sesion-tiendas/despues/escritorio-T02-invitado.jpg) |

- [Logout confirmado — escritorio](evidencias-sesion-tiendas/despues/escritorio-T07-logout.jpg).
- [Logout cancelado — escritorio](evidencias-sesion-tiendas/despues/escritorio-T08-cancelado.jpg).
- [Panel tienda](evidencias-sesion-tiendas/despues/escritorio-T12-panel.jpg), [panel fundación](evidencias-sesion-tiendas/despues/escritorio-T13-panel.jpg), [panel administración](evidencias-sesion-tiendas/despues/escritorio-T14-panel.jpg).
- [Menú de comprador — móvil](evidencias-sesion-tiendas/despues/movil-menu-comprador.jpg).

Las capturas son de viewport completo en las dimensiones solicitadas y contienen datos de demostración del prototipo. No contienen contraseñas ni contenido de sesiones. El mensaje de bienvenida puede permanecer brevemente en algunas imágenes; el resultado funcional se registró antes de la captura.

## Consola y limitaciones

No se observaron excepciones JavaScript en las pruebas funcionales, de rutas ni responsive. Las ejecuciones comparables de rutas antes/después producen las mismas tres firmas SVG heredadas de 09-charts.js (width negativos -0.6, -16 y -112), con 1296, 108 y 216 ocurrencias respectivamente. 09-charts.js se conserva idéntico. También permanece la petición automática /favicon.ico con 404; no hay nuevos recursos fallidos en esas ejecuciones. No se corrigieron esos avisos.

La autenticación sigue siendo una simulación local HTML/CSS/JavaScript. No se implementa JWT, backend, ni sincronización de la sesión entre pestañas. Se mantiene la forma en que el core original lee el almacenamiento al iniciar y conserva su estado en memoria. Estas pruebas usan Chrome emulado y click DOM con hit-test, no dispositivos físicos ni pulsaciones táctiles nativas. No se modifican otros navegadores ni otros requisitos. No se detectaron regresiones dentro del alcance comprobado.

## Integridad y validación Git

De los 479 archivos existentes en main, únicamente cambian los dos JavaScript indicados: **477 archivos conservan exactamente su SHA-256**. De los 198 archivos del prototipo, 196 permanecen idénticos; el HTML, los cuatro CSS y los 173 recursos gráficos están intactos. Se preservan README, Word/PDF, diagramas, manual, datos demo, permisos, prototipo/index.html anterior y .idea.

Una comparación adicional revierte únicamente las nuevas llamadas/función authChanged en memoria y obtiene exactamente el core anterior: la lógica de persistencia, datos y enrutador no se altera. El bloque de fotografías y enlaces de tiendas coincide íntegramente. El checkout original conserva su rama y sus dos archivos .idea locales sin cambios.

Se ejecutaron git diff --check, git status --short y git diff --stat antes de publicar. El alcance esperado es dos archivos funcionales modificados y este informe con sus evidencias nuevas. No se instalan dependencias y no se hace merge automático.

## Registros completos

- [Casos funcionales antes](evidencias-sesion-tiendas/funcionales-antes.json) y [después](evidencias-sesion-tiendas/funcionales-despues.json): estados iniciales, esperados, observados, variantes y auditoría síncrona.
- [Enrutador antes](evidencias-sesion-tiendas/router-antes.json) y [después](evidencias-sesion-tiendas/router-despues.json): 285 comprobaciones por ejecución y consola.
- [Responsive final](evidencias-sesion-tiendas/responsive.json): geometría, controles, imágenes, fuentes, carrusel y overflow.
- [Integridad](evidencias-sesion-tiendas/integridad.json): hashes de los 477 archivos protegidos, lista de 20 JS comprobados y comparación de errores.
