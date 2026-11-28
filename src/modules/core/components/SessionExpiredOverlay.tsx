import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { guardarRetorno } from '@/modules/core/api/retorno'
import { salidaVoluntariaReciente } from '@/modules/identidad/states/salida'
import { Etiqueta } from './errores/Escenas'

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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0d0c12]/90 p-4 backdrop-blur-md select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Sesión vencida"
    >
      <div className="relative flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,#1d1a29_0%,#111016_75%,#0a090e_100%)] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.9)] sm:p-10">
        {/* Ilustración de la etiqueta animada */}
        <div
          role="img"
          aria-label="Etiqueta de prenda con reloj en cero"
          className="relative mb-3 flex aspect-[5/4] w-full max-w-[260px] items-center justify-center"
        >
          <Etiqueta />
        </div>

        {/* Chip superior */}
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8dc5e8] sm:text-xs">
          <span className="h-2 w-2 rounded-full bg-[#8dc5e8] shadow-[0_0_0_4px_rgba(141,197,232,0.25)]" />
          SESIÓN VENCIDA · 00:00
        </span>

        {/* Título */}
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#f6f1e7] sm:text-3xl">
          Tu sesión venció
        </h2>

        {/* Descripción */}
        <p className="mt-2.5 max-w-[34ch] text-xs leading-relaxed text-[#d8d0e5]/85 sm:text-sm">
          Vuelve a iniciar sesión y te regresamos a la página donde estabas.
        </p>

        {/* Botones estilo píldora */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={() => {
              guardarRetorno()
              setOpen(false)
              navigate('/login')
            }}
            className="cursor-pointer rounded-full bg-[#5b1df0] px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(91,29,240,0.45)] transition hover:bg-[#6b2cf5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-full border border-white/30 bg-transparent px-5 py-2.5 text-xs font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}


