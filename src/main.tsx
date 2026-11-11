import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/modules/identidad/states/AuthProvider'
import { ThemeProvider, getSavedTheme, applyThemeToDom } from '@/modules/core/theme'
import { router } from '@/app/router'
import './index.css'

// P2: Aplicar el tema guardado en el DOM inmediatamente antes de renderizar
// para evitar cualquier parpadeo (FOUC), sin requerir scripts en index.html
applyThemeToDom(getSavedTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
