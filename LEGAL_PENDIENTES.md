# Style Radar · Registro de Cumplimiento Legal y Datos Pendientes ([CORCHETES])

> **Propósito**: Este documento reúne los aspectos normativos, el estado de implementación de la capa legal y la lista exhaustiva de datos institucionales pendientes entre corchetes (`[...]`) para su diligenciamiento por parte del equipo directivo y la revisión del abogado de la compañía antes del despliegue a producción.
> **Marco Regulatorio Principal**: República de Colombia — Ley 1581 de 2012 y Decreto 1377 de 2013 (Habeas Data), Ley 1480 de 2011 (Estatuto del Consumidor), Ley 527 de 1999 (Comercio Electrónico), Decreto 587 de 2016 (Reversión del Pago) y Circulares de la Superintendencia de Industria y Comercio (SIC).

---

## 1. Resumen de la Capa Legal Implementada en el Frontend

1. **Avisos Emergentes Globales (Banner de Cookies y Alerta de Política Actualizada)**:
   - **Banner de Cookies**: Ubicado abajo a la izquierda en escritorio y ancho completo en móvil, sin bloquear botones clave.
   - **Tres botones de idéntico peso visual**: «Configurar», «Rechazar no esenciales», «Aceptar todas» (sin patrones oscuros).
   - **Modal de Configuración Accesible**: Conmutadores por categoría (Necesarias: fijas/bloqueadas; Funcionales, Analíticas y Publicitarias: apagadas por defecto). Compatible con WCAG 2.1 AA (`role="dialog"`, foco atrapado, cierre con `Esc`).
   - **Aviso Apilado de Política Actualizada**: Se muestra en la parte superior del banner cuando un usuario previo no ha reconocido la versión vigente (`v1.2`), cerrable con una 'X' y persistente para esa versión.
   - **Persistencia y Backend Mock**: Guardado en `localStorage` con fecha y versión, y sincronizado con `consentService.mockSyncConsentWithBackend`.
   - **Botón permanente**: Enlace «Configurar cookies» presente en todos los pies de página para reabrir el modal en cualquier momento.

2. **Pie de Página Legal Global (Todas las páginas y Landing)**:
   - 3 Columnas temáticas estructuradas: «Marco Legal», «Ayuda & Consumidor», «Comunidad & Aliados».
   - Bloque formal con datos del proveedor: Razón Social, NIT, Dirección Comercial, Teléfono/WhatsApp, Horario de Atención y Canal de Protección de Datos (Habeas Data).
   - Enlace directo a la Superintendencia de Industria y Comercio (`www.sic.gov.co`), botón de acceso al Derecho de Retracto (5 días hábiles) y Canal oficial de PQRS.

3. **18 Documentos Legales Completos y Navegables**:
   - Cada documento cuenta con una ruta propia, índice lateral anclado (desktop), selector móvil, título numerado, fecha de última actualización, versión activa y resumen ejecutivo.
   - Directorio maestro (`/legal`), Formulario formal de PQRS (`/legal/pqrs`) con generador de radicado legal (`SR-PQRS-YYYYMMDD-XXXX`) y Centro de Ayuda (`/legal/centro-ayuda`).

4. **Consentimientos Desglosados en Formularios de Registro**:
   - Casillas separadas y desmarcadas por defecto:
     1. Términos y Condiciones
     2. Política de Tratamiento de Datos Personales
     3. Mayoría de edad (+18 años)
     4. (Opcional) Boletines y promociones de marcas locales
     5. Reglas para Tiendas (para rol Tienda)
     6. Reglas para Fundaciones (para rol Fundación)
   - Validación bloqueante en el cliente y registro de auditoría legal con timestamp y versión (`consentService.recordFormConsent`).

---

## 2. Tabla de Documentos Legales, Rutas y Datos Pendientes ([CORCHETES])

A continuación se detalla cada uno de los 18 documentos legales, su ruta en el frontend y los campos pendientes que el equipo y el abogado deben completar:

| # | Documento Legal | Ruta | Versión | Campos Pendientes entre Corchetes (`[CORCHETES]`) |
|---|---|---|---|---|
| **01** | Términos y Condiciones de Uso | `/legal/terminos` | `v1.1` | • `[RAZÓN SOCIAL DE LA EMPRESA OPERADORA S.A.S.]`<br>• `[NIT: XXXXXXXXX-X]`<br>• `[DIRECCIÓN COMERCIAL, BOGOTÁ D.C.]`<br>• `[CORREO DE ATENCIÓN: contacto@styleradar.co]`<br>• `[TRIBUNAL DE ARBITRAMENTO / JURISDICCIÓN COMPETENTE]` |
| **02** | Política de Tratamiento de Datos Personales | `/legal/datos-personales` | `v1.2` | • `[RAZÓN SOCIAL]`<br>• `[NIT]`<br>• `[CORREO DE PROTECCIÓN DE DATOS: privacidad@styleradar.co]`<br>• `[NÚMERO DE RADICACIÓN RNBD ANTE LA SIC, SI APLICA]`<br>• `[OFICIAL DE PRIVACIDAD / ÁREA RESPONSABLE]` |
| **03** | Aviso de Privacidad | `/legal/aviso-privacidad` | `v1.1` | • `[RAZÓN SOCIAL]`<br>• `[NIT]`<br>• `[CORREO DE PROTECCIÓN DE DATOS]` |
| **04** | Política de Cookies y Rastreo | `/legal/cookies` | `v1.0` | • `[PROVEEDOR ANALÍTICO: EJ. GOOGLE ANALYTICS 4 ID / LOCAL]`<br>• `[PROVEEDOR PUBLICITARIO / META PIXEL ID, SI APLICA]` |
| **05** | Devoluciones, Retracto (5 días) y Garantías | `/legal/devoluciones-garantias` | `v1.2` | • `[PLAZO DE RESPUESTA A RECLAMOS DE GARANTÍA POR TIENDAS, EJ. 15 DÍAS HÁBILES]`<br>• `[CANAL EXCLUSIVO DE DEVOLUCIONES / LOGÍSTICA INVERSA]` |
| **06** | Envíos y Entregas en Bogotá | `/legal/envios-entregas` | `v1.0` | • `[EMPRESAS TRANSPORTADORAS ALIADAS: EJ. ENVÍA, SERVIENTREGA, MENSAJERÍA LOCAL]`<br>• `[COSTO BASE ESTÁNDAR DE ENVÍO URBANO BOGOTÁ: $X.XXX COP]`<br>• `[TIEMPO MÁXIMO DE DESPACHO PARA TIENDAS, EJ. 48 HORAS HÁBILES]` |
| **07** | Medios de Pago y Seguridad | `/legal/pagos-seguridad` | `v1.0` | • `[PASARELA DE PAGOS CERTIFICADA - EJ. MERCADO PAGO / WOMPI]`<br>• `[CERTIFICACIÓN PCI-DSS NIVEL DEL PROVEEDOR]`<br>• `[TIEMPO DE RADICACIÓN DE REVERSIÓN DE PAGO: 5 DÍAS HÁBILES]` |
| **08** | Radicación de PQRS | `/legal/pqrs` | `v1.1` | • `[RESPONSABLE DEL CANAL DE ATENCIÓN AL CLIENTE]`<br>• `[CORREO PQRS: pqrs@styleradar.co]`<br>• `[PLAZO DE ATENCIÓN DE SUGERENCIAS, EJ. 10 DÍAS HÁBILES]` |
| **09** | Reglas para Tiendas y Marcas | `/legal/reglas-tiendas` | `v1.2` | • `[COMISIÓN POR TRANSACCIÓN, EJ. 8% + IVA]`<br>• `[VALOR SUSCRIPCIÓN PLAN TIENDA RADAR ALIADA: $XX.XXX COP/MES]`<br>• `[PLAZO LÍMITE DE DESPACHO O ENTREGA EN TIENDA]`<br>• `[PORCENTAJE DE RETENCIÓN DE FONDOS POR LITIGIO]` |
| **10** | Reglas para Fundaciones y Donaciones | `/legal/reglas-fundaciones` | `v1.0` | • `[REQUISITOS DOCUMENTALES DIAN / CÁMARA DE COMERCIO ESAL]`<br>• `[PLAZO DE EMISIÓN DE CERTIFICADOS DE DONACIÓN]` |
| **11** | Reglas «Segunda Vida» (Ropa Usada) | `/legal/segunda-vida` | `v1.1` | • `[PORCENTAJE DE COMISIÓN POR TRANSACCIÓN C2C, SI APLICA: X%]`<br>• `[LÍMITE MÁXIMO DE PRENDAS PUBLICADAS EN PLAN GRATIS]` |
| **12** | Normas de Comunidad y Playlists | `/legal/normas-comunidad` | `v1.0` | • `[CORREO DEL EQUIPO DE MODERACIÓN: comunidad@styleradar.co]`<br>• `[TIEMPO MÁXIMO DE REVISIÓN DE DENUNCIAS: 24-48 HORAS]` |
| **13** | Probador Virtual y Datos de Imagen | `/legal/probador-virtual-datos` | `v1.1` | • `[PROVEEDOR TECNOLÓGICO DE INFERENCIA VISUAL / TRY-ON]`<br>• `[PLAZO DE ELIMINACIÓN AUTOMÁTICA DE IMÁGENES TEMPORALES, EJ. 7 DÍAS]` |
| **14** | Propiedad Intelectual y Marcas | `/legal/propiedad-intelectual` | `v1.0` | • `[NÚMERO DE EXPEDIENTE / REGISTRO DE MARCA STYLERADAR ANTE LA SIC]`<br>• `[CORREO DE NOTIFICACIONES DE PROPIEDAD INTELECTUAL]` |
| **15** | Uso Aceptable y Seguridad | `/legal/uso-aceptable` | `v1.0` | • `[PROVEEDOR DE PROTECCIÓN CONTRA ATAQUES WAF / CLOUDFLARE]`<br>• `[LÍMITE DE CONSULTAS POR MINUTO (RATE LIMIT)]` |
| **16** | Promociones y Descuentos | `/legal/promociones-descuentos` | `v1.1` | • `[FECHA_INICIO]` y `[FECHA_FIN]` de cada campaña específica<br>• `[CANTIDAD_UNIDADES]` mínimas disponibles |
| **17** | Centro de Ayuda y Accesibilidad | `/legal/centro-ayuda` | `v1.2` | • `[LÍNEA TELEFÓNICA DIRECTA / PBX BOGOTÁ]`<br>• `[CANAL DE CHAT EN VIVO]` |
| **18** | Mapa Legal y Directorio Maestro | `/legal` | `2026.2` | • Ninguno (Índice dinámico sincronizado con `legalConfig.ts`) |

---

## 3. Ubicación del Archivo Central de Configuración

Para cambiar cualquiera de los datos pendientes, fechas o versiones, **no es necesario tocar el texto de cada página**. Todo está centralizado en:

📁 [`src/modules/legal/config/legalConfig.ts`](file:///c:/Users/kevin/Downloads/StyleRadar-Frontend/src/modules/legal/config/legalConfig.ts)

Al actualizar los valores del objeto `PROVIDER_INFO` o `LEGAL_VERSIONS`, estos se propagan automáticamente al pie de página, a los 18 documentos legales, a las respuestas automáticas de PQRS y a los metadatos de auditoría de los consentimientos.

---

## 4. Checklist para el Abogado y el Equipo Legal

- [ ] **Razón Social y NIT**: Confirmar la razón social exacta de la sociedad mercantil constituida (S.A.S. o similar) y su respectivo NIT con dígito de verificación.
- [ ] **Domicilio comercial**: Verificar la dirección física que aparecerá ante la DIAN y la SIC para efectos de notificación judicial.
- [ ] **Canal exclusivo de Habeas Data**: Asegurar que la casilla `privacidad@styleradar.co` cuente con un protocolo interno para responder en menos de 10 días hábiles (consultas) y 15 días hábiles (reclamos).
- [ ] **RNBD (Registro Nacional de Bases de Datos)**: Determinar si la empresa supera los topes de activos establecidos por la SIC (100.000 UVT) para proceder al registro formal de las bases de datos de clientes, tiendas y empleados.
- [ ] **Comisión y modelo comercial de tiendas**: Definir con finanzas el porcentaje de comisión pactado por prenda vendida (`[COMISIÓN POR TRANSACCIÓN]`) y el valor de los planes de suscripción mensual.
- [ ] **Pasarela de pagos**: Confirmar la pasarela definitiva (Mercado Pago Colombia, Wompi Bancolombia, etc.) y revisar los términos del contrato de agregación o recaudo.
- [ ] **Transportadoras aliadas**: Confirmar con los comercios las empresas de mensajería urbana que operan en Bogotá (Envía, Servientrega, Mensajeros Urbanos, etc.).
- [ ] **Registro de Marca**: Verificar el estado del trámite de registro del signo distintivo nominativo y mixto «Style Radar» ante la Delegatura de Propiedad Industrial de la SIC.
