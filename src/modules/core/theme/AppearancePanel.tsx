import { type ReactNode } from 'react'
import { useTheme } from './ThemeContext'
import { executeThemeTransition } from './themeTransition'
import { useCvdSim } from './useCvdSim'
import { CVD_INFO } from './cvdSim'
import './AppearancePanel.css'

export const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const IconoSol = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" {...trazo}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)
const IconoLuna = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" {...trazo}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
)
const IconoOjo = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" {...trazo}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
export const Marca = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" className="sr-apar-marca" {...trazo} strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const TEMAS = [
  { id: 'light', nombre: 'Claro', Icono: IconoSol },
  { id: 'dark', nombre: 'Oscuro', Icono: IconoLuna },
] as const

/** Botón de opción tipo radio, grande y con el estado a la vista. */
export function Opcion({
  activa,
  onClick,
  children,
  ...resto
}: { activa: boolean; onClick: () => void; children: ReactNode } & Record<string, unknown>) {
  return (
    <button type="button" role="radio" aria-checked={activa} onClick={onClick} className="sr-apar-opcion" {...resto}>
      {children}
      {activa && <Marca />}
    </button>
  )
}

interface Props {
  /** id del título, para que el contenedor se nombre con él */
  idTitulo: string
  onCerrar: () => void
  /** Elemento desde el que nace la animación del cambio de tema */
  origen: HTMLElement | null
  /** Abre la ventana de modos de daltonismo (al activar el daltonismo o al pulsar «Cambiar modo») */
  onDaltonismo: () => void
}

/**
 * Selector de tema. Dos decisiones independientes:
 *  - Tema: Claro u Oscuro.
 *  - Daltonismo: un interruptor que se SUMA al tema (no es un tercer tema), así se puede usar con Claro o con Oscuro.
 *    Al activarlo se abre la ventana con los modos por tipo de daltonismo.
 */
export function AppearancePanel({ idTitulo, onCerrar, origen, onDaltonismo }: Props) {
  const { mode, setMode, resolvedTheme, colorblind, setColorblind } = useTheme()
  const { modo: modoCvd, setModo: setModoCvd } = useCvdSim()

  const claro = mode === 'light' || (mode === 'system' && resolvedTheme === 'light')
  const elegirTema = (id: (typeof TEMAS)[number]['id']) => executeThemeTransition(() => setMode(id), origen)

  const alternarDaltonismo = () => {
    if (colorblind) {
      setModoCvd('normal')
      executeThemeTransition(() => setColorblind(false), origen)
      return
    }
    executeThemeTransition(() => setColorblind(true), origen)
    onDaltonismo()
  }

  const nombreModo = CVD_INFO[modoCvd].etiqueta

  return (
    <>
      <div className="sr-apar-cab">
        <h2 id={idTitulo} className="sr-apar-titulo">Tema</h2>
        <button type="button" className="sr-apar-cerrar" onClick={onCerrar} aria-label="Cerrar el selector de tema">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" {...trazo}>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p className="sr-apar-sub">Elige cómo se ve la aplicación. Se guarda en este dispositivo.</p>

      <div role="radiogroup" aria-label="Tema" className="sr-apar-opciones">
        {TEMAS.map(({ id, nombre, Icono }) => (
          <Opcion key={id} activa={id === 'light' ? claro : !claro} onClick={() => elegirTema(id)} aria-label={nombre}>
            <Icono />
            <span className="sr-apar-nombre">{nombre}</span>
          </Opcion>
        ))}
      </div>

      <section className="sr-apar-extra" aria-labelledby={`${idTitulo}-dalt`}>
        <h3 id={`${idTitulo}-dalt`} className="sr-apar-etiqueta">Filtro adicional</h3>
        <button
          type="button"
          role="switch"
          aria-checked={colorblind}
          onClick={alternarDaltonismo}
          className="sr-apar-interruptor"
        >
          <IconoOjo />
          <span className="sr-apar-interruptor-texto">
            <span className="sr-apar-nombre">Daltonismo</span>
            <span className="sr-apar-detalle">
              Se suma al tema que elijas. Usa azul y naranja en lugar de rojo y verde.
            </span>
          </span>
          <span className="sr-apar-estado">
            <span className="sr-apar-pista" aria-hidden="true" />
            <span className="sr-apar-estado-texto">{colorblind ? 'Activado' : 'Desactivado'}</span>
          </span>
        </button>

        {colorblind && (
          <button type="button" className="sr-apar-cambiar" onClick={onDaltonismo}>
            <span>
              <span className="sr-apar-detalle">Modo actual</span>
              <span className="sr-apar-nombre">{nombreModo}</span>
            </span>
            <span className="sr-apar-cambiar-texto">Cambiar modo</span>
          </button>
        )}
      </section>
    </>
  )
}
