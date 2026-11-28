import { useId, useState, type ReactNode } from 'react'
import { useTheme, type ThemeMode } from './ThemeContext'
import { executeThemeTransition } from './themeTransition'
import { useCvdSim } from './useCvdSim'
import { CVD_INFO, MODOS_CVD } from './cvdSim'
import './AppearancePanel.css'

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

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
const Marca = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" className="sr-apar-marca" {...trazo} strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

function Opcion({ activa, onClick, children, ...resto }: { activa: boolean; onClick: () => void; children: ReactNode } & Record<string, unknown>) {
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
}

/**
 * Contenido del panel de apariencia. Tres bloques: tema, modo para daltonismo (la ayuda real de la persona
 * usuaria) y simulador (herramienta para revisar el diseño). Es la única fuente de estas opciones.
 */
export function AppearancePanel({ idTitulo, onCerrar, origen }: Props) {
  const { mode, setMode, colorblind, toggleColorblind, resolvedTheme } = useTheme()
  const { modo: modoCvd, setModo: setModoCvd } = useCvdSim()
  const [simAbierto, setSimAbierto] = useState(modoCvd !== 'normal')
  const idSim = useId()
  const base = idTitulo

  const claro = mode === 'light' || (mode === 'system' && resolvedTheme === 'light')
  const elegirTema = (m: ThemeMode) => executeThemeTransition(() => setMode(m), origen)
  const alternarDaltonismo = () => executeThemeTransition(() => toggleColorblind(), origen)

  return (
    <>
      <div className="sr-apar-cab">
        <h2 id={idTitulo} className="sr-apar-titulo">Apariencia y accesibilidad</h2>
        <button type="button" className="sr-apar-cerrar" onClick={onCerrar} aria-label="Cerrar el panel de apariencia">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" {...trazo}>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p className="sr-apar-sub">Tus cambios se guardan en este dispositivo.</p>

      <section className="sr-apar-seccion" aria-labelledby={`${base}-sr-apar-h-tema`}>
        <h3 id={`${base}-sr-apar-h-tema`} className="sr-apar-etiqueta">Tema</h3>
        <div role="radiogroup" aria-label="Tema" className="sr-apar-opciones">
          <Opcion activa={claro} onClick={() => elegirTema('light')} aria-label="Claro">
            <IconoSol />
            <span className="sr-apar-nombre">Claro</span>
          </Opcion>
          <Opcion activa={!claro} onClick={() => elegirTema('dark')} aria-label="Oscuro">
            <IconoLuna />
            <span className="sr-apar-nombre">Oscuro</span>
          </Opcion>
        </div>
      </section>

      <section className="sr-apar-seccion" aria-labelledby={`${base}-sr-apar-h-dalt`}>
        <h3 id={`${base}-sr-apar-h-dalt`} className="sr-apar-etiqueta">Daltonismo</h3>
        <button type="button" role="switch" aria-checked={colorblind} onClick={alternarDaltonismo} className="sr-apar-interruptor">
          <span>
            <span className="sr-apar-nombre">Modo para daltonismo</span>
            <span className="sr-apar-detalle">Usa azul y naranja en lugar de rojo y verde para que se distingan mejor.</span>
          </span>
          <span aria-hidden="true" className="sr-apar-pista" />
        </button>
      </section>

      <section className="sr-apar-seccion" aria-labelledby={`${base}-sr-apar-h-rev`}>
        <h3 id={`${base}-sr-apar-h-rev`} className="sr-apar-etiqueta">Revisar el diseño</h3>
        <button
          type="button"
          className="sr-apar-despliega"
          aria-expanded={simAbierto}
          aria-controls={idSim}
          onClick={() => setSimAbierto((v) => !v)}
        >
          <span>
            <span className="sr-apar-nombre">Simulador de daltonismo</span>
            <span className="sr-apar-detalle">
              {modoCvd === 'normal' ? 'Ver la página como la ve otra persona' : `Viendo: ${CVD_INFO[modoCvd].etiqueta}`}
            </span>
          </span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" {...trazo}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {simAbierto && (
          <div id={idSim}>
            <p className="sr-apar-nota">
              Es una herramienta para revisar el diseño: cambia cómo se ve toda la página, pero no es una ayuda para quien la usa.
            </p>
            <div role="radiogroup" aria-label="Simulador de daltonismo" className="sr-apar-opciones">
              {MODOS_CVD.map((m) => (
                <Opcion key={m} activa={modoCvd === m} onClick={() => setModoCvd(m)} aria-label={CVD_INFO[m].etiqueta}>
                  <span>
                    <span className="sr-apar-nombre">{CVD_INFO[m].etiqueta}</span>
                    <span className="sr-apar-detalle">{CVD_INFO[m].detalle}</span>
                  </span>
                </Opcion>
              ))}
            </div>
            {modoCvd !== 'normal' && (
              <p className="sr-apar-activo" role="status">
                Simulador activo: {CVD_INFO[modoCvd].etiqueta}. Elige «Visión normal» para quitarlo.
              </p>
            )}
          </div>
        )}
      </section>
    </>
  )
}
