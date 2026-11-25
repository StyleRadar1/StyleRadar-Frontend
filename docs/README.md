[⬅ Volver al README Principal](../README.md)

# Documentación del frontend de StyleRadar

Actualizada con el proyecto en React integrado con el API Gateway, los módulos por squad, la capa legal colombiana y la documentación modular del repositorio. Las versiones anteriores de cada documento están en las carpetas `historico/`.

## Secciones del README Modular

| Archivo | Contenido |
|---|---|
| `secciones/01-roles-modulos-y-rutas.md` | Roles RBAC, reparto por squad en `src/modules/` y matriz completa de 46 rutas |
| `secciones/02-arquitectura-y-api-gateway.md` | Estructura nivel 3, flujo hacia el API Gateway, renovación JWT y guía para nuevas pantallas |
| `secciones/03-tecnologias-y-design-system.md` | Stack con versiones reales de `package.json`, tipografía `Poppins` y 3 temas accesibles |
| `secciones/04-entornos-variables-y-despliegue.md` | Scripts, variables `VITE_*`, autenticación real y despliegue en Vercel |
| `secciones/05-errores-y-cumplimiento-legal.md` | Manejo centralizado de errores (`README-ERRORES.md`) y capa legal (`LEGAL_PENDIENTES.md`) |
| `secciones/06-pruebas-y-cicd.md` | Suites de Vitest (90 archivos), `oxlint` y pipeline `.github/workflows/ci.yml` |
| `secciones/07-ramas-contribucion-y-equipo.md` | Flujo de ramas, commits en español, integrantes y enlaces oficiales |

## Arquitectura

| Documento | Descripción |
|---|---|
| `arquitectura/StyleRadar_Arquitectura_Frontend_v3_0.docx` (y PDF) | Documento de arquitectura y diseño del front, con el índice pedido en el curso: introducción, pantallas y acceso por rol, flujos, tecnologías, paleta, modelos de referencia, funcionalidades, despliegue, referencias e historial |
| `arquitectura/figuras/` | Arquitectura actual y arquitectura objetivo (PNG y SVG) |
| `arquitectura/historico/` | Versiones 1.1 y 2.0, la revista v2.1 y sus figuras |

## Diagramas de flujo

`diagramas-flujo/` tiene el flujo de navegación de cada rol: invitado, comprador, almacén, fundación y administrador (PNG y SVG). La versión anterior está en `diagramas-flujo/historico/`.

## Requerimientos

| Documento | Descripción |
|---|---|
| `requerimientos/StyleRadar_Requerimientos_Completos_v3.xlsx` | Requerimientos funcionales y no funcionales, y la hoja «Trazabilidad front» con los 103 requerimientos por squad, microservicio, módulo y ruta |
| `requerimientos/StyleRadar_Requerimientos_en_Prototipo.docx` | Paso a paso de cada requerimiento dentro del prototipo, con capturas |

## Identidad

| Archivo | Descripción |
|---|---|
| `identidad/StyleRadar_Manual_de_Identidad.html` | Manual de identidad visual con los personajes nuevos (abrir en el navegador) |
| `identidad/logo/` | Logo, isotipo y versión negativa en SVG |
| `identidad/color/` | Muestras de la paleta: grafito, blanco, arena, lavanda y violeta |
| `identidad/personajes/` | Fotos de los cinco personajes: Antonia (Sastre), Mateo (Calle), Aura (Futuro), Nora (Rebelde) y Tomás (Esencial) |

## Gestión

| Documento | Descripción |
|---|---|
| `gestion/StyleRadar_Propuesta_Reparto_Front.docx` | Repositorio, estructura y reparto de vistas y requerimientos por squad |
| `gestion/StyleRadar_Registro_de_Cambios_Front.docx` | Cambios del prototipo y de la documentación, con su motivo y autor, respaldos y cambios opcionales |
| `gestion/StyleRadar_Plan_de_Cambios_Prototipo_v2_0.docx` | Plan de cambios del prototipo: lo ya hecho, accesibilidad, registro, probador, consistencia, limpieza, fallos, acabados, orden de trabajo y decisiones abiertas. La v1.0 está en `historico/` |
| `gestion/StyleRadar_Presentacion.pdf` | Presentación del Sprint 2 |
| `gestion/sprints/` | Notas de los sprints, matriz de cambios y validaciones (registro histórico) |

## Plantillas

`plantillas/` tiene la plantilla institucional en Word y en HTML. Todos los documentos del proyecto se hacen a partir de ella.

## Diseño

`diseno/capturas/` tiene 36 capturas actuales del prototipo: landing, inicio de sesión por rol, bienvenida, pantallas del comprador, de la tienda, de la fundación y del administrador, y vistas en celular. Los mockups anteriores están en `diseno/historico/mockups/`.
