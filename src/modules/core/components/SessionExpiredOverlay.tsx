import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { salidaVoluntariaReciente } from '@/modules/identidad/states/salida'
import { ErrorCard } from './ErrorScene'

/**
 * Aviso global de sesión vencida (401): aparece en rutas públicas cuando expira el token
 * y permite volver a iniciar sesión conservando la página actual para regresar al terminar.
 */
export function SessionExpiredOverlay() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onExpired = () => {
      if (salidaVoluntariaReciente()) return
      if (location.pathname === '/login' || location.search.includes('login')) return
      guardarRetorno()
      setOpen(true)
    }
    window.addEventListener('sr:sesion-expirada', onExpired)
    return () => window.removeEventListener('sr:sesion-expirada', onExpired)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (open && (location.search.includes('login') || location.pathname === '/login')) {
      setOpen(false)
    }
  }, [open, location.pathname, location.search])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Sesión vencida"
    >
      <div className="w-full max-w-2xl">
        <ErrorCard
          variant="etiqueta"
          tone="info"
          chip="Sesión vencida"
          code="00:00"
          title="Tu sesión venció"
          description="Vuelve a iniciar sesión y te regresamos a la página donde estabas."
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  guardarRetorno()
                  setOpen(false)
                  navigate('/?login')
                }}
                className="rounded-xl bg-violeta px-4 py-2 text-sm font-semibold text-white"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-blanco"
              >
                Cancelar
              </button>
            </>
          }
        />
      </div>
    </div>
  )
}
