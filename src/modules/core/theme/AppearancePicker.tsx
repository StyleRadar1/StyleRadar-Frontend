import { useState, useRef, useEffect, useId, type KeyboardEvent } from 'react'
import { useTheme, type ThemeMode } from './ThemeContext'

interface AppearancePickerProps {
  className?: string
  align?: 'left' | 'right'
}

export function AppearancePicker({ className = '', align = 'right' }: AppearancePickerProps) {
  const { mode, setMode, colorblind, toggleColorblind, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Accesibilidad de teclado: Escape y flechas
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      buttonRef.current?.focus()
      return
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!menuRef.current) return
      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'button[role="menuitemradio"], button[role="switch"]',
        ),
      )
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)
      let nextIndex = 0
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex + 1 < focusable.length ? currentIndex + 1 : 0
      } else {
        nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : focusable.length - 1
      }
      focusable[nextIndex]?.focus()
    }
  }

  const selectMode = (newMode: ThemeMode) => {
    setMode(newMode)
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={`Apariencia y accesibilidad. Tema: ${mode === 'system' ? 'Automático' : resolvedTheme === 'light' ? 'Claro' : 'Oscuro'}${colorblind ? ', modo daltónico activo' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex h-9 items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-2.5 text-xs font-semibold text-white/90 shadow-sm transition hover:border-white/35 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violeta-claro"
      >
        {resolvedTheme === 'light' ? (
          /* Icono Sol */
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-amber-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          /* Icono Luna */
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-lavanda"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}

        <span className="hidden sm:inline-block">
          {mode === 'system' ? 'Auto' : resolvedTheme === 'light' ? 'Claro' : 'Oscuro'}
        </span>

        {/* Indicador de daltónico */}
        {colorblind && (
          <span
            title="Paleta para daltonismo activa"
            className="flex h-2 w-2 items-center justify-center rounded-full bg-[#0072b2] ring-1 ring-[#e69f00]"
          >
            <span className="sr-only">Modo daltónico activo</span>
          </span>
        )}

        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 shrink-0 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Preferencias de apariencia y accesibilidad"
          onKeyDown={handleKeyDown}
          className={`absolute top-full z-50 mt-2 w-56 rounded-2xl border border-white/15 bg-grafito/95 p-2 shadow-2xl backdrop-blur-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="px-2 py-1.5 text-[0.625rem] font-bold uppercase tracking-[.14em] text-white/50">
            Modo de color
          </div>

          <div role="radiogroup" aria-label="Modo de color" className="space-y-1">
            {/* Opción Claro */}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={mode === 'light'}
              onClick={() => selectMode('light')}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                mode === 'light'
                  ? 'bg-arena text-grafito shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
                Claro
              </span>
              {mode === 'light' && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-grafito"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Opción Oscuro */}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={mode === 'dark'}
              onClick={() => selectMode('dark')}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                mode === 'dark'
                  ? 'bg-violeta text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
                Oscuro
              </span>
              {mode === 'dark' && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Opción Automático (Sistema) */}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={mode === 'system'}
              onClick={() => selectMode('system')}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                mode === 'system'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Automático
              </span>
              {mode === 'system' && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </div>

          <div className="my-2 border-t border-white/10" />

          {/* Sección Accesibilidad / Daltonismo */}
          <div className="px-1 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={colorblind}
              onClick={toggleColorblind}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-xs font-medium text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violeta-claro"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-white">Modo daltónico</span>
                <span className="text-[0.6563rem] text-white/60">Paleta Okabe-Ito (azul/naranja)</span>
              </div>
              <span
                aria-hidden="true"
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  colorblind ? 'bg-[#0072b2]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                    colorblind ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
