[⬅ Volver al README Principal](../../README.md)

---

## <img src="https://img.shields.io/badge/SECCIÓN_07-12063A?style=for-the-badge" height="20" align="absmiddle" /> 7. RAMAS, CONVENCIONES Y EQUIPO DE FRONTEND

### Modelo de Ramas y Flujo de Trabajo

```text
main                    <-- Versión estable entregable / producción
├── develop             <-- Rama principal de integración continua
└── UNIFICADO-REACT     <-- Rama unificada de integración React + QA Vercel
    ├── feature/<modulo>-<tarea>    <-- Nuevas funcionalidades o integraciones
    ├── fix/<modulo>-<correccion>   <-- Correcciones puntuales y bugs
    └── docs/<alcance>              <-- Actualizaciones de documentación
```

### Reglas de Contribución

1. Partir siempre de la versión más reciente de la rama de integración (`git fetch origin` + `git pull` antes de crear rama o integrar).
2. Usar commits atómicos siguiendo **Conventional Commits en español**:
   - `feat(catalogo): agregar barra horizontal de filtros al hover`
   - `fix(mapa): migrar endpoints de geolocalización a inglés`
   - `test(catalogo): alinear pruebas unitarias con contrato del API Gateway`
   - `docs(readme): renovar documentación modular del frontend`
3. No modificar código de otros módulos/compañeros fuera del alcance de la tarea ni subir secretos reales (`.env`, `.env.qa` quedan fuera de Git mediante `.gitignore`).
4. Verificar en verde `npm run lint`, pruebas afectadas (o `npm test`) y `npm run build:qa` antes de hacer merge o Pull Request.

---

### Equipo de Desarrollo Frontend y Microservicios Asignados

Proyecto desarrollado para el curso **DOSW (Diseño y Operación de Soluciones Web)**, Escuela Colombiana de Ingeniería Julio Garavito (2026-2), Organización **StyleRadar1**.

Cada integrante del frontend coordina la integración con un equipo de backend y conecta sus microservicios correspondientes en el cliente web. El frontend **nunca consume puertos internos de microservicios directamente**; todas las peticiones pasan por el **API Gateway** (`VITE_API_URL`).

| Integrante Frontend | Equipo de Backend | Líder de Backend | Microservicios Asignados | Módulos en Frontend |
| :--- | :--- | :--- | :--- | :--- |
| **Kevin Ángel** | Estación Portal 8080 · Probador Virtual, Donaciones y Gateway | Daniel Valero Quiroga | `ms-probador-virtual`, `ms-segunda-vida-donaciones`, `api-gateway` | `experiencia/`, base común (`core/`, `landing/`) |
| **Cristian Moreno** | Estación CADche · Identidad | Juan Diego Valderrama | `ms-auth`, `ms-usuarios`, `ms-tiendas` | `identidad/`, `administracion/` |
| **Julián Morales** | NQS · Pagos y Estadísticas | Cristian Camilo Ortiz Sánchez | `ms-pagos-suscripciones`, `ms-estadisticas` | `transacciones/`, `soporte/` *(estadísticas)* |
| **Daniel Barrera** | Estación Guatoque Jiraguas · Notificaciones, Chat y Broker | Paula Alejandra Díaz | `ms-notificaciones`, `ms-chat`, `RabbitMQ` | `soporte/` *(notificaciones, alertas y chat)* |
| **Carlos Sánchez** | Estación RESTrepo · Catálogo | Nicolás Álvarez | `ms-inventario`, `ms-item-catalogo`, `ms-geolocalizacion`, `ms-playlist` | `catalogo/`, `mapa/` |

---

### Enlaces Oficiales

- **Repositorio Frontend:** [`https://github.com/StyleRadar1/StyleRadar_Frontend`](https://github.com/StyleRadar1/StyleRadar_Frontend)
- **Organización StyleRadar:** [`https://github.com/StyleRadar1`](https://github.com/StyleRadar1)
- **Entorno QA Desplegado (Vercel):** [`https://styleradar-qa.vercel.app/`](https://styleradar-qa.vercel.app/)
- **Índice Documental del Proyecto:** [`docs/README.md`](../README.md)

---

[⬅ Volver al README Principal](../../README.md)
