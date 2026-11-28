import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { ThemeProvider, getSavedTheme, applyThemeToDom, CvdFilters, aplicarCvdSim, leerCvdSim } from '@/modules/core/theme'
import { router } from '@/app/router'
import './index.css'

// P2: Aplicar el tema guardado en el DOM inmediatamente antes de renderizar
// para evitar cualquier parpadeo (FOUC), sin requerir scripts en index.html
applyThemeToDom(getSavedTheme())
// Simulador de visión de color (herramienta de revisión de diseño): recupera el modo guardado o el de ?cvd=
aplicarCvdSim(leerCvdSim())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CvdFilters />
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
