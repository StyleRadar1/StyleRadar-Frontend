# Validación de la corrección inicial de viewport y responsive

Fecha local: 18 de octubre de 2026 (Colombia). Rama: `fix/responsive-viewport`. Base de main: `951ed02e22b6baf1d19bff3384d3ae7436f3798a`, merge del [PR #3](https://github.com/JUANNICOLASA/Frontend-Style-Radar/pull/3). Main se actualizó mediante `fetch` y fast-forward en un worktree aislado. La copia de trabajo y los dos archivos .idea locales preexistentes permanecen intactos.

## Resultado y alcance

El prototipo final pasa de BackCompat a **CSS1Compat (Standards Mode)**. En Chrome móvil emulado de 390 px, `innerWidth` pasa de 980 a 390. En tablet de 768 px pasa de 980 a 768. Escritorio mantiene 1440. Se aprovechan las media queries existentes y se corrigen únicamente tres problemas de disposición: controles superpuestos del probador, cabecera de cierre del registro y separación de anclas bajo el menú fijo.

**364/364 comprobaciones aprobadas**, incluidas **285/285 de enrutamiento local** (19 destinos × 5 condiciones de acceso × 3 tamaños). Se conservan 47 parejas antes/después, 32 capturas de interacción y 23 con movimiento normal: **149 capturas reales** de Chrome. No se acredita autorización del servidor ni cierre de RF.

## Defecto original y archivos corregidos

| Archivo existente | Corrección |
|---|---|
| `prototipo/StyleRadar_prototipo/index.html` | Se anteponen solamente `<!DOCTYPE html>`, `meta charset="UTF-8"` y `meta name="viewport" content="width=device-width, initial-scale=1"`. El resto permanece idéntico. |
| `prototipo/StyleRadar_prototipo/css/version-4.css` | Se añade un bloque final de media queries. Hasta 900 px: margen de anclas y espacio en auth-stack para mantener visible Cerrar. Hasta 620 px: controles del probador con ajuste de línea y espacio reservado para maniquí/foto. Las reglas originales se conservan. |

El ajuste de auth-card usa `!important` únicamente para superar el máximo de altura ya declarado con esa prioridad en version-3.css. No cambia validaciones, campos, eventos, datos ni autenticación. Los controles del probador conservan su funcionamiento y tienen separación comprobada por rectángulos, sin intersecciones.

## Entorno y metodología

- Navegador real instalado: **Chrome/154.0.8037.57**; modo headless, perfil de prueba independiente y servidor HTTP en loopback que sirve toda la carpeta final.
- Emulación de móvil y tablet con `mobile: true`, soporte táctil habilitado y escala de dispositivo 1. Escritorio con `mobile: false`. Las dimensiones de captura son exactamente las solicitadas.
- Antes de editar se tomaron referencias y hashes; una copia inmutable de los 198 archivos permitió repetir comparaciones de forma aislada. Las series iniciales con estado de modal arrastrado se descartaron de la entrega.
- Las capturas entregadas esperan la asignación diferida de fotografías y encuadran la sección seleccionada mediante scroll. Se capturan píxeles reales del navegador, sin recortes, retoques ni sustitución de personajes.
- Comparaciones estables con `prefers-reduced-motion: reduce`; serie separada con movimiento normal para portada, personajes, acceso, registro, probador y administración. No se desactivan animaciones en el código del producto. Las muestras de movimiento normal pueden registrar una transición en curso; la comparación legible usa las capturas estables.
- Las pruebas de interfaz usan `HTMLElement.click()` después de comprobar visibilidad y `elementFromPoint`. Hubo inestabilidad del canal de entrada nativa CDP; no se presenta esta batería como una prueba de toques físicos o teclado de un teléfono.
- Login se ejecuta mediante los formularios y cuentas demo. Las rutas usan sesiones de prueba aisladas; no se modifican los archivos de datos. No se crean nuevas cuentas reales ni se invoca backend.

## Medidas comprobadas

| Tamaño | Emulación | innerWidth antes | innerWidth después | Modo antes → después | Desbordamiento de página después |
|---|---|---:|---:|---|---|
| 390 × 844 | Móvil | 980 | 390 | BackCompat → CSS1Compat | No |
| 768 × 1024 | Tablet móvil | 980 | 768 | BackCompat → CSS1Compat | No |
| 1440 × 900 | Escritorio | 1440 | 1440 | BackCompat → CSS1Compat | No |

En escritorio, `documentElement.clientWidth` es 1425 en vistas con barra vertical y 1440 al bloquear el fondo del modal. Esta reserva de 15 px no es desbordamiento. En las 47 capturas finales `scrollWidth <= clientWidth`. Se conservan los desplazamientos internos intencionales de carruseles, pestañas, tablas y el menú administrativo fuera del lienzo cuando está cerrado.

## Comprobaciones aprobadas

| Grupo | Resultado |
|---|---|
| Router | 285/285; mismos roles y redirecciones esperados. Exclusivamente acceso local. |
| Login | 12/12 ingresos: comprador, tienda, fundación y administrador en los tres tamaños. |
| Credenciales incorrectas | 3/3 rechazos sin iniciar sesión. |
| Registro | 12/12 formularios por rol con envío alcanzable por scroll; 12/12 cierres accesibles. No se ejecuta alta de cuentas. |
| Menú público | Abre y navega a categorías en móvil y tablet. |
| Anclas | 15/15 comprobaciones de títulos sin quedar debajo de la barra fija. |
| Personajes | 3/3 recorridos hasta el quinto personaje, cinco originales cargados, object-fit contain y contador correcto. |
| Catálogo | 3/3 búsquedas locales de camisa mediante el formulario. |
| Probador | 3/3 controles sin solapamiento y dentro del viewport; cambio de maniquí, foto de ejemplo y capa de prenda comprobados en cada tamaño. |
| Administración | Acceso a pagos en los tres tamaños; menú lateral móvil/tablet utilizable. Las tablas mantienen su scroll interno. |
| Identidad | Poppins, colores y composición conservados; 173 recursos gráficos y los 20 JS idénticos a la base. |
| JavaScript | Cero excepciones en capturas, navegación e interacción, tanto antes como después. |
| Animaciones | 23 capturas con movimiento normal sin errores nuevos; portada, personajes, pila de auth y gráficos continúan operativos. |

Los datos completos, controles, rectángulos, imágenes, tamaños y estados están en los JSON enlazados al final. Los eventos repetidos de consola se agrupan por firma con conteos, escenas y una traza representativa; se conservan los registros brutos fuera del repositorio. Esta batería no sustituye WCAG ni E2E con servidor.

## Capturas comparativas

Cada fila enlaza las capturas completas. Son del prototipo final, no de los mockups históricos. La vista de registro incluye una captura adicional al final del desplazamiento.

### Móvil 390 × 844

| Pantalla | Antes | Después |
|---|---|---|
| Portada | [Antes](evidencias-responsive-viewport/antes/movil-portada.jpg) | [Después](evidencias-responsive-viewport/despues/movil-portada.jpg) |
| Categorías y personajes | [Antes](evidencias-responsive-viewport/antes/movil-categorias.jpg) | [Después](evidencias-responsive-viewport/despues/movil-categorias.jpg) |
| Arma. Pruébate. Sal. | [Antes](evidencias-responsive-viewport/antes/movil-arma.jpg) | [Después](evidencias-responsive-viewport/despues/movil-arma.jpg) |
| Playlists | [Antes](evidencias-responsive-viewport/antes/movil-playlists.jpg) | [Después](evidencias-responsive-viewport/despues/movil-playlists.jpg) |
| Tiendas públicas | [Antes](evidencias-responsive-viewport/antes/movil-tiendas.jpg) | [Después](evidencias-responsive-viewport/despues/movil-tiendas.jpg) |
| Catálogo | [Antes](evidencias-responsive-viewport/antes/movil-catalogo.jpg) | [Después](evidencias-responsive-viewport/despues/movil-catalogo.jpg) |
| Segunda vida | [Antes](evidencias-responsive-viewport/antes/movil-segunda-vida.jpg) | [Después](evidencias-responsive-viewport/despues/movil-segunda-vida.jpg) |
| Inicio de sesión | [Antes](evidencias-responsive-viewport/antes/movil-login.jpg) | [Después](evidencias-responsive-viewport/despues/movil-login.jpg) |
| Registro | [Antes](evidencias-responsive-viewport/antes/movil-registro.jpg) | [Después](evidencias-responsive-viewport/despues/movil-registro.jpg) |
| Registro al final | [Antes](evidencias-responsive-viewport/antes/movil-registro-final.jpg) | [Después](evidencias-responsive-viewport/despues/movil-registro-final.jpg) |
| Probador | [Antes](evidencias-responsive-viewport/antes/movil-probador.jpg) | [Después](evidencias-responsive-viewport/despues/movil-probador.jpg) |
| Panel comprador | [Antes](evidencias-responsive-viewport/antes/movil-comprador.jpg) | [Después](evidencias-responsive-viewport/despues/movil-comprador.jpg) |
| Panel tienda | [Antes](evidencias-responsive-viewport/antes/movil-tienda.jpg) | [Después](evidencias-responsive-viewport/despues/movil-tienda.jpg) |
| Panel fundación | [Antes](evidencias-responsive-viewport/antes/movil-fundacion.jpg) | [Después](evidencias-responsive-viewport/despues/movil-fundacion.jpg) |
| Panel administración | [Antes](evidencias-responsive-viewport/antes/movil-administracion.jpg) | [Después](evidencias-responsive-viewport/despues/movil-administracion.jpg) |
| Menú | [Antes](evidencias-responsive-viewport/antes/movil-menu.jpg) | [Después](evidencias-responsive-viewport/despues/movil-menu.jpg) |

### Tablet 768 × 1024

| Pantalla | Antes | Después |
|---|---|---|
| Portada | [Antes](evidencias-responsive-viewport/antes/tablet-portada.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-portada.jpg) |
| Categorías y personajes | [Antes](evidencias-responsive-viewport/antes/tablet-categorias.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-categorias.jpg) |
| Arma. Pruébate. Sal. | [Antes](evidencias-responsive-viewport/antes/tablet-arma.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-arma.jpg) |
| Playlists | [Antes](evidencias-responsive-viewport/antes/tablet-playlists.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-playlists.jpg) |
| Tiendas públicas | [Antes](evidencias-responsive-viewport/antes/tablet-tiendas.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-tiendas.jpg) |
| Catálogo | [Antes](evidencias-responsive-viewport/antes/tablet-catalogo.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-catalogo.jpg) |
| Segunda vida | [Antes](evidencias-responsive-viewport/antes/tablet-segunda-vida.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-segunda-vida.jpg) |
| Inicio de sesión | [Antes](evidencias-responsive-viewport/antes/tablet-login.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-login.jpg) |
| Registro | [Antes](evidencias-responsive-viewport/antes/tablet-registro.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-registro.jpg) |
| Registro al final | [Antes](evidencias-responsive-viewport/antes/tablet-registro-final.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-registro-final.jpg) |
| Probador | [Antes](evidencias-responsive-viewport/antes/tablet-probador.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-probador.jpg) |
| Panel comprador | [Antes](evidencias-responsive-viewport/antes/tablet-comprador.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-comprador.jpg) |
| Panel tienda | [Antes](evidencias-responsive-viewport/antes/tablet-tienda.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-tienda.jpg) |
| Panel fundación | [Antes](evidencias-responsive-viewport/antes/tablet-fundacion.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-fundacion.jpg) |
| Panel administración | [Antes](evidencias-responsive-viewport/antes/tablet-administracion.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-administracion.jpg) |
| Menú | [Antes](evidencias-responsive-viewport/antes/tablet-menu.jpg) | [Después](evidencias-responsive-viewport/despues/tablet-menu.jpg) |

### Escritorio 1440 × 900

| Pantalla | Antes | Después |
|---|---|---|
| Portada | [Antes](evidencias-responsive-viewport/antes/escritorio-portada.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-portada.jpg) |
| Categorías y personajes | [Antes](evidencias-responsive-viewport/antes/escritorio-categorias.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-categorias.jpg) |
| Arma. Pruébate. Sal. | [Antes](evidencias-responsive-viewport/antes/escritorio-arma.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-arma.jpg) |
| Playlists | [Antes](evidencias-responsive-viewport/antes/escritorio-playlists.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-playlists.jpg) |
| Tiendas públicas | [Antes](evidencias-responsive-viewport/antes/escritorio-tiendas.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-tiendas.jpg) |
| Catálogo | [Antes](evidencias-responsive-viewport/antes/escritorio-catalogo.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-catalogo.jpg) |
| Segunda vida | [Antes](evidencias-responsive-viewport/antes/escritorio-segunda-vida.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-segunda-vida.jpg) |
| Inicio de sesión | [Antes](evidencias-responsive-viewport/antes/escritorio-login.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-login.jpg) |
| Registro | [Antes](evidencias-responsive-viewport/antes/escritorio-registro.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-registro.jpg) |
| Registro al final | [Antes](evidencias-responsive-viewport/antes/escritorio-registro-final.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-registro-final.jpg) |
| Probador | [Antes](evidencias-responsive-viewport/antes/escritorio-probador.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-probador.jpg) |
| Panel comprador | [Antes](evidencias-responsive-viewport/antes/escritorio-comprador.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-comprador.jpg) |
| Panel tienda | [Antes](evidencias-responsive-viewport/antes/escritorio-tienda.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-tienda.jpg) |
| Panel fundación | [Antes](evidencias-responsive-viewport/antes/escritorio-fundacion.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-fundacion.jpg) |
| Panel administración | [Antes](evidencias-responsive-viewport/antes/escritorio-administracion.jpg) | [Después](evidencias-responsive-viewport/despues/escritorio-administracion.jpg) |

## Regresiones y problemas detectados

- El primer cambio de cabecera activó los breakpoints móviles y dejó los controles del probador demasiado juntos. Se corrigió con flex-wrap y espacio para la imagen. En el original el test de solapamiento también falla en móvil/tablet; en la entrega pasa en los tres tamaños.
- El registro largo podía ocupar el área del botón Cerrar al mostrar el layout móvil. La reserva de espacio de auth-stack mantiene el cierre independiente y permite scroll hasta el envío en los cuatro roles.
- Algunos títulos de secciones coincidían con la barra fija al navegar por anclas; se añade margen de scroll solo hasta 900 px.
- No se detectan regresiones importantes pendientes introducidas por este cambio en los tamaños y recorridos probados. Las diferencias normales de maquetación entre Quirks y Standards se revisaron mediante capturas; no se exige igualdad píxel a píxel.

## Consola y diagnóstico heredado

Las series visuales y de movimiento normal solo muestran el 404 de `/favicon.ico` existente. La secuencia continua de interacción/rutas produce **1.711 mensajes antes y 1.711 después**, con las mismas firmas y cantidades:

| Mensaje | Original | Corregido |
|---|---:|---:|
| Favicon 404 | 1 | 1 |
| SVG rect width = -0.6 | 1368 | 1368 |
| SVG rect width = -16 | 114 | 114 |
| SVG rect width = -112 | 228 | 228 |

Las trazas de los mensajes SVG apuntan a `js/09-charts.js` durante navegación y redibujado; la medición de vistas ocultas es la causa probable. Ese archivo es idéntico a la base. El diagnóstico se reprodujo contra el original; no se ocultaron ni suprimieron mensajes y no se modificó JS para resolverlos. Se mantienen como pendiente independiente. **No se afirma que la consola esté vacía; se comprobó que no hay firmas nuevas en las secuencias comparadas.**

## Integridad y protección de alcance

- Base: 322 archivos versionados. Solo dos archivos existentes cambian; **320 conservan SHA-256**.
- El prototipo mantiene 198 archivos. Los 20 JS y 173 recursos gráficos siguen idénticos. No se cambian fotografías, mascotas, manual, datos demo, roles ni permisos.
- README, Word/PDF de arquitectura v1.1/v2.0, diagramas previos, backend y archivos de compañeros permanecen intactos.
- El contenido HTML anterior permanece idéntico tras retirar las tres líneas añadidas. version-4.css conserva todas sus reglas originales y añade las media queries al final.
- No se instalan React ni dependencias frontend. No se modifican estados de RF ni Jira.
- Se ejecutan `git status --short`, `git diff --check` y `git diff --stat`, revisión de la lista permitida e integridad antes de commit/push.

## Evidencia técnica

- [Resumen de resultados](evidencias-responsive-viewport/resumen.json).
- [Hashes de integridad y archivos protegidos](evidencias-responsive-viewport/integridad.json).
- [47 referencias originales y medidas](evidencias-responsive-viewport/antes/resultados.json).
- [47 capturas finales y medidas](evidencias-responsive-viewport/despues/resultados.json).
- [364 comprobaciones y 32 capturas adicionales](evidencias-responsive-viewport/interacciones/resultados.json).
- [Reproducción de la secuencia sobre el original](evidencias-responsive-viewport/diagnostico-original/resultados.json).
- [23 capturas con movimiento normal](evidencias-responsive-viewport/animaciones/resultados.json).

## Reproducción manual y pendientes

Desde `styleradar-frontend-v3/`, servir `prototipo/StyleRadar_prototipo/` como raíz con un servidor HTTP local ya instalado. Por ejemplo, si Python está disponible:

```shell
python -m http.server 8080 --bind 127.0.0.1 --directory prototipo/StyleRadar_prototipo
```

Abrir `http://127.0.0.1:8080/index.html` en Chrome. En DevTools, probar 390 × 844 y 768 × 1024 con emulación móvil y 1440 × 900 en escritorio; comprobar `document.compatMode`, `innerWidth`, `document.documentElement.clientWidth` y `scrollWidth`. Recorrer las pantallas de la tabla, cambiar los cuatro roles con las cuentas demo y probar formularios, menús y scroll. La prueba automatizada se ejecutó con Node 24 y CDP, sin librerías frontend.

Pendientes: dispositivo físico Android/iOS, Safari/Firefox, teclado virtual, zoom del usuario, orientación horizontal y tamaños adicionales; auditoría WCAG de contraste, foco y objetivos táctiles; ciclos completos de registro, publicación, mensajería, donación y pagos/backend. El probador sigue siendo una superposición simulada, sin IA/RA real. Los defectos funcionales conocidos (wishlist global, exportación XLSX, detector sin Recordarme y gráficos ocultos) no se corrigen aquí.

El PR se propone hacia main sin merge automático. Publicar este ajuste no cierra otros requisitos.
