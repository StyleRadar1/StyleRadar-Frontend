# StyleRadar | Matriz de correcciones: arquitectura 1.1 → 2.0

**Referencia fija:** repositorio `JUANNICOLASA/Frontend-Style-Radar`, commit `f72f71db7c9e9c6a8f8717e5c3a154c8a9cb932f`, carpeta completa `styleradar-frontend-v3/prototipo/StyleRadar_prototipo/`.

**Criterio de evidencia:** **N** observado en Chrome; **C** encontrado en código sin ejecución de ciclo completo; **P** diseño de futura integración React/Spring Boot. **Las 95 comprobaciones de ruta prueban el router local, no el backend.**

| Prioridad | Sección / artefacto de v1.1 | Cambio necesario en v2.0 | Evidencia / estado |
|---|---|---|---|
| P0 | Resumen; §§3, 5, 8, 12; README | Corregir entrada ejecutable: no es `prototipo/index.html` monolítico. La fuente es la **carpeta final entera**, con un `index.html`, 20 JS, 4 CSS y 173 imágenes. | C + Chrome; inventario §§1,4 |
| P0 | §6 matriz de pantallas | Sustituir accesos supuestos por **19 destinos × 5 roles**: portada, catálogo, tienda pública, fundación pública y mapa son para invitado/comprador, no para tienda/fundación/admin. | N: 95/95, R01 |
| P0 | Diagramas 01–05 | Redibujar recorridos por actor, errores, redirecciones, overlays y estado de simulación, sin agregar rutas inexistentes. | N/C: matriz del inventario §3 |
| P0 | §11.4 responsive | Reconocer ausencia `meta viewport`; un móvil de 390px recibe ancho CSS de 980. Faltan doctype y charset explícitos; HTML en BackCompat. | N: M01 |
| P0 | §8 probador/wishlist | Corazón individual y guardado de look funcionan localmente; «Todo a la wishlist» solo muestra aviso. No afirmar IA/RA. | N: F06–F11 |
| P0 | §8 admin/pagos | Existe tabla de pagos con estados, pero «Exportar a Excel» no descarga nada; cobros y reembolsos son simulaciones. | N: F15; C: acciones de pago |
| P1 | §8 portada/categorías | **Cinco personajes de marca** en portada no son las **seis categorías** del catálogo; las tarjetas de personaje cambian selección sin navegar a filtros. | N: F02–F03 |
| P1 | §8 tienda, fundación, mensajes | Revisión de secciones según rutas reales; no certificar ciclos completos de subida de fotos, mensajería y recepción de donaciones. | N: F12–F13; C: pendientes |
| P1 | §8 playlists | Declaración `MAXPL=15` y bloqueo de playlist completa; prueba del caso límite de 15 no ejecutada. | C: `js/06-user.js` |
| P1 | §8 tiendas/RF74 | Máximo de seis fotos de local localizado; no se completó la carga con archivos. | C: `js/07-pro.js` |
| P1 | §8 destacadas/RF72 | Una playlist se puede marcar como destacada en datos locales; no es prueba de contrato backend. | N: F14 |
| P1 | §10 sesión | Sin marcar «Recordarme», un comprador autenticado conserva diseño de tiendas invitado por detector de almacenamiento genérico. | N: F16 |
| P1 | §10 credenciales | Registrar que la demo contiene contraseñas en claro en `sr:db5`, sin transferir esa práctica a la arquitectura propuesta. | N/C: F17 |
| P1 | §9 arquitectura futura | Mantener React/Vite, módulos nivel 3, cliente HTTP y autorización del servidor como **propuesta**, no implementado. | P: documento v1.1; inventario §5 |
| P1 | §11 identidad visual | Incorporar imágenes y personajes propios, portadas editoriales, capturas actuales y reglas 60/30/10 del manual. | Manual de identidad vigente |
| P1 | §12 capturas | Cambiar mockups del prototipo antiguo por capturas reales de Chrome, separando CSS 390 de emulación de dispositivo con defecto. | N: 18 JPG seleccionadas |
| P2 | README / plan Sprint 4 | Actualizar enlaces/rutas y distinguir evidencia N/C de RF72–RF75; mantener intactos sus estados y no cerrar HU/Jira. | Inventario §5–6 |

## Permisos esenciales corregidos

| Destino | Invitado | Comprador | Tienda | Fundación | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `#inicio`, `#/catalogo`, `#/categoria/:clave`, `#/tienda/:id`, `#/fundacion/:id`, `#/mapa` | Sí | Sí | No | No | No |
| `#/playlist/:id` | Sí | Sí | Sí | No | No |
| `#/marca` | Sí | Sí | Sí | Sí | Sí |
| `#/vender`, `#/probador`, `#/perfil` | No | Sí | No | No | No |
| `#/mensajes` | No | Sí | Sí | Sí | No |
| `#/mi-tienda` | No | No | Sí | No | No |
| `#/cuenta` | No | No | Sí | Sí | No |
| `#/mi-fundacion`, `#/donaciones` | No | No | No | Sí | No |
| `#/admin/...` | No | No | No | No | Sí |

**Estado histórico del análisis:** el paquete se preparó fuera del repositorio sobre `f72f71db7c9e9c6a8f8717e5c3a154c8a9cb932f`, de la rama `docs/sprint4-arquitectura-frontend`; las comparaciones de esa rama con main describían únicamente aquel momento previo a la integración.

**Estado actual confirmado:** el prototipo final ya está integrado en `main` por el [PR #2](https://github.com/JUANNICOLASA/Frontend-Style-Radar/pull/2), merge `53def7934646c38fcf99d3af65318fa2614e77f2`, base de esta publicación documental. Se comprobó su ascendencia y la carpeta completa de 198 archivos. `f72f71d` se conserva como origen técnico, no como una integración pendiente. Esta entrega publica documentación v2.0 en una rama separada; no cambia estados de RF ni Jira. Véase la [validación documental](validacion-documental-sprint4-v2.md).

**Pruebas todavía necesarias:** límite de 15 prendas, alta completa de fotos, mensajería, publicaciones y donaciones de extremo a extremo, verificación responsive tras meta viewport, pruebas WCAG, autorización de servidor y contratos Swagger. La matriz no equivale a un cierre de los 75 RF.
