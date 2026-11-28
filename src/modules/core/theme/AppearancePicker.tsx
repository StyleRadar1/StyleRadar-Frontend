import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from './ThemeContext'
import { useCvdSim } from './useCvdSim'
import { CVD_INFO } from './cvdSim'
import { AppearancePanel } from './AppearancePanel'
import { DaltonismoDialog } from './DaltonismoDialog'

interface AppearancePickerProps {
  className?: string
  align?: 'left' | 'right'
  /** 'onDark': para encabezados oscuros fijos (landing, administración). 'themed': usa los colores del tema (barra de la app). */
  tone?: 'onDark' | 'themed'
}

const BOTON_BASE =
  'group relative flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violeta-claro'
const BOTON_TONO = {
  onDark: 'border-white/20 bg-black/25 text-white/90 hover:border-white/35 hover:bg-white/10 hover:text-white',
  themed:
    'border-[var(--sr-border-control)] bg-[var(--sr-surface)] text-[var(--sr-text-primary)] hover:bg-[var(--sr-surface-raised)]',
} as const

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/**
 * Botón «Tema» y su panel (Claro, Oscuro, Daltonismo). El panel se dibuja en <body> (no dentro del encabezado)
 * para que ni el desenfoque ni la posición fija del encabezado lo desplacen; en teléfono sube como una hoja
 * desde abajo. Al elegir Daltonismo se cierra el panel y se abre la ventana emergente de modos de daltonismo.
 */
export function AppearancePicker({ className = '', align = 'right', tone = 'onDark' }: AppearancePickerProps) {
  const { theme } = useTheme()
  const { modo: modoCvd } = useCvdSim()
  const [abierto, setAbierto] = useState(false)
  const [dialogo, setDialogo] = useState(false)
  const [pos, setPos] = useState({ top: 0, lado: 0 })
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idPanel = useId()

  const colocar = useCallback(() => {
    const r = botonRef.current?.getBoundingClientRect()
    if (!r) return
    const ancho = document.documentElement.clientWidth
    setPos({ top: r.bottom + 8, lado: Math.max(12, align === 'right' ? ancho - r.right : r.left) })
  }, [align])

  const cerrar = useCallback((devolverFoco = true) => {
    setAbierto(false)
    if (devolverFoco) botonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!abierto) return
    colocar()
    panelRef.current?.focus()
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar() }
    const alPulsar = (e: MouseEvent) => {
      const t = e.target as Node
      if (!panelRef.current?.contains(t) && !botonRef.current?.contains(t)) cerrar(false)
    }
    document.addEventListener('keydown', alTeclear)
    document.addEventListener('mousedown', alPulsar)
    window.addEventListener('resize', colocar)
    window.addEventListener('scroll', colocar, true)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.removeEventListener('mousedown', alPulsar)
      window.removeEventListener('resize', colocar)
      window.removeEventListener('scroll', colocar, true)
    }
  }, [abierto, colocar, cerrar])

  const nombreTema = theme === 'daltonico' ? 'Daltonismo' : theme === 'claro' ? 'Claro' : 'Oscuro'
  const etiqueta =
    `Tema de la aplicación: ${nombreTema}` + (modoCvd !== 'normal' ? `, modo de daltonismo: ${CVD_INFO[modoCvd].etiqueta}` : '')

  const abrirModos = () => {
    setAbierto(false)
    setDialogo(true)
  }
  const cerrarModos = () => {
    setDialogo(false)
    botonRef.current?.focus()
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={botonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={abierto ? idPanel : undefined}
        aria-label={etiqueta}
        onClick={() => setAbierto((v) => !v)}
        className={`${BOTON_BASE} ${BOTON_TONO[tone]}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" className="shrink-0" {...trazo}>
          {theme === 'daltonico' ? (
            <>
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : theme === 'claro' ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </>
          ) : (
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          )}
        </svg>
        <span className="hidden sm:inline-block">Tema</span>

        {modoCvd !== 'normal' && (
          <span
            aria-hidden="true"
            title="Modo de daltonismo activo"
            className="h-2.5 w-2.5 rounded-full bg-[#0072b2] ring-2 ring-[#e69f00]"
          />
        )}
      </button>

      {abierto &&
        createPortal(
          <>
            <div className="sr-apar-fondo" aria-hidden="true" onClick={() => cerrar(false)} />
            <div
              ref={panelRef}
              id={idPanel}
              role="dialog"
              aria-labelledby={idTitulo}
              tabIndex={-1}
              className="sr-apar"
              style={{ top: pos.top, [align === 'right' ? 'right' : 'left']: pos.lado }}
            >
              <AppearancePanel idTitulo={idTitulo} onCerrar={() => cerrar()} origen={botonRef.current} onDaltonismo={abrirModos} />
            </div>
          </>,
          document.body,
        )}

      {dialogo && <DaltonismoDialog onCerrar={cerrarModos} />}
    </div>
  )
}
