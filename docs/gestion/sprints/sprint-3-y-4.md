# StyleRadar · Plan de los sprints 3 y 4

Las correcciones de requerimientos, identidad, mascota y documentación son mucho trabajo para un solo sprint, así que se reparten entre el **Sprint 3** (corregir y dejar la base) y el **Sprint 4** (integrar y cerrar). Marca: ✅ hecho · ⬜ pendiente.

### Sprint 3 · Corrección y base

| Estado | Entregable | Detalle |
|---|---|---|
| ✅ | Requerimientos actualizados | [Excel v3](../requerimientos/StyleRadar_Requerimientos_Completos_v3.xlsx): 75 RF (72 del análisis + SR-RF-73, 74 y 75), sin la pestaña de trazabilidad y con la hoja «Verificación RNF» |
| ✅ | Manual de identidad (entrega previa) | 11 láminas: nueva lámina 3 con el **diagrama de contexto**, fondos nuevos, bloque de botones corregido y mascota rehecha. Ver [archivo vigente](../StyleRadar_Manual_de_Identidadv2.html) |
| ✅ | Mascota: los amigos de StyleRadar | Cinco personajes (Antonia, Mateo, Aura, Nora y Tomás) con dos poses en Bogotá cada uno, en [`assets/mascota/`](../../assets/mascota). Reemplazan al camaleón Kai |
| ✅ | README y estructura del repositorio | Se quitan los RF-76 y 77 que no se aprobaron, se documentan los 75 RF y se reorganiza la carpeta `docs/` para abrir el proyecto en IntelliJ |
| ⬜ | Corrección en el prototipo: playlists | Limitar las playlists a **15 prendas** (hoy el límite no se aplica) |
| ⬜ | Corrección en el prototipo: contraseñas | Unificar el mínimo de la contraseña (hoy el registro pide 4 y otra pantalla 6) |
| ⬜ | Documentación del frontend | Informe de cambios v4 con las correcciones del Sprint 3 y la tabla «Cómo ver cada requerimiento» actualizada a 75 RF |

### Sprint 4 · Integración y cierre

| Estado | Entregable | Detalle |
|---|---|---|
| ✅ | Documento de arquitectura agregado | Revisión documental final 1.1: [PDF de consulta](../arquitectura/StyleRadar_Arquitectura_Frontend_Con_Diagramas.pdf) regenerado desde el [Word editable](../arquitectura/StyleRadar_Arquitectura_Frontend_Con_Diagramas.docx); propuesta nivel 3 alineada con README, HTML y RF, sin implementar React |
| ✅ | Diagramas de navegación agregados | Cinco recorridos por invitado, comprador, almacén, fundación y administrador; PNG y SVG en [docs/flujo/](../flujo) |
| ✅ | README actualizado para arquitectura | Índice, módulos propuestos, navegación por rol, pantallas, errores, prototipo oficial e integración futura; se preserva el contenido anterior |
| ✅ | Enlaces y archivos locales verificados | Imágenes, rutas Markdown, anclas, manual y prototipo; alcance y resultados en [validación documental](validacion-documental-sprint4.md). No equivale a validación funcional del prototipo |
| ⬜ | Mascota dentro del prototipo | Usar a los cinco amigos y sus poses en el registro, los estados vacíos, los mensajes de error y la página de «Cómo funciona» |
| ⬜ | RF-73 · Chat con el almacén | Reemplaza «Llamar» en la ficha de la tienda; los chats sin responder se ven en el panel del almacén |
| ⬜ | RF-74 · Fotos de la tienda física | Hasta 6 fotos por tienda; la primera es la portada |
| ⬜ | RF-75 · Pagos de suscripciones | Listado para el administrador con estados aprobado, rechazado, pendiente y reembolsado |
| ⬜ | Poses para el MVP | Recortar las poses con fondo transparente y descargarlas en tamaño completo desde Canva |
| ⬜ | Revisión final del frontend | Recorrido de los flujos por rol, responsive a 390 y 1440 px, contraste, estados de error y vacíos |
| ⬜ | Entrega final | Presentación del sprint, informe final y README actualizado |

