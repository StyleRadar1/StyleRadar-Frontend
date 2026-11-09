# StyleRadar · Prototipo unificado

**Archivo:** `StyleRadar_Prototipo_Unificado.html` (un solo archivo, 70 MB con imágenes y videos dentro)
**Fecha:** 8 de noviembre de 2026
**Base:** rama `develop` de StyleRadar1/StyleRadar-Frontend (`ff40116`), según el *Reparto de tareas Front y Marketing v10*.

La integración se hizo en una copia aparte: el repositorio del equipo no se modificó.

## Revisión posterior en el repositorio

En la revisión del 8 de noviembre se sincronizaron también en `public/prototipo/` los cambios de Kevin para el nuevo inicio (P16), el probador por etapas y reintento (S4), la limpieza de secciones antiguas (S5) y RF-14/RF-16. El modo «Mi foto» incluye ahora los controles de ajuste de las capas de ropa tanto al entrar al probador desde el menú como desde los enlaces del landing: tamaño, ancho, altura y arrastre. El arrastre queda limitado para que la capa no desaparezca de la foto y se cancela correctamente si el navegador interrumpe el gesto.

La pantalla React `/probador` usa el resultado ya compuesto por el servicio de probador. El contrato actual solo envía `photoId` y `garmentId`; no envía las coordenadas del ajuste manual. Por eso el ajuste visual por capas del prototipo no altera el resultado generado por el servicio. Para que esa pantalla aplique los mismos controles al resultado real, el backend debe aceptar y documentar parámetros de ajuste o soportar una operación de edición posterior.

## Qué incluye

| Paquete | Qué hace | Responsable | Rama (commit) |
|---|---|---|---|
| P1 · Estructura del landing | 8 secciones en el orden del reparto, menú con anclas, «Ver planes» en el hero, pie con enlaces | Cristian | `landing-estructura-temas` (`4ec3065`) |
| P3 · Categorías | Imagen grande, explicación y miniaturas que pasan al centro | Carlos | `landing-categorias` (`962569a`) |
| P4 y P5 · Videos y carrusel | Tres videos con pasos sincronizados | Kevin | `landing-videos` (`400605b`) |
| P6 · Ciclo de la ropa | Tiendas, segunda vida y fundaciones en tres pestañas | Carlos | `landing-ciclo` (`a9bbd7f`) |
| P7 · Planes | Cuatro planes con botones de registro | Daniel | `planes-acceso-DanielBarrera` |
| P8 · Bloqueo por plan | Candados y contadores de uso | Daniel | `planes-acceso-DanielBarrera` |
| P9 · Mapa en el landing | Mapa interactivo con Mapbox | Julian | `landing-mapa` (`8eabc37`) |
| P11 · Mosaico | Tarjetas más pequeñas, más prendas por fila | Cristian | `landing-estructura-temas` |
| P12 · Fondo liviano | Reemplaza el fondo de vidrio | Cristian | `landing-estructura-temas` |
| P13 · Temas | Claro, oscuro y daltónico, con selector | Cristian | `landing-estructura-temas` |
| P14 · Ingreso con Google | Reemplaza el código OTP | Daniel | `planes-acceso-DanielBarrera` |
| P15 · Guía de primera vez | Recorrido interactivo al entrar | Carlos | `landing-guia` (`a2dcbfa`) |
| P16 · Nuevo inicio | Saludo, accesos rápidos y prendas cerca, sin página intermedia | Kevin | `landing-inicio` (`e30692d`) |
| S2 · Accesibilidad | Saltar al contenido, foco y contraste | Cristian | `landing-estructura-temas` |
| S4, S5 y RF-14/16 | Probador por etapas con reintento, limpieza de la página larga, «Más cerca» y prendas similares | Kevin | `landing-inicio` |
| Estadísticas | Pantallas de estadísticas por rol con datos de prueba | Julian | `landing-pagos-estadisticas` (`4e677b4`) |
| RNF-07 | Tablas de administración como tarjetas en celular | Daniel | `planes-acceso-DanielBarrera` |

## Qué falta (no está en ninguna rama)

| Paquete | Estado en el HTML |
|---|---|
| P2 · Video «Cómo funciona» (Julian) | Queda el espacio reservado de Cristian, con la lista de pasos como relleno |
| P10 · Representantes (Kevin) | Queda el espacio reservado; la rama `landing-representantes` está vacía |
| S3 · Registro por pasos (Julian) | No se encontró en ninguna rama |
| Imágenes de categorías (P3) | La sección pide `streetwear.jpg`, `elegante.jpg`, `vintage.jpg` y `techwear.jpg`, que aún no existen; muestra un relleno |

**No se incluyó:**
- `probador-ia-prueba`: el propio commit dice «en evaluación, no aprobado».
- `experiencia-probador-segunda-vida`: solo cambia React, no el prototipo.

## Decisiones al unir

1. **El mapa borraba trabajo de Kevin.** La rama `landing-mapa` parte del commit de Kevin (`c150afa`), pero sus archivos `05-core.js`, `06-user.js`, `12-req.js`, `13-v2.js`, `13b-v3.js`, `02-portada.js`, `requerimientos.css` e `index.html` vuelven a la versión de `develop`. Eso deshacía S4, S5, P16, RF-14 y RF-16, y volvía a traer `10-lock.js`. Se unió tomando `develop` como base para esos archivos. Así entraron todos los cambios del mapa (por ejemplo, 362 de 362 líneas nuevas en `06-user.js`) sin perder las de Kevin, y `10-lock.js` sigue eliminado.
2. **Estructura del landing.** Se usó el esqueleto de 8 secciones de Cristian, y cada espacio reservado se reemplazó por la sección real de su responsable. «Qué es» y «Para quién» salen del landing, como en la estructura de Cristian; «El problema» queda dentro de «Quiénes somos».
3. **Colores del landing.** Se conservaron los degradados de Carlos y Julian, cambiando los colores fijos por las variables de tema de Cristian para que funcionen los modos claro, oscuro y daltónico.
4. **Mapa antiguo.** `12-req.js` ya no tiene el mapa SVG antiguo: Julian lo reemplazó por el de Mapbox. El ajuste de accesibilidad que Cristian le había hecho al mapa antiguo no aplica.
5. **Videos en un solo archivo.** Al incrustar los videos, cada uno queda como una dirección `data:` de 9 a 14 MB, y Chrome no reproduce direcciones tan largas en `<video>`. En el script de Kevin (`22-videos.js`) se agregó `srcDeVideo`, que convierte el video en blob justo antes de reproducirlo. Solo aplica al HTML de un solo archivo; en el repo, con los videos como archivos, no hace falta.
6. **Hojas de estilo.** Las de Cristian (temas, accesibilidad, fondo liviano y mosaico) se cargan al final, como él las dejó, para que tengan prioridad.

## Lo que se probó

- El landing muestra las 8 secciones en orden, con categorías, ciclo, videos, planes, mapa y selector de tema funcionando.
- Ingreso con Google, nuevo inicio «Hola, Valentina», guía de primera vez, P8 con plan gratis, mosaico de 5 columnas, estadísticas de tienda y tablas de admin en celular.
- Sin errores de JavaScript del prototipo.

**No se probó:** el aspecto visual en pantalla ni el modo claro y daltónico en cada sección.

## A tener en cuenta

- **El mapa depende de Mapbox y de internet.** Durante la prueba Mapbox rechazó parte de las teselas por límite de uso (error 429). Además, el token de Mapbox está escrito en el código (`00-config.js`); conviene revisarlo en el análisis de seguridad (S9).
- **Peso del archivo:** 70 MB, de los cuales unos 36 MB son los tres videos de Kevin. Al abrirlo tarda unos segundos.
