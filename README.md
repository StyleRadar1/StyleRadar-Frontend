<!-- ==============================================================================
  STYLE RADAR · FRONTEND WEB (REACT + TYPESCRIPT + VITE)
  Asignatura: DOSW (Diseño y Operación de Soluciones Web) · 2026
  Organización: StyleRadar1
============================================================================== -->

<div align="center">

  <a href="https://github.com/StyleRadar1">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/identidad/logo/styleradar-logo-negativo.svg" />
      <source media="(prefers-color-scheme: light)" srcset="docs/identidad/logo/styleradar-logo.svg" />
      <img src="docs/identidad/logo/styleradar-logo.svg" width="320" alt="StyleRadar Logo Oficial" />
    </picture>
  </a>

  <h1>STYLE<font color="#5600EF">RADAR</font> &nbsp;·&nbsp; <code>Frontend</code></h1>

  <p align="center">
    <img src="https://img.shields.io/badge/ARQUITECTURA-MODULAR_(10_MÓDULOS)-12063A?style=for-the-badge" alt="Arquitectura Modular" />
    <img src="https://img.shields.io/badge/PANTALLAS-46_VISTAS-5600EF?style=for-the-badge" alt="46 Vistas" />
    <img src="https://img.shields.io/badge/ROLES_RBAC-4_PERFILES_+_PÚBLICO-16A34A?style=for-the-badge" alt="Roles RBAC" />
    <img src="https://img.shields.io/badge/ORGANIZACIÓN-STYLERADAR1-12063A?style=for-the-badge" alt="StyleRadar1" />
  </p>

  <p align="center">
    <strong><font color="#5600EF">Descubre tu estilo. En tu ciudad.</font></strong><br />
    <em>Aplicación web en React que conecta a compradores con almacenes de moda local de Bogotá: catálogo personalizado, mapa interactivo, probador virtual con IA, segunda vida, donaciones, suscripciones y cumplimiento legal colombiano.</em>
  </p>

  <p align="center">
    <a href="docs/secciones/04-entornos-variables-y-despliegue.md"><img src="https://img.shields.io/badge/DEV_LOCAL-Active-16A34A?style=for-the-badge&logo=vite&logoColor=white" alt="DEV Local Active" /></a>
    <a href="https://styleradar-qa.vercel.app/"><img src="https://img.shields.io/badge/QA_VERCEL-Active-5600EF?style=for-the-badge&logo=vercel&logoColor=white" alt="QA Vercel Active" /></a>
    <a href=".github/workflows/ci.yml"><img src="https://img.shields.io/badge/CI_WORKFLOW-ci.yml-16A34A?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI Workflow" /></a>
    <a href="docs/secciones/06-pruebas-y-cicd.md"><img src="https://img.shields.io/badge/VITEST_SUITES-90_ARCHIVOS-16A34A?style=for-the-badge&logo=vitest&logoColor=white" alt="90 Test Suites" /></a>
    <a href="docs/secciones/03-tecnologias-y-design-system.md"><img src="https://img.shields.io/badge/TEMAS_A11Y-OSCURO_%7C_CLARO_%7C_DALTÓNICO-12063A?style=for-the-badge" alt="Temas Accesibles" /></a>
  </p>

  <p align="center">
    <a href="docs/secciones/03-tecnologias-y-design-system.md"><img src="https://img.shields.io/badge/REACT-19.3.1-12063A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19.3.1" /></a>
    <a href="docs/secciones/03-tecnologias-y-design-system.md"><img src="https://img.shields.io/badge/TYPESCRIPT-7.0.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="docs/secciones/03-tecnologias-y-design-system.md"><img src="https://img.shields.io/badge/VITE-8.3.5-5600EF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8.3.5" /></a>
    <a href="docs/secciones/03-tecnologias-y-design-system.md"><img src="https://img.shields.io/badge/TAILWIND_CSS-4.3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4.3.3" /></a>
    <a href="docs/secciones/03-tecnologias-y-design-system.md"><img src="https://img.shields.io/badge/REACT_ROUTER-7.18.5-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router" /></a>
    <a href="docs/secciones/03-tecnologias-y-design-system.md"><img src="https://img.shields.io/badge/MAPBOX_GL-3.34.2-12063A?style=for-the-badge&logo=mapbox&logoColor=white" alt="Mapbox GL" /></a>
  </p>

</div>

---

La aplicación web de **StyleRadar** integra **10 módulos funcionales**, **46 pantallas navegables** con carga diferida (*lazy loading*) y **31 servicios** conectados directamente al **API Gateway** de la plataforma. Cuenta con diseño adaptable, 3 temas visuales accesibles (oscuro, claro y daltónico), capa de cumplimiento legal colombiana (`/legal`) y suite automatizada con **90 archivos de pruebas**.

---

## <img src="https://img.shields.io/badge/ÍNDICE-5600EF?style=for-the-badge" height="20" align="absmiddle" /> ÍNDICE DE CONTENIDOS

1. [Roles, módulos, squads y mapa de rutas](docs/secciones/01-roles-modulos-y-rutas.md)
2. [Arquitectura modular e integración con el API Gateway](docs/secciones/02-arquitectura-y-api-gateway.md)
3. [Tecnologías, Design System y accesibilidad visual](docs/secciones/03-tecnologias-y-design-system.md)
4. [Entornos, variables de entorno y despliegue en Vercel](docs/secciones/04-entornos-variables-y-despliegue.md)
5. [Manejo de errores y cumplimiento legal](docs/secciones/05-errores-y-cumplimiento-legal.md)
6. [Pruebas automatizadas, linter y CI/CD](docs/secciones/06-pruebas-y-cicd.md)
7. [Ramas, convenciones y equipo de frontend](docs/secciones/07-ramas-contribucion-y-equipo.md)

---

## <img src="https://img.shields.io/badge/ENTORNOS-12063A?style=for-the-badge" height="20" align="absmiddle" /> ENTORNOS Y DESPLIEGUE

| Entorno | Estado | URL Frontend | Backend (API Gateway) | `VITE_USE_MOCKS` |
| :--- | :---: | :--- | :--- | :---: |
| **Desarrollo Local** | Activo | `http://localhost:5173` | `VITE_API_URL` (`http://localhost:8080` o Gateway QA) | `true` / `false` |
| **QA Cloud (Vercel)** | Activo | [`https://styleradar-qa.vercel.app/`](https://styleradar-qa.vercel.app/) | `https://styleradar-gateway-qa.azurewebsites.net` | `false` |
| **Producción** | Configurado | Dominio productivo Vercel | URL oficial del Gateway productivo | `false` |

> [!IMPORTANT]
> El frontend **nunca se comunica directamente con los puertos individuales de los microservicios**. Toda petición HTTP sale hacia `VITE_API_URL` (API Gateway), con `Authorization: Bearer <token>` y `VITE_USE_MOCKS=false` en QA y Producción.

---

## <img src="https://img.shields.io/badge/INICIO_RÁPIDO-16A34A?style=for-the-badge" height="20" align="absmiddle" /> INICIO RÁPIDO EN LOCAL

Prerrequisito: **Node.js 22 LTS** (alineado con CI) y `npm`.

```bash
# 1. Clonar el repositorio
git clone https://github.com/StyleRadar1/StyleRadar_Frontend.git
cd StyleRadar_Frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env            # Linux / macOS
# copy .env.example .env        # Windows (CMD / PowerShell)

# 4. Levantar servidor de desarrollo en http://localhost:5173
npm run dev
```

| Comando | Propósito |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo Vite con recarga rápida (`http://localhost:5173`) |
| `npm run build` | Verificación TypeScript (`tsc -b`) y compilación para producción |
| `npm run build:qa` | Verificación TypeScript (`tsc -b`) y compilación con perfil `--mode qa` |
| `npm run lint` | Análisis estático de código con `oxlint` |
| `npm test` / `npm run test:watch` | Suite de pruebas unitarias e integración con Vitest |

---

## <img src="https://img.shields.io/badge/DOCUMENTACIÓN_ADICIONAL-5600EF?style=for-the-badge" height="20" align="absmiddle" /> DOCUMENTOS COMPLEMENTARIOS

* [Índice documental completo del proyecto](docs/README.md) — Arquitectura v3.0, diagramas de flujo por rol, requerimientos y manual de identidad.
* [Guía unificada de manejo de errores](README-ERRORES.md) — Escenas visuales, componentes transversales y catálogo de escenarios `?mock=<escenario>` en desarrollo.
* [Registro de cumplimiento legal](LEGAL_PENDIENTES.md) — Cobertura normativa colombiana, banner de cookies y documentos de `/legal`.
