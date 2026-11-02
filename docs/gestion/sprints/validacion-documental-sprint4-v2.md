# Validación documental — Sprint 4 — Arquitectura frontend v2.0

Fecha: 18 de octubre de 2026. Rama: `docs/sprint4-arquitectura-v2`. Publicación propuesta mediante PR hacia main; este documento no declara fusionada la documentación v2.0.

## Base e integración del prototipo

- Main actualizado exclusivamente mediante fast-forward, tras `git fetch origin`. Base comprobada: `53def7934646c38fcf99d3af65318fa2614e77f2`.
- El [PR #2](https://github.com/JUANNICOLASA/Frontend-Style-Radar/pull/2) ya integró el prototipo final. Su merge es ancestro de HEAD al crear esta rama.
- Origen técnico del prototipo: `f72f71db7c9e9c6a8f8717e5c3a154c8a9cb932f`, rama histórica `docs/sprint4-arquitectura-frontend`. Las notas sobre divergencia con main del análisis original describían un momento anterior al merge.
- Carpeta final: [StyleRadar_prototipo](../../prototipo/StyleRadar_prototipo/). Contiene 198 archivos: 1 HTML, 4 CSS, 20 JS y 173 recursos gráficos.
- Árbol Git de esa carpeta, idéntico en el origen y en la base: `21c8399c6dd3601e0cfa552c7b2aaab5e559a9d3`. Se verifica nuevamente antes de publicar.
- La copia de trabajo original conserva su rama, HEAD y los dos archivos .idea locales preexistentes. Se trabajó en un worktree separado; no se guardaron ni sobrescribieron cambios de otras personas.

## Inspección del paquete e inventario

Entrada: `StyleRadar_Paquete_Arquitectura_Frontend_v2.zip`, 11.585.172 bytes. SHA-256: `cb9d9456ed3bc8848305fea47b7d7d27d7134db5e6184b2e673c553a368e9aab`. Se inspeccionaron sus 19 entradas antes de extraer: lista explícita de rutas permitidas; sin destinos absolutos, componentes de escape, duplicados ni archivos inesperados. La extracción inicial fue fuera del repositorio.

Se incorporan 17 entregables del ZIP; la propuesta README y LEEME auxiliar se revisan fuera del repositorio. La propuesta sirve de guía, corrigiendo su estado anterior al merge. No se copian auxiliares a la raíz. Se añaden además diez copias históricas y esta validación.

Resultado previsto: **18 archivos nuevos, 11 modificados y ninguna eliminación**. Todas las rutas siguientes son relativas a `styleradar-frontend-v3/`.

### Archivos nuevos

- `docs/arquitectura/figuras/arquitectura_actual.png`.
- `docs/arquitectura/figuras/arquitectura_actual.svg`.
- `docs/arquitectura/figuras/arquitectura_futura.png`.
- `docs/arquitectura/figuras/arquitectura_futura.svg`.
- `docs/arquitectura/StyleRadar_Arquitectura_Frontend_v2_0.docx`.
- `docs/arquitectura/StyleRadar_Arquitectura_Frontend_v2_0.pdf`.
- `docs/sprints/StyleRadar_Matriz_Cambios_v1_1_a_v2_0.md`.
- `docs/flujo/historico/v1_1/01_invitado.svg`.
- `docs/flujo/historico/v1_1/01_invitado.png`.
- `docs/flujo/historico/v1_1/02_comprador.svg`.
- `docs/flujo/historico/v1_1/02_comprador.png`.
- `docs/flujo/historico/v1_1/03_almacen.svg`.
- `docs/flujo/historico/v1_1/03_almacen.png`.
- `docs/flujo/historico/v1_1/04_fundacion.svg`.
- `docs/flujo/historico/v1_1/04_fundacion.png`.
- `docs/flujo/historico/v1_1/05_administrador.svg`.
- `docs/flujo/historico/v1_1/05_administrador.png`.
- `docs/sprints/validacion-documental-sprint4-v2.md`.

### Archivos modificados

- `README.md`: rutas, ejecución HTTP, pantallas, matriz de permisos, enlaces y estado documental, conservando antecedentes útiles.
- `docs/flujo/01_invitado.png`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/01_invitado.svg`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/02_comprador.png`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/02_comprador.svg`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/03_almacen.png`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/03_almacen.svg`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/04_fundacion.png`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/04_fundacion.svg`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/05_administrador.png`: versión v2.0 del paquete, conservando el nombre habitual.
- `docs/flujo/05_administrador.svg`: versión v2.0 del paquete, conservando el nombre habitual.

## Histórico v1.1 preservado

- [Word v1.1](../arquitectura/StyleRadar_Arquitectura_Frontend_Con_Diagramas.docx) y [PDF v1.1](../arquitectura/StyleRadar_Arquitectura_Frontend_Con_Diagramas.pdf) permanecen byte a byte iguales a la base.
- [Validación anterior](validacion-documental-sprint4.md), [plan de Sprint 3/4](sprint-3-y-4.md), documentos de requerimientos y [manual de identidad](../StyleRadar_Manual_de_Identidadv2.html) permanecen intactos.
- Antes de sustituir los cinco pares de flujo, se copiaron sus diez originales a [historico/v1_1](../flujo/historico/v1_1/). Se comprobó que el destino no existiera; no se sobrescribió ningún histórico.

Los siguientes SHA-256 corresponden tanto al original de la base como a su copia histórica:

| Archivo en historico/v1_1/ | SHA-256 |
|---|---|
| `01_invitado.svg` | `f3d065d524de38036b05bb122da796f86bf4b63d288cbc502712e2bea11ab044` |
| `01_invitado.png` | `544cf62780e18e6194a53bb14b9b38ff7663507f7fc916fdd3d76617f6dc5c6c` |
| `02_comprador.svg` | `8a93664c4eb45166c57776ac95aef45f71cd852f20774c40812cd560e1fc11fb` |
| `02_comprador.png` | `85a16495908b4af7743c5773b477f16a6a5a24543bda5e1de9b3e5b9322aa76b` |
| `03_almacen.svg` | `a2ea40b1673ee9a5d22c6f39ef2205bc978fbaabbf66e04f111165565748f91c` |
| `03_almacen.png` | `c24100a42a9ec8611eae6ed9c3c867a0a8f41619829c7f798be2d81a0f6277f3` |
| `04_fundacion.svg` | `86aa184cee37bcc1b6bc4970864807062585188571837062d2efb13f76c33ea9` |
| `04_fundacion.png` | `b1b700e98c064708331ac911830e75995ecec39bc76870dc5dcf8a8dbd3cb552` |
| `05_administrador.svg` | `cf0865fbb994e900a21f319b9c34622bef66543e7a588ea82cba417291ce7c3a` |
| `05_administrador.png` | `415350f0af211f98fe1a3518ea8b6f751fa0842f64638bbc9e2e892a1d897e95` |

## Versiones v2.0 y coherencia Word/PDF

Se publican el [Word editable v2.0](../arquitectura/StyleRadar_Arquitectura_Frontend_v2_0.docx) y el [PDF v2.0](../arquitectura/StyleRadar_Arquitectura_Frontend_v2_0.pdf), la [matriz de cambios](StyleRadar_Matriz_Cambios_v1_1_a_v2_0.md), cinco flujos y dos vistas de arquitectura.

Se corrigen únicamente tres párrafos del Word/PDF del paquete: el plan P2 ya reconoce el PR #2; control de publicación distingue preparación histórica, origen f72f71d y main integrado por merge 53def793; el anexo indica la ruta real docs/flujo/. Las correcciones no alteran contenido técnico, capturas, diagramas ni estilos.

- DOCX: archivo ZIP/OOXML íntegro, abre en Microsoft Word. Solo cambia `word/document.xml`; todas las demás partes son idénticas, incluidas las 26 partes de imágenes. Se conservan propiedades de párrafos, tablas, secciones y estilos.
- PDF: abre y se renderizan sus 24 páginas. Se actualizan los tres bloques de texto usando las fuentes originales incrustadas; no se rasteriza el documento ni se superponen textos antiguos. Se mantienen todas las imágenes y fuentes.
- Comparación visual contra el PDF aprobado: cambios limitados a los bloques de las páginas 18, 19 y 20; las otras 21 páginas son idénticas píxel a píxel. Revisión visual de las 24 páginas, sin recortes nuevos.
- Comparación adicional en Word nativo, antes/después: 26 páginas en ambos casos; solo cambian los tres bloques equivalentes. La sustitución de fuentes instaladas produce paginación y tablas diferentes del PDF ya en el original. No se regenera el PDF final con esa sustitución; se conserva la composición aprobada de 24 páginas. El DOCX mantiene los estilos originales, por lo que su apariencia editable depende de las fuentes disponibles.
- Concordancia de contenido: los tres textos corregidos están presentes tanto en Word como en PDF; el resto del contenido de ambos se conserva. No se afirma coincidencia de paginación entre aplicaciones con fuentes distintas.

## Diagramas y enlaces

Los siete SVG se validan como XML/SVG con viewBox positivo; sus siete PNG se abren y decodifican. Los 14 archivos de gráficos v2.0 son copias idénticas del paquete aprobado: no se convirtieron SVG ni se editaron imágenes.

| Diagrama | SVG | PNG |
|---|---|---|
| Invitado | [SVG](../flujo/01_invitado.svg) | [PNG](../flujo/01_invitado.png) |
| Comprador | [SVG](../flujo/02_comprador.svg) | [PNG](../flujo/02_comprador.png) |
| Almacén | [SVG](../flujo/03_almacen.svg) | [PNG](../flujo/03_almacen.png) |
| Fundación | [SVG](../flujo/04_fundacion.svg) | [PNG](../flujo/04_fundacion.png) |
| Administrador | [SVG](../flujo/05_administrador.svg) | [PNG](../flujo/05_administrador.png) |
| Arquitectura actual estática | [SVG](../arquitectura/figuras/arquitectura_actual.svg) | [PNG](../arquitectura/figuras/arquitectura_actual.png) |
| Arquitectura futura propuesta | [SVG](../arquitectura/figuras/arquitectura_futura.svg) | [PNG](../arquitectura/figuras/arquitectura_futura.png) |

Se comprueban destinos relativos e identificadores de sección del README, la matriz y esta validación. Los enlaces externos históricos se conservan como referencias; no se certifica su disponibilidad ni vigencia técnica en esta publicación. El estado del PR #2 se confirma mediante su integración y ascendencia Git y consulta de GitHub: merged=true, merge `53def7934646c38fcf99d3af65318fa2614e77f2`, main permanece en ese mismo commit al validar (2026-10-19T03:42:53.392Z).

## Protección de código y alcance de pruebas

Se calcula SHA-256 de los 304 archivos versionados de la base antes de incorporar documentación. Solo se permiten cambios en README y los diez diagramas de flujo; todos los demás archivos de la base, incluidos los 198 del prototipo final, deben permanecer idénticos. El histórico copiado coincide con los blobs de la base.

La validación de esta publicación es documental. Los resultados funcionales que reproduce v2.0 proceden del inventario previo: 20/20 comprobaciones de sintaxis JS, 173/173 imágenes decodificadas, 95/95 casos de acceso del router, 46 recorridos adicionales y 8/8 ingresos demo. No se presentan como pruebas nuevas ejecutadas en esta publicación.

**Las 95 comprobaciones certifican solamente el enrutador local (19 destinos × 5 tipos de acceso); no la autorización de servidor, el cumplimiento de 75 RF ni ciclos E2E.** No se alteran estados de RF ni historias/estados de Jira.

## Limitaciones y pendientes funcionales

- Implementación actual HTML/CSS/JavaScript con router hash, datos semilla y localStorage. React/Vite, API REST, Spring Boot y JWT efectivos son integración futura.
- Cinco personajes del inicio (Antonia, Mateo, Aura, Nora y Tomás) y seis categorías del catálogo son clasificaciones distintas. Login/registro y ficha de prenda son modales, no rutas independientes.
- Probador por capas con fotografía de ejemplo; no es IA ni RA real. «Todo a la wishlist» solo avisa sin añadir prendas.
- Falta meta viewport; emulación móvil 390 px reportó innerWidth=980. Faltan doctype/charset explícitos. No se corrige responsive en esta rama.
- Sesión sin «Recordarme»: el detector de portada puede seguir usando la composición de tiendas para invitado. Credenciales demo en claro: práctica no apta para producción.
- Exportar pagos no descarga XLSX; tabla, estados, cobros y reembolsos son simulados. Destacar playlists cambia únicamente datos locales.
- Pendientes de prueba: límite de 15 prendas, carga completa de seis fotos, alta de cuenta/publicación, fotografía personal del probador, mensajes y ciclo íntegro de donaciones, accesibilidad WCAG, autorización de servidor y E2E con backend.
- No se implementan estas correcciones ni se instalan dependencias frontend. La publicación documental no cierra requerimientos.

## Cierre de validación

Resultados: **146 enlaces relativos/fragmentos correctos; 18 archivos nuevos y 11 modificados; cero eliminaciones; 293 archivos de la base intactos; 198 archivos del prototipo final idénticos; diez históricos conservados; 14 gráficos v2.0 idénticos al paquete; Word íntegro y PDF de 24 páginas**.

Se ejecutan `git status --short`, `git diff --check` y `git diff --stat` antes del commit, incluyendo revisión del índice una vez añadidos los archivos nuevos. Se comprueba que el árbol Git del prototipo y de todos los archivos fuera del alcance se conserva. El PR se abre hacia main sin merge automático y conserva la rama.
