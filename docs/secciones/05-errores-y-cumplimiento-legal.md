[⬅ Volver al README Principal](../../README.md)

---

## <img src="https://img.shields.io/badge/SECCIÓN_05-12063A?style=for-the-badge" height="20" align="absmiddle" /> 5. MANEJO DE ERRORES Y CUMPLIMIENTO LEGAL

### Sistema Centralizado de Manejo de Errores

El módulo `core/` provee una arquitectura unificada para representar errores de red, validación, permisos y sesión vencida sin exponer detalles técnicos crudos al usuario:

| Componente / Archivo | Responsabilidad |
| :--- | :--- |
| `apiClient` y `ApiError` | Normaliza códigos HTTP (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `5xx`), `fields` por campo de formulario y `ErrorCode`. |
| `ErrorScene` / `EscenaError` | Escenas ilustradas animadas (`Perchero` 404/409, `Tornamesa` 503/red, `Etiqueta` 401, `Maniquí` 429). |
| `FieldError`, `ErrorBanner`, `ErrorToast` | Retroalimentación accesible por campo (con foco al primer error), avisos de regla/permiso y notificaciones flotantes. |
| `SessionExpiredOverlay` | Modal global ante `401` irrecuperable que conserva la ruta de retorno para volver tras reingresar. |
| `SinConexion` y `ErrorState` | Banner de pérdida de conectividad y estado de error recuperable con acción de reintento. |
| `MockBanner` | Barra superior visible únicamente cuando `VITE_USE_MOCKS=true` o hay una simulación `?mock=...` activa en desarrollo. |
| `/dev/errores` (`ErroresDemo`) | Vitrina visual de escenas de error disponible únicamente en modo desarrollo (`import.meta.env.DEV`). |

> [!NOTE]
> Para consultar la guía completa de componentes compartidos y la lista de escenarios de simulación `?mock=<escenario>` válidos en desarrollo local (`VITE_USE_MOCKS=true`), revisa [`README-ERRORES.md`](../../README-ERRORES.md).

---

### Capa de Cumplimiento Legal Colombiano (`src/modules/legal/`)

La aplicación implementa controles regulatorios alineados con la legislación colombiana (**Ley 1581 de 2012 / Habeas Data**, **Ley 1480 de 2011 / Estatuto del Consumidor**, **Ley 527 de 1999** y **Decreto 587 de 2016**):

1. **Banner de Cookies Accesible (`CookieBanner`):** Tres botones con idéntico peso visual (*Configurar*, *Rechazar no esenciales*, *Aceptar todas*), modal WCAG 2.1 AA, control granular por categoría y enlace permanente en el pie de página.
2. **Directorio Legal (`/legal`):** Acceso a **18 documentos legales navegables** (`/legal/:slug`) con tabla de contenido, versión vigente y fecha de actualización.
3. **Canal de PQRS (`/legal/pqrs`) y Centro de Ayuda (`/legal/centro-ayuda`):** Formulario formal con generación de número de radicado (`SR-PQRS-YYYYMMDD-XXXX`).
4. **Consentimientos desglosados en registro:** Casillas independientes sin preselección (Términos y Condiciones, Política de Datos Personales, mayoría de edad y reglas específicas para tienda o fundación).

Para revisar el inventario completo de los 18 documentos y los datos corporativos institucionales pendientes por diligenciar antes de salida a producción, consulta [`LEGAL_PENDIENTES.md`](../../LEGAL_PENDIENTES.md).

---

[⬅ Volver al README Principal](../../README.md)
