import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { CVD_INFO, MODOS_CVD, type ModoCvd } from './cvdSim'
import { useCvdSim } from './useCvdSim'
import { Opcion, trazo } from './AppearancePanel'
import { IconoModoCvd } from './IconoModoCvd'
import './AppearancePanel.css'

/** «Visión normal» aquí significa «no aplicar ningún filtro»: la paleta de daltonismo sigue activa. */
const etiqueta = (m: ModoCvd) => (m === 'normal' ? 'Solo la paleta' : CVD_INFO[m].etiqueta)
const detalle = (m: ModoCvd) => (m === 'normal' ? 'Sin filtro de modo' : CVD_INFO[m].detalle)

interface Props {
  onCerrar: () => void
}

/**
 * Ventana emergente de los modos de daltonismo. Aparece al elegir «Daltonismo» en el tema. Cada modo aplica a
 * toda la página el filtro de ese tipo (ver cvdSim.ts); «Solo la paleta» los quita y deja la paleta azul y naranja.
 */
export function DaltonismoDialog({ onCerrar }: Props) {
  const { modo, setModo } = useCvdSim()
  const ref = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()

  useEffect(() => {
    ref.current?.focus()
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [])

  // Escape cierra; Tab no se escapa de la ventana
  const alTeclear = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); return }
    if (e.key !== 'Tab' || !ref.current) return
    const focos = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
    if (!focos.length) return
    const primero = focos[0]
    const ultimo = focos[focos.length - 1]
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === ref.current)) { e.preventDefault(); ultimo.focus() }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
  }

  return createPortal(
    <>
      <div className="sr-dalt-fondo" aria-hidden="true" onClick={onCerrar} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescripcion}
        tabIndex={-1}
        className="sr-dalt"
        onKeyDown={alTeclear}
      >
        <div className="sr-apar-cab">
          <h2 id={idTitulo} className="sr-apar-titulo">Modos de daltonismo</h2>
          <button type="button" className="sr-apar-cerrar" onClick={onCerrar} aria-label="Cerrar los modos de daltonismo">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" {...trazo}>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p id={idDescripcion} className="sr-apar-sub">
          La paleta azul y naranja ya está activa. Elige un modo para ver toda la página como la vería una persona con ese tipo de daltonismo.
        </p>

        <div role="radiogroup" aria-label="Modos de daltonismo" className="sr-apar-opciones">
          {MODOS_CVD.map((m) => (
            <Opcion key={m} activa={modo === m} onClick={() => setModo(m)} aria-label={etiqueta(m)}>
              <IconoModoCvd modo={m} />
              <span>
                <span className="sr-apar-nombre">{etiqueta(m)}</span>
                <span className="sr-apar-detalle">{detalle(m)}</span>
              </span>
            </Opcion>
          ))}
        </div>

        <p className="sr-dalt-leyenda">
          Cada símbolo muestra tres colores (rojo, verde y azul). La barra rayada es el color que ese modo no distingue; si solo está rayada por encima, lo distingue con dificultad.
        </p>

        <div className="sr-dalt-pie">
          <button type="button" className="sr-dalt-listo" onClick={onCerrar}>Listo</button>
        </div>
      </div>
    </>,
    document.body,
  )
}
