import { useRef } from 'react'
import { flushSync } from 'react-dom'
import { useTema } from './useTema'
import type { Tema } from './tema'
import './ThemeButton.css'

interface ThemeButtonProps {
  className?: string
  id?: string
}

const MODES = [
  { id: 'claro' as const, txt: 'Modo claro' },
  { id: 'oscuro' as const, txt: 'Modo oscuro' },
  { id: 'daltonico' as const, txt: 'Modo daltónico' },
] as const

export function ThemeButton({ className = '', id = 'btn' }: ThemeButtonProps) {
  const { tema, setTema } = useTema()
  const btnRef = useRef<HTMLButtonElement>(null)

  const idx = Math.max(
    0,
    MODES.findIndex((m) => m.id === tema),
  )
  const currentMode = MODES[idx]

  const handleClick = () => {
    const nextIdx = (idx + 1) % MODES.length
    const nextMode = MODES[nextIdx]

    // Efecto de balanceo (swing)
    const btn = btnRef.current
    if (btn) {
      btn.classList.remove('swing')
      void btn.offsetWidth
      btn.classList.add('swing')
    }

    const r = btn?.getBoundingClientRect()
    const x = r ? r.left + r.width / 2 : typeof window !== 'undefined' ? window.innerWidth / 2 : 0
    const y = r ? r.top + r.height / 2 : typeof window !== 'undefined' ? window.innerHeight / 2 : 0

    const apply = () => {
      setTema(nextMode.id as Tema)
    }

    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const doc = typeof document !== 'undefined' ? (document as any) : null

    // Fallback sin animación si no está soportado View Transitions o si reduce motion está activo
    if (!doc || typeof doc.startViewTransition !== 'function' || reduce) {
      apply()
      return
    }

    const end = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    try {
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          apply()
        })
      })

      transition.ready
        ?.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${end}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 750,
              easing: 'cubic-bezier(.65, 0, .25, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          )
        })
        .catch(() => {})
    } catch {
      apply()
    }
  }

  return (
    <button
      ref={btnRef}
      id={id}
      type="button"
      className={`theme-btn ${className}`.trim()}
      aria-live="polite"
      onClick={handleClick}
    >
      <span className="hanger" aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <path
            d="M20 4c3 0 5 2 5 4.5S22 11 20 13v3"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            className="mini-shirt"
            strokeWidth="1.5"
            strokeLinejoin="round"
            d="M12 17l8-3 8 3 5 6-4 3-2-2v13H13V24l-2 2-4-3z"
          />
        </svg>
      </span>
      <span id="label">{currentMode.txt}</span>
      <span className="dots" aria-hidden="true">
        {MODES.map((_, i) => (
          <i key={i} className={i === idx ? 'on' : ''} />
        ))}
      </span>
    </button>
  )
}

