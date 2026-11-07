<img src="docs/identidad/logo/styleradar-logo.svg" alt="StyleRadar" width="220">

# StyleRadar-Frontend

Frontend de StyleRadar, la plataforma que conecta a compradores con los almacenes de moda locales de Bogotá: buscar prendas en su talla, verlas en el mapa, probarlas en un probador virtual y vender o donar ropa usada.

Proyecto del curso DOSW, Escuela Colombiana de Ingeniería Julio Garavito, 2026-2. Organización: StyleRadar1.

## Integrantes del equipo de frontend

- Kevin Ángel
- Julián Morales
- Carlos Sánchez
- Cristian Moreno
- Daniel Barrera

## Estado

El proyecto en React tiene la base común lista (rutas por rol, inicio de sesión, acceso para jurados, cliente HTTP y design system) y el catálogo funcionando con datos de prueba. Las demás vistas están creadas como pantallas pendientes, cada una con su squad y sus requerimientos, y se van migrando desde el prototipo.

El prototipo navegable completo, en HTML, está en `public/prototipo/`. Es la referencia de diseño para todas las vistas. Se abre con doble clic en `public/prototipo/index.html`, sin instalar nada, o en `/prototipo/index.html` con el servidor de desarrollo.

Los cambios pendientes del prototipo (accesibilidad, registro, probador, consistencia y limpieza) están en el [plan de cambios](docs/gestion/StyleRadar_Plan_de_Cambios_Prototipo_v2_0.docx).

## Tecnologías

React 19, TypeScript, Vite, Tailwind CSS 4, React Router y Axios. Se despliega en Vercel.

## Cómo ejecutarlo

Se necesita Node.js 20 o superior.

```
npm install
cp .env.example .env
npm run dev
```

En Windows, el segundo comando es `copy .env.example .env`.

Abrir http://localhost:5173.

Otros comandos: `npm run build` (compila), `npm run preview` (sirve lo compilado), `npm run lint` (revisa el código) y `npm test` (corre las pruebas).

### Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `VITE_API_URL` | URL del API Gateway del ambiente. El front solo habla con el Gateway, nunca con un microservicio. En QA y PROD es obligatoria: si falta, la consola lo avisa en vez de llamar a `localhost`. |
| `VITE_APP_ENV` | `local`, `qa` o `prod`. En QA la app muestra una etiqueta «QA» abajo a la izquierda. |
| `VITE_USE_MOCKS` | `true` mientras el backend no esté listo: los servicios responden con datos de prueba y la app muestra el aviso «Modo demostración». Los casos de error se simulan con `?mock=<escenario>` (ver el README de `experiencia`). |

### Ambientes

Cada ambiente del front consume solo el Gateway de su mismo ambiente. Las variables se configuran en Vercel (Settings → Environment Variables), no en el repositorio.

| Ambiente | Rama | Entorno en Vercel | `VITE_APP_ENV` | `VITE_API_URL` | `VITE_USE_MOCKS` |
|---|---|---|---|---|---|
| Local | la tuya | — (archivo `.env`) | `local` | `http://localhost:8080` | `true` o `false` |
| QA | `develop` | Preview, solo para la rama `develop` | `qa` | URL del Gateway de QA | `false` |
| PROD | `main` | Production | `prod` | URL del Gateway de PROD | `false` |

Las URL de los Gateway de QA y PROD las publica el equipo Estación Portal 8080; cuando estén, se anotan en esta tabla.

### Rutas del API Gateway

El front solo conoce los prefijos de `src/modules/core/api/routes.ts`; el Gateway decide a qué microservicio y puerto va cada uno. Si un equipo cambia una ruta, se cambia en ese archivo y en esta tabla, y se avisa en el canal.

| Microservicio | Puerto | Equipo | Prefijo en el Gateway | Estado |
|---|---|---|---|---|
| ms-auth | 8100 | Estación CADche | `/api/auth` | Usado por el front |
| ms-usuarios | 8120 | Estación CADche | Por confirmar | Pendiente |
| ms-tiendas | 8140 | Estación CADche | Por confirmar | Pendiente |
| ms-inventario | 8200 | Estación RESTrepo | Por confirmar | Pendiente |
| ms-item-catalogo | 8220 | Estación RESTrepo | `/api/items` | Usado por el front |
| ms-geolocalizacion | 8240 | Estación RESTrepo | Por confirmar | Pendiente |
| ms-playlist | 8260 | Estación RESTrepo | Por confirmar | Pendiente |
| ms-notificaciones | 8300 | Estación Guatoque Jiraguas | Por confirmar | Pendiente |
| ms-chat | 8320 | Estación Guatoque Jiraguas | Por confirmar | Pendiente |
| ms-pagos-suscripciones | 8400 | NQS | Por confirmar | Pendiente |
| ms-estadisticas | 8420 | NQS | Por confirmar | Pendiente |
| ms-probador-virtual | 8500 | Estación Portal 8080 | `/api/tryon` | Usado por el front |
| ms-segunda-vida-donaciones | 8520 | Estación Portal 8080 | `/api/second-hand` y `/api/donations` | Usado por el front |
| api-gateway | 8080 | Estación Portal 8080 | — | — |

Los prefijos marcados «Usado por el front» son los que ya llaman los servicios del front; hay que confirmarlos con cada equipo contra su Swagger. RabbitMQ (5672) lo usan los servicios entre sí y el front no se conecta a él.

### Cuentas de prueba

La contraseña de todas es `1234`: usuario@styleradar.co, luna@styleradar.co (tienda), abrigo@styleradar.co (fundación) y admin@styleradar.co. En `/login?jurado` aparecen como botones de un clic, para el kit de los jurados.

En el prototipo, después de la contraseña se pide un código de verificación: es `123456`, o se toca «Usar código de prueba».

## Estructura

Se usa el nivel 3 de organización visto en clase: agrupación por módulos. Cada módulo corresponde a un squad y a sus microservicios, así cada equipo trabaja en su carpeta.

```
src/
├── app/                 router, rutas por rol y layouts
├── configs/             variables de entorno
└── modules/
    ├── core/            base común: apiClient, design system, tipos
    ├── landing/         página de bienvenida
    ├── identidad/       Squad 1
    ├── catalogo/        Squad 2
    ├── experiencia/     Squad 3
    ├── transacciones/   Squad 4
    └── soporte/         Squad 5
public/
├── img/                 imágenes
└── prototipo/           prototipo en HTML (referencia de diseño)
docs/                    documentación del proyecto
```

Dentro de cada módulo: `components/`, `hooks/`, `services/`, `states/`, `types/`, `mocks/`, `pages/` y `utils/`, según se necesiten. Cada módulo tiene un README con su squad, sus requerimientos y sus pantallas.

## Reparto por squad

| Módulo | Squad | Microservicios | Requerimientos |
|---|---|---|---|
| identidad | 1 · Identidad (CADCHE) | Authentication, Usuarios, Tiendas | RF 1–6, 62–66, 92 |
| catalogo | 2 · Catálogo (RST) | ItemCatalog, Inventory, Geolocation, Playlist | RF 7–22, 28, 50–61, 69–72, 74 |
| experiencia | 3 · Experiencia (PT8080) | ms-probador-virtual (8500), ms-segunda-vida-donaciones (8520) | RF 23–27, 33–39, 42–49 |
| transacciones | 4 · Transacciones | Pagos y suscripciones | RF 67, 68, 75, 93–103 |
| soporte | 5 · Soporte (GJ) | Notification, Chat, Estadísticas | RF 29–32, 40, 41, 73, 76–91 |
| core, landing | Base común | API Gateway | Router, roles, design system, landing y acceso para jurados |

## Cómo agregar una pantalla

1. Definir los DTOs en `types/` según el Swagger del microservicio.
2. Crear el servicio en `services/` con `apiClient` y, mientras tanto, su versión con datos de `mocks/`.
3. Crear un hook en `hooks/` que llame al servicio y maneje la carga y los errores.
4. Crear la página en `pages/` y registrarla en `src/app/router.tsx` con los roles que la pueden ver.

El ejemplo completo está en el catálogo: `CatalogPage.tsx` → `useItems.ts` → `itemService.ts`.

## Forma de trabajo

- `main` tiene la versión entregable y `develop` la de integración.
- Cada tarea va en una rama `feature/<modulo>-<tarea>` (por ejemplo `feature/catalogo-filtro-talla`) que sale de `develop`.
- Los cambios del plan de cambios del prototipo van en ramas `fix/ux-<grupo>` (por ejemplo `fix/ux-accesibilidad`), también desde `develop`.
- Los cambios entran a `develop` por pull request revisado por otra persona; a `main` solo desde `develop`.
- Los commits van en español: `feat(catalogo): agregar filtro por talla`, `fix(identidad): validar correo`.
- El CI revisa el código, corre las pruebas y compila en cada pull request.

## Documentación

Toda la documentación del front está en `docs/`. El índice con la descripción de cada documento está en [docs/README.md](docs/README.md).

| Carpeta | Contenido |
|---|---|
| `docs/arquitectura/` | Documento de arquitectura y diseño del front v3.0, figuras y versiones anteriores |
| `docs/diagramas-flujo/` | Flujo de navegación entre pantallas para cada rol |
| `docs/requerimientos/` | Requerimientos funcionales y su recorrido en el prototipo |
| `docs/identidad/` | Manual de identidad, logo, colores y personajes |
| `docs/marketing/` | Propuesta de marketing y cronograma |
| `docs/gestion/` | Reparto del front por squad, registro de cambios, plan de cambios del prototipo, sprints y presentación |
| `docs/plantillas/` | Plantilla institucional para los documentos del proyecto |
| `docs/diseno/` | Capturas actuales del prototipo y mockups anteriores |

## Identidad visual

Colores del manual: grafito `#262626`, blanco `#FFFFFF`, arena `#E8DCCB`, lavanda `#B9B9CA` y violeta `#48119A`. Tipografía Poppins. Están definidos en `src/index.css` y se usan como clases de Tailwind (`bg-violeta`, `text-arena`, etc.).
