import { flushSync } from 'react-dom'

/**
 * Ejecuta el cambio de tema envuelto en la animación circular de View Transitions
 * (efecto de tela que se extiende en círculo desde el botón emisor).
 * Si prefers-reduced-motion está activo o el navegador no soporta
 * document.startViewTransition, aplica el cambio inmediatamente sin animación.
 */
export function executeThemeTransition(
  updateFn: () => void,
  originEl?: HTMLElement | null,
): void {
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const doc = typeof document !== 'undefined' ? (document as any) : null

  if (!doc || typeof doc.startViewTransition !== 'function' || reduce) {
    updateFn()
    return
  }

  const r = originEl?.getBoundingClientRect()
  const x = r ? r.left + r.width / 2 : typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  const y = r ? r.top + r.height / 2 : typeof window !== 'undefined' ? window.innerHeight / 2 : 0

  const end = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  try {
    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        updateFn()
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
    updateFn()
  }
}

