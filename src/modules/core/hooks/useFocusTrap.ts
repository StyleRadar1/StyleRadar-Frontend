import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Atrapa el foco dentro de un contenedor modal mientras está abierto y lo devuelve al disparador al cerrar.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  autoFocusFirst = false,
) {
  useEffect(() => {
    if (!active) return
    const prev = document.activeElement as HTMLElement | null

    const getFocusables = () =>
      [...(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )

    if (autoFocusFirst) {
      getFocusables()[0]?.focus()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const els = getFocusables()
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      const inside = containerRef.current?.contains(document.activeElement)
      if (!inside) {
        e.preventDefault()
        first.focus()
        return
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (prev && prev.isConnected) prev.focus?.()
    }
  }, [containerRef, active, autoFocusFirst])
}
