import { useRef, type KeyboardEvent } from 'react'
import '@/styles/admin-glass.css'

export interface GlassChipOption {
  value: string
  label: string
  /** Clase de color para el punto indicador opcional (nunca único indicador; acompaña al texto). */
  dotClassName?: string
}

interface GlassChipGroupProps {
  label: string
  options: GlassChipOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Grupo de chips segmentados con estilo glass y navegación por teclado (flechas, Inicio/Fin y Enter/Espacio).
 */
export function GlassChipGroup({ label, options, value, onChange, className = '' }: GlassChipGroupProps) {
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = options.length - 1
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onChange(options[index].value)
      return
    }
    if (nextIndex !== null) {
      e.preventDefault()
      onChange(options[nextIndex].value)
      btnRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
    >
      {options.map((opt, idx) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            ref={(el) => { btnRefs.current[idx] = el }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label}: ${opt.label}`}
            tabIndex={active || (!options.some((o) => o.value === value) && idx === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`glass-pill cursor-pointer px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violeta-claro ${active ? 'is-active' : ''}`}
          >
            {opt.dotClassName && (
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${opt.dotClassName}`} />
            )}
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
