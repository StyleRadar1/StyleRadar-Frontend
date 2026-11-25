[⬅ Volver al README Principal](../../README.md)

---

## <img src="https://img.shields.io/badge/SECCIÓN_04-16A34A?style=for-the-badge" height="20" align="absmiddle" /> 4. ENTORNOS, VARIABLES DE ENTORNO Y DESPLIEGUE EN VERCEL

### Prerrequisitos de Ejecución

- **Node.js:** Versión **22 LTS** (coincidente con la configurada en [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).
- **Gestor de paquetes:** `npm` (incluido con Node.js).

### Scripts Disponibles (`package.json`)

| Script | Comando | Uso |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Levanta el entorno de desarrollo local en `http://localhost:5173`. |
| `build` | `npm run build` | Ejecuta `tsc -b && vite build` para validar tipos y generar `dist/` en producción. |
| `build:qa` | `npm run build:qa` | Ejecuta `tsc -b && vite build --mode qa` cargando configuración `.env.qa`. |
| `preview` | `npm run preview` | Sirve localmente la compilación generada en `dist/`. |
| `lint` | `npm run lint` | Ejecuta `oxlint` sobre todo el código fuente. |
| `test` | `npm test` | Ejecuta toda la suite de Vitest en modo CI (`vitest run`). |
| `test:watch` | `npm run test:watch` | Ejecuta Vitest en modo observador interactivo. |

---

### Variables de Entorno (`src/configs/env.ts`)

Todas las variables son validadas al arranque por `resolveEnv()` en [`src/configs/env.ts`](../../src/configs/env.ts). Si falta `VITE_API_URL` con mocks desactivados o se intenta habilitar mocks en `production`, la aplicación lanza un error explícito de configuración.

| Variable | Valores Válidos | Obligatoria en QA / Prod | Descripción |
| :--- | :--- | :---: | :--- |
| `VITE_APP_ENV` | `local` \| `qa` \| `production` | Sí | Define el entorno activo. En `qa` muestra banda identificadora superior. |
| `VITE_API_URL` | URL `http(s)://...` | Sí | URL base del **API Gateway**. Nunca apuntar a puertos internos de microservicios. |
| `VITE_USE_MOCKS` | `true` \| `false` | Sí (`false`) | Activa/desactiva respuestas simuladas globales. En `production` debe ser `false`. |
| `VITE_USE_MOCKS_PAGOS` | `true` \| `false` *(opcional)* | No | Permite sobreescribir mocks únicamente para el módulo `transacciones` (pagos/planes). |
| `VITE_MAPBOX_TOKEN` | Token público `pk....` | Sí (para mapa) | Token público de Mapbox restringido por dominio en la consola de Mapbox. Nunca usar tokens secretos (`sk.`). |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth 2.0 *(opcional)* | Solo para login Google | Identificador web público de Google Identity Services para `/api/v1/auth/oauth2/google`. |

> [!IMPORTANT]
> Nunca almacenes secretos reales ni tokens privados (`sk.`) en variables `VITE_*` ni dentro de archivos versionados en Git, ya que Vite los incluye en el bundle del navegador.

<details>
<summary><b>Click para ver plantillas de archivos de entorno (.env / .env.qa / .env.production)</b></summary>

<br>

**Desarrollo local (`.env`, partiendo de [`.env.example`](../../.env.example)):**

```dotenv
VITE_APP_ENV=local
VITE_API_URL=http://localhost:8080
VITE_USE_MOCKS=true
# VITE_USE_MOCKS_PAGOS=false
VITE_MAPBOX_TOKEN=<tu-token-publico-pk>
# VITE_GOOGLE_CLIENT_ID=<tu-client-id-google-oauth>
```

**Entorno QA ([`.env.qa.example`](../../.env.qa.example)):**

```dotenv
VITE_APP_ENV=qa
VITE_API_URL=https://styleradar-gateway-qa.azurewebsites.net
VITE_USE_MOCKS=false
VITE_MAPBOX_TOKEN=<tu-token-publico-pk>
```

**Entorno Producción ([`.env.production.example`](../../.env.production.example)):**

```dotenv
VITE_APP_ENV=production
VITE_API_URL=<url-oficial-api-gateway-produccion>
VITE_USE_MOCKS=false
VITE_MAPBOX_TOKEN=<tu-token-publico-pk>
```

</details>

---

### Autenticación Real con Backend y Despliegue en Vercel

- **Autenticación integrada:** El inicio de sesión oficial se realiza desde el modal del landing (`/?login`), conectado con `POST /api/v1/auth/login`, verificación OTP (`/api/v1/auth/otp/verify`), registro (`/registro` → `POST /api/v1/users`) y Google OAuth 2.0 (`/api/v1/auth/oauth2/google`).
- **Despliegue en Vercel:**
  - El archivo [`vercel.json`](../../vercel.json) redirige todas las rutas de la SPA hacia `/index.html` (`rewrites`), excluyendo `/prototipo/*`.
  - **Despliegue QA activo:** [`https://styleradar-qa.vercel.app/`](https://styleradar-qa.vercel.app/), configurado con `VITE_APP_ENV=qa`, `VITE_USE_MOCKS=false` y `VITE_API_URL=https://styleradar-gateway-qa.azurewebsites.net`.

---

[⬅ Volver al README Principal](../../README.md)
