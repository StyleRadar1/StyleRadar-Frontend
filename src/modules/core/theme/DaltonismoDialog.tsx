import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { CVD_INFO, MODOS_CVD } from './cvdSim'
import { useCvdSim } from './useCvdSim'
import { Opcion, trazo } from './AppearancePanel'
import { IconoModoCvd } from './IconoModoCvd'
import './AppearancePanel.css'

/**
 * Colores de muestra. Son colores fijos y se pintan con el filtro de la página, así que cambian EN VIVO al elegir
 * un modo: es la forma de que la persona vea qué le pasa a los colores sin tener que adivinarlo. Van en pares que
 * se confunden entre sí (rojo y verde; azul y violeta) y con su nombre escrito.
 */
const MUESTRA = [
  { nombre: 'Rojo', color: '#d62839' },
  { nombre: 'Verde', color: '#1f9d55' },
  { nombre: 'Azul', color: '#2563eb' },
  { nombre: 'Violeta', color: '#48119a' },
  { nombre: 'Naranja', color: '#e07b00' },
  { nombre: 'Amarillo', color: '#f2c230' },
] as const

interface Props {
  onCerrar: () => void
}

/**
 * Ventana emergente de los modos de daltonismo. Aparece al activar el daltonismo. Arriba hay una muestra de colores
 * y debajo los modos: al elegir uno, el filtro de ese tipo (ver cvdSim.ts) se aplica a la muestra y a toda la página.
 * «Sin filtro» deja los colores normales (la paleta azul y naranja del daltonismo sigue activa).
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
          Observa estos colores: cambian cuando eliges un modo, igual que el resto de la página.
        </p>

        <ul className="sr-dalt-muestra" aria-label="Colores de muestra">
          {MUESTRA.map(({ nombre, color }) => (
            <li key={nombre}>
              <span className="sr-dalt-color" style={{ background: color }} aria-hidden="true" />
              <span className="sr-dalt-color-nombre">{nombre}</span>
            </li>
          ))}
        </ul>

        <div role="radiogroup" aria-label="Modos de daltonismo" className="sr-apar-opciones">
          {MODOS_CVD.map((m) => (
            <Opcion key={m} activa={modo === m} onClick={() => setModo(m)} aria-label={CVD_INFO[m].etiqueta}>
              <IconoModoCvd modo={m} />
              <span>
                <span className="sr-apar-nombre">{CVD_INFO[m].etiqueta}</span>
                <span className="sr-apar-detalle">{CVD_INFO[m].detalle}</span>
              </span>
            </Opcion>
          ))}
        </div>

        <p className="sr-dalt-leyenda">
          Cada símbolo muestra rojo, verde y azul. La barra rayada es el color que ese modo no distingue; si solo está rayada por encima, lo distingue con dificultad.
        </p>

        <div className="sr-dalt-pie">
          <button type="button" className="sr-dalt-listo" onClick={onCerrar}>Listo</button>
        </div>
      </div>
    </>,
    document.body,
  )
}
