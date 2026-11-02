# Validación documental del Sprint 4

Revisión final del 18 de octubre de 2026. Versión documental **1.1**. Rama: `docs/sprint4-arquitectura-frontend`, creada desde el `main` local en `0dfcee74f32c5420e8db345ace1d12cb56832d0d`. Esta evidencia describe la validación previa al commit y la publicación de la rama; main no se modificó durante esa validación.

El paquete `StyleRadar_Sprint4_Archivos_para_Codex.zip` se incorporó inicialmente desde Descargas con sus 12 archivos y se comprobaron sus CRC y SHA-256. Esta revisión corrige el Word, regenera el PDF y repara la escala de los cinco SVG; esos siete archivos ya no deben compararse por igualdad binaria con el ZIP original. El ZIP y los archivos temporales de inspección permanecen fuera del repositorio.

## Versión y documentos

- [Word de arquitectura](../arquitectura/StyleRadar_Arquitectura_Frontend_Con_Diagramas.docx): versión 1.1 en portada, tabla de control, encabezados, pies, propiedades de título/asunto/versión e historial. No quedan referencias textuales a la versión documental anterior. El prototipo conserva su identificación independiente como v3.
- Historial: una entrada 1.1 del 18 de octubre de 2026; conserva la explicación sobre el HTML real y la ausencia de Figma, e incorpora la unificación de versiones, revisión modular y regeneración del PDF. Su estado mantiene la propuesta pendiente de implementación.
- Se abrió el Word con Microsoft Word y se exportó directamente el [PDF de consulta](../arquitectura/StyleRadar_Arquitectura_Frontend_Con_Diagramas.pdf), incluyendo las propiedades del documento. Título y asunto del PDF identifican la versión 1.1. El PDF del repositorio es una copia binaria de esa exportación, sin reconstruir su contenido por separado.
- Integridad Word: CRC del contenedor ZIP correcto; todas las partes XML y relaciones legibles; destinos internos existentes. Se conservan las nueve imágenes internas byte por byte respecto al Word recibido, incluidos los cinco PNG por rol. No se retiraron secciones ni recorridos.
- Se corrigieron anchos de tablas inconsistentes entre rejilla y celdas, espaciado del índice y agrupación de figuras con sus leyendas. El árbol de módulos usa fuente monoespaciada. El diagrama del invitado se ajustó proporcionalmente para compartir página con su título y leyenda, sin alterar sus píxeles originales.
- Integridad PDF: lectura estricta correcta, 23 páginas y nueve imágenes. Las 23 páginas de la exportación final se renderizaron con Poppler y se inspeccionaron visualmente: contenido legible, sin recortes de tablas ni figuras. Se cotejó el texto de los 720 párrafos del cuerpo y tablas del Word con la extracción del PDF, normalizando espacios, saltos y signos: sin contenido ausente.

El renderizador `render_docx.py` se intentó primero, pero no encontró LibreOffice; el runtime Windows declara que no lo incluye. La exportación nativa con Word y el renderizado con Poppler permitieron comprobar el resultado sin instalar dependencias.

## Arquitectura nivel 3

La sección 4.2 del Word/PDF y el árbol del [README](../../README.md) describen los mismos 14 módulos propuestos: `core`, `auth`, `discovery`, `catalogo`, `almacenes`, `probador`, `playlists`, `preferencias`, `alertas`, `suscripciones`, `segunda-vida`, `mensajes`, `fundaciones` y `administracion`. Core aporta soporte transversal; los demás se agrupan por funcionalidades, sin convertir `components`, `hooks` o `services` en capas globales.

Se cotejaron las responsabilidades con los 75 RF del [Excel v3](../requerimientos/StyleRadar_Requerimientos_Completos_v3.xlsx) y las rutas y vistas declaradas del [prototipo oficial](../../prototipo/index.html). Se precisaron las referencias RF de las secciones funcionales del Word; no se inventaron códigos HU ni se equiparó una pantalla con un endpoint implementado.

- `preferencias` contiene perfil, estilos, tallas, wishlist y recomendaciones. El antiguo nombre `perfil` queda como agrupación funcional interna, preservando la sección 8.5.
- `almacenes` incluye mapa, tienda pública, panel, inventario y fotos; `panel-almacen` queda como agrupación interna, preservando la sección 8.11.
- `suscripciones` concentra planes y renovación del almacén (SR-RF-67/68). Administración compone la consulta de pagos (SR-RF-75) mediante su interfaz pública y conserva sus permisos. La contratación de planes del comprador, visible en el HTML, requiere confirmar alcance y soporte REST.
- Los módulos adicionales tienen justificación expresa en la sección 4.5 y el README: `discovery` compone inicio y accesos a funcionalidades existentes; `probador` encapsula foto y visualización aproximada (SR-RF-23 a 27); `mensajes` sirve a compradores, tiendas y fundaciones (SR-RF-40/41, 48 y 73). Se evita duplicar conversaciones dentro de segunda vida.

La integración futura sigue documentada como propuesta: React/Vite, router por rol, cliente HTTP, URL por ambiente, JWT Bearer, estados de interfaz y tratamiento de errores. Word y README coinciden en proponer token en memoria, sin JWT en localStorage, limpieza de sesión y contratos de renovación por confirmar. Se conservan los contratos backend citados como antecedentes, sujetos a revalidación con OpenAPI antes de implementar; no se certificó nuevamente su vigencia ni ejecución E2E.

## Cinco diagramas PNG y SVG

Se verificaron los pares de invitado, comprador, almacén, fundación y administrador en [docs/flujo](../flujo).

- Los cinco PNG conservan su SHA-256 original, decodifican correctamente y coinciden con sus imágenes insertadas en el Word. Se revisaron visualmente tanto en el documento como en la comprobación de imágenes.
- Los cinco SVG tienen XML y namespace válidos. La revisión visual detectó que el grupo principal aplicaba `scale(2.43 2.43)` dentro de un `viewBox` sin escalar, recortando el contenido. Se corrigió únicamente a `scale(1 1)`; la comparación XML confirma que no cambiaron nodos, textos, coordenadas, flechas, dimensiones ni colores.
- Se renderizaron e inspeccionaron los cinco SVG corregidos: recorridos completos, equivalentes a los PNG. El motor de inspección empleó una fuente de sustitución; los atributos tipográficos originales del SVG se conservan.

Los errores HTTP, la expiración JWT y la trazabilidad persistente de los diagramas representan diseño de integración futura. Invitado sigue siendo una condición sin sesión; los roles autenticados documentados son `COMPRADOR`, `ADMIN_ALMACEN`, `REPRESENTANTE_FUNDACION` y `ADMIN_STYLERADAR`.

## Enlaces y preservación

- README: **114 referencias**, 110 locales y cuatro externas. Rutas locales y anclas Markdown válidas; imágenes y documentos existentes. También se comprobaron los enlaces del plan de sprints y de esta evidencia.
- Se conservaron los 57 encabezados presentes al inicio de esta revisión, incluidos los 43 anteriores a la incorporación documental del Sprint 4. Los diez entregables pendientes anteriores del plan permanecen pendientes.
- El manual vigente sigue en `docs/StyleRadar_Manual_de_Identidadv2.html`; su identificación interna V3 es un antecedente independiente de la versión 1.1 de arquitectura. No se renombró.
- El HTML real es `styleradar-frontend-v3/prototipo/index.html`; Word, PDF y README lo identifican como demostrador local simulado. No se añadieron enlaces a Figma ni una URL de despliegue frontend no comprobada.

Los cuatro enlaces externos del README se consultaron nuevamente mediante web el 18 de octubre de 2026: [Vite](https://vite.dev/guide/env-and-mode), [Axios](https://axios-http.com/docs/interceptors), [React Router](https://reactrouter.com/start/declarative/routing) y [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html). Respondieron con documentación; Axios redirige a `https://axios.rest/pages/advanced/interceptors`. Esto acredita disponibilidad en la consulta, sin garantizar disponibilidad futura.

El SHA-256 de `prototipo/index.html` antes y después es **`5f932fc9141ba15316fcabc36a0b8a800843f7f1ab1464b93feb39fec81843f1`**, y su objeto Git coincide con HEAD. No se implementó React ni se añadieron dependencias, `package.json` o carpetas `src/`.

Durante la validación previa a la publicación se ejecutaron `git status --short`, `git diff --check` y `git diff --stat`. La comprobación de espacios no detectó errores. En ese momento, el diff estadístico ordinario solo incluía archivos seguidos: README y plan de sprints; Word/PDF, diagramas y esta evidencia permanecían sin seguimiento como en la incorporación inicial. Todavía no se había preparado el índice para commit.

Los archivos `.idea/Frontend-Style-Radar.iml` y `.idea/modules.xml` permanecen sin seguimiento y fuera del alcance; no se editaron ni añadieron al índice. Main conserva `0dfcee74f32c5420e8db345ace1d12cb56832d0d`.

La validación documental se realizó antes del commit y la publicación de la rama. Posteriormente, los cambios se incorporaron al commit 2b713bb y se presentaron mediante el Pull Request #1 hacia main.

Esta validación es documental. Continúan pendientes los recorridos funcionales completos, responsive/accesibilidad, las correcciones del plan y la integración real con Spring Boot.
