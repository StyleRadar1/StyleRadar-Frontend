import { useEffect, useRef, useState } from 'react'
import { EVENTO_SIN_CONEXION } from '@/modules/core/api/conexion'
import { clearMockScenarios, hasScenario } from '@/modules/core/api/mockScenario'
import { EscenaError } from './errores'

const BOTON = 'rounded-xl px-5 py-3 text-sm font-semibold'

/**
 * Pantalla única de sin conexión. Se abre cuando una petición no llega al servidor
 * (o el navegador pierde internet) y tapa toda la app, sea cual sea la pantalla.
 * Se cierra sola cuando vuelve la conexión.
 */
export function SinConexion() {
  const [abierta, setAbierta] = useState(false)
  const [intento, setIntento] = useState(0)
  const reintentar = useRef<HTMLButtonElement>(null)

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

  useEffect(() => { if (abierta) reintentar.current?.focus() }, [abierta])

  if (!abierta) return null

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
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[var(--sr-bg)]"
      data-testid="sin-conexion"
    >
      <EscenaError
        grande
        escena="tornamesa"
        intento={intento}
        nivel="h1"
        etiqueta="Sin conexión"
        titulo="No hay conexión"
        texto="No pudimos comunicarnos con StyleRadar. Revisa tu internet e intenta de nuevo."
        descripcion="Tornamesa detenida mientras vuelve la conexión"
        acciones={
          <>
            <button ref={reintentar} type="button" onClick={volverAIntentar} className={`${BOTON} bg-violeta text-white`}>
              Reintentar
            </button>
            {simulada && (
              <button
                type="button"
                onClick={() => { clearMockScenarios(); window.location.reload() }}
                className={`${BOTON} border border-white/20 text-[var(--sr-tx)]`}
              >
                Quitar simulación
              </button>
            )}
          </>
        }
      />
    </div>
  )
}
