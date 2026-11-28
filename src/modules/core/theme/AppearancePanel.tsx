import { type ReactNode } from 'react'
import { useTheme } from './ThemeContext'
import { executeThemeTransition } from './themeTransition'
import { useCvdSim } from './useCvdSim'
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
  { id: 'claro', nombre: 'Claro', detalle: 'Fondo claro', Icono: IconoSol },
  { id: 'oscuro', nombre: 'Oscuro', detalle: 'Fondo oscuro', Icono: IconoLuna },
  { id: 'daltonico', nombre: 'Daltonismo', detalle: 'Paleta azul y naranja, y modos para cada tipo', Icono: IconoOjo },
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
  /** Se llama al elegir «Daltonismo»: quien lo usa abre la ventana de modos */
  onDaltonismo: () => void
}

/**
 * Panel del tema de la aplicación: solo Claro, Oscuro o Daltonismo (excluyentes). Daltonismo abre una ventana
 * emergente con los modos por tipo de daltonismo; Claro y Oscuro quitan cualquier modo de daltonismo activo.
 */
export function AppearancePanel({ idTitulo, onCerrar, origen, onDaltonismo }: Props) {
  const { theme, setTheme } = useTheme()
  const { setModo: setModoCvd } = useCvdSim()

  const elegir = (id: (typeof TEMAS)[number]['id']) => {
    if (id === 'daltonico') {
      if (theme !== 'daltonico') executeThemeTransition(() => setTheme('daltonico'), origen)
      onDaltonismo()
      return
    }
    setModoCvd('normal')
    executeThemeTransition(() => setTheme(id), origen)
  }

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

      <div role="radiogroup" aria-label="Tema" className="sr-apar-opciones sr-apar-opciones--lista">
        {TEMAS.map(({ id, nombre, detalle, Icono }) => (
          <Opcion key={id} activa={theme === id} onClick={() => elegir(id)} aria-label={nombre}>
            <Icono />
            <span>
              <span className="sr-apar-nombre">{nombre}</span>
              <span className="sr-apar-detalle">{detalle}</span>
            </span>
          </Opcion>
        ))}
      </div>
    </>
  )
}
