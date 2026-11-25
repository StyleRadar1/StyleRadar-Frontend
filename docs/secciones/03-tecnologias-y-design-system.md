[⬅ Volver al README Principal](../../README.md)

---

## <img src="https://img.shields.io/badge/SECCIÓN_03-5600EF?style=for-the-badge" height="20" align="absmiddle" /> 3. TECNOLOGÍAS, DESIGN SYSTEM Y ACCESIBILIDAD VISUAL

### Stack Tecnológico Real (`package.json`)

| Capa | Tecnología | Versión | Rol en la Aplicación |
| :--- | :--- | :---: | :--- |
| **Librería UI** | React / React DOM | `19.3.1` | Renderizado de componentes y concurrencia con `lazy`/`Suspense`. |
| **Lenguaje** | TypeScript | `~7.0.2` | Tipado estricto sobre DTOs, hooks, estados y contratos de componentes. |
| **Empaquetador** | Vite | `8.3.5` | Servidor de desarrollo rápido y build optimizado por chunks. |
| **Estilos** | Tailwind CSS + `@tailwindcss/vite` | `4.3.3` | Utilidades CSS v4 integradas con tokens personalizados `@theme`. |
| **Utilidades CSS** | `clsx` + `tailwind-merge` | `2.1.1` / `3.7.0` | Composición condicional y resolución sin colisiones de clases Tailwind. |
| **Enrutamiento** | React Router DOM | `7.18.5` | Enrutamiento SPA declarativo con guardas por rol y layouts anidados. |
| **Cliente HTTP** | Axios | `1.21.0` | Cliente API centralizado (`apiClient`) con interceptores JWT y refresh. |
| **Animaciones** | Framer Motion | `14.12.0` | Transiciones de microinteracción, modal, perchero y carrusel 3D. |
| **Iconografía** | Lucide React | `1.71.0` | Conjunto unificado de iconos vectoriales accesibles. |
| **Mapas** | Mapbox GL + React Map GL | `3.34.2` / `8.1.3` | Mapa interactivo de Bogotá, pines de tiendas/fundaciones y radio en km. |
| **Pruebas** | Vitest + Testing Library + jsdom | `5.1.0` / `16.3.3` | Suite de 90 archivos de pruebas unitarias, UI y contratos de servicio. |
| **Linter** | Oxlint | `1.89.0` | Verificación estática ultrarrápida en desarrollo local y CI. |

---

### Identidad Visual y Tipografía

- **Tipografía principal:** `Poppins` (configurada como `--font-sans` en [`src/index.css`](../../src/index.css)).
- **Paleta base del manual de identidad:**
  - **Grafito:** `#262626`
  - **Blanco:** `#FFFFFF`
  - **Arena:** `#E8DCCB`
  - **Lavanda:** `#B9B9CA`
  - **Violeta de marca:** `#48119A` (junto a acentos de interfaz `#5600EF` y `#7B4DD8`)

---

### Sistema de 3 Temas Accesibles (A11y)

El proyecto implementa un sistema completo de temas en `src/modules/core/theme/` (`ThemeContext.tsx` y `tokens.css`) y [`src/index.css`](../../src/index.css), aplicado dinámicamente mediante los atributos `[data-theme]` y `[data-tema]` en `<html>`:

| Tema | Valor del Selector | Propósito Visual |
| :--- | :--- | :--- |
| **Oscuro (por defecto)** | `dark` / `oscuro` | Estética nocturna StyleRadar con profundidad cósmica (`--sr-bg: #09070f`, `--sr-surface: #141021`). |
| **Claro** | `light` / `claro` | Alta legibilidad diurna sobre superficies claras manteniendo contraste WCAG. |
| **Daltónico (CVD)** | `daltonico` | Ajuste de paleta de alto contraste y semántica segura para deficiencias de visión de color. |

#### Tokens Semánticos `--sr-*`

Para mantener consistencia automática entre los 3 temas, las vistas consumen variables CSS semánticas en lugar de colores fijos:
- **Superficies y bordes:** `--sr-bg`, `--sr-surface`, `--sr-surface-raised`, `--sr-border-subtle`, `--sr-border-control`, `--sr-shadow`.
- **Texto y acentos:** `--sr-text-primary`, `--sr-text-secondary`, `--sr-text-muted`, `--sr-accent`, `--sr-accent-text`, `--sr-text-on-accent`, `--sr-focus`.
- **Estados semánticos:** `--sr-ok` / `--sr-ok-bg`, `--sr-bad` / `--sr-bad-bg`, `--sr-warn` / `--sr-warn-bg`, `--sr-info` / `--sr-info-bg`.

---

[⬅ Volver al README Principal](../../README.md)
