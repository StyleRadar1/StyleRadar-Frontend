import { useCallback, useEffect, useRef, useState } from 'react'
import { useInRouterContext, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { EVENTO_SIN_CONEXION } from '@/modules/core/api/conexion'
import { clearMockScenarios, hasScenario } from '@/modules/core/api/mockScenario'
import './errores/errores.css'

const VINILO = '/img/vinyl-record.png'

function SinConexionRouteWatcher({ onRouteChange }: { onRouteChange: () => void }) {
  const { pathname } = useLocation()
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      onRouteChange()
    }
  }, [pathname, onRouteChange])

  return null
}

/**
 * Pantalla única de sin conexión. Se abre cuando el navegador pierde internet o hay una caída
 * global repetida, y puede cerrarse manualmente (Cerrar / Escape) o al cambiar de ruta.
 */
export function SinConexion() {
  const [abierta, setAbierta] = useState(false)
  const [intento, setIntento] = useState(0)
  const reintentar = useRef<HTMLButtonElement>(null)
  const quieto = useReducedMotion()
  const inRouter = useInRouterContext()

  const cerrarModal = useCallback(() => setAbierta(false), [])

  useEffect(() => {
    const abrir = () => setAbierta(true)
    const cerrar = () => setAbierta(false)
    const alCambiarSimulacion = () => { if (!hasScenario('sin-red')) setAbierta(false) }
    window.addEventListener(EVENTO_SIN_CONEXION, abrir)
    window.addEventListener('offline', abrir)
    window.addEventListener('online', cerrar)
    window.addEventListener('sr:mock-changed', alCambiarSimulacion)
    return () => {
      window.removeEventListener(EVENTO_SIN_CONEXION, abrir)
      window.removeEventListener('offline', abrir)
      window.removeEventListener('online', cerrar)
      window.removeEventListener('sr:mock-changed', alCambiarSimulacion)
    }
  }, [])

  useEffect(() => {
    if (!abierta) return
    reintentar.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierta(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [abierta])

  if (!abierta) return inRouter ? <SinConexionRouteWatcher onRouteChange={cerrarModal} /> : null

  const simulada = hasScenario('sin-red')
  const volverAIntentar = () => {
    setIntento((n) => n + 1)
    // Sin internet en el navegador no tiene sentido recargar: la tornamesa vuelve a intentarlo.
    if (!simulada && navigator.onLine === false) return
    window.location.reload()
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Sin conexión"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#0d0c12] select-none"
      data-testid="sin-conexion"
    >
      {inRouter && <SinConexionRouteWatcher onRouteChange={cerrarModal} />}
      <button
        type="button"
        onClick={cerrarModal}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/50 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden="true">✕</span>
        <span>Cerrar</span>
      </button>
      {/* Escena del disco de vinilo a pantalla completa integrada directamente en el fondo oscuro sin bordes ni marcos */}
      <div
        role="img"
        aria-label="Tornamesa detenida mientras vuelve la conexión"
        className="relative flex h-full w-full items-center justify-center"
      >
        {/* Disco de vinilo completo con su animación EXACTA original, integrado limpiamente en el fondo */}
        <motion.img
          key={`disco-${intento}`}
          src={VINILO}
          alt=""
          className="pointer-events-none absolute aspect-square w-[min(94vh,92vw)] max-w-[900px] rounded-full object-contain"
          initial={{ rotate: 0 }}
          animate={quieto ? { rotate: 0 } : { rotate: [0, 1080, 1260] }}
          transition={{ duration: 4.2, times: [0, 0.62, 1], ease: ['linear', 'easeOut'] }}
        />

        {/* Etiqueta circular morada central */}
        <div className="relative z-10 flex aspect-square w-[min(40vh,42vw)] min-w-[270px] max-w-[390px] flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#3a1768_0%,#260e46_70%,#1a0933_100%)] p-6 text-center shadow-[inset_0_0_24px_rgba(0,0,0,0.6)]">
          {/* Anillo interior sutil de la etiqueta */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[3.5%] rounded-full border border-purple-300/15"
          />
          {/* Agujero central sutil del vinilo detrás del texto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-6 w-6 rounded-full bg-[#140726] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9),0_0_0_3px_rgba(74,35,120,0.2)]"
          />

          {/* Contenido centrado sobre la etiqueta morada */}
          <div className="relative z-10 flex flex-col items-center justify-center px-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6b9d] sm:text-[11px]">
              <span className="h-2 w-2 rounded-full bg-[#ff6b9d] shadow-[0_0_0_4px_rgba(255,107,157,0.25)]" />
              SIN CONEXIÓN
            </span>

            {/* Título en una sola línea */}
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#f6f1e7] sm:text-3xl md:text-[34px] md:leading-tight sm:whitespace-nowrap">
              No hay conexión
            </h1>

            <p className="mt-2 max-w-[26ch] text-[11px] leading-relaxed text-[#d8d0e5]/85 sm:max-w-[28ch] sm:text-xs">
              No pudimos comunicarnos con StyleRadar. Revisa tu internet e intenta de nuevo.
            </p>

            {/* Botones: Reintentar y Quitar simulación apilados verticalmente como en la imagen */}
            <div className="mt-4 flex flex-col items-center justify-center gap-2.5">
              <button
                ref={reintentar}
                type="button"
                onClick={volverAIntentar}
                className="cursor-pointer rounded-full bg-[#5b1df0] px-6 py-2 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(91,29,240,0.45)] transition hover:bg-[#6b2cf5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm"
              >
                Reintentar
              </button>
              {simulada && (
                <button
                  type="button"
                  onClick={() => { clearMockScenarios(); window.location.reload() }}
                  className="cursor-pointer rounded-full border border-white/30 bg-transparent px-5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Quitar simulación
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Brazo del tocadiscos en el lado derecho con la animación EXACTA original */}
        <motion.svg
          key={`brazo-${intento}`}
          viewBox="0 0 120 220"
          aria-hidden="true"
          className="pointer-events-none absolute right-[1%] top-[1%] z-20 w-[24vw] min-w-[110px] max-w-[230px] sm:right-[3%] sm:w-[18vw] md:right-[5%] md:w-[15vw]"
          style={{ originX: '78%', originY: '10%' }}
          initial={{ rotate: 0 }}
          animate={{ rotate: -24 }}
          transition={{ delay: quieto ? 0 : 3.4, duration: quieto ? 0 : 1.1, ease: [0.3, 0.7, 0.2, 1] }}
        >
          <circle cx="94" cy="22" r="17" fill="#1b1b1f" stroke="#55525c" strokeWidth="2" />
          <circle cx="94" cy="22" r="7" fill="#d9d6de" />
          <path d="M94 22 L86 150 L58 196" fill="none" stroke="#d9d6de" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="42" y="188" width="26" height="16" rx="3" transform="rotate(-30 55 196)" fill="#2b2b31" stroke="#77737d" />
        </motion.svg>
      </div>
    </div>
  )
}
