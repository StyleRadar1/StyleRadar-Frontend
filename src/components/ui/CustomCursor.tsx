import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [isBig, setIsBig] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Si la pantalla no tiene soporte para hover (ej. móviles), no activamos el cursor
    if (window.matchMedia('(hover: none)').matches) return

    let mouseX = 0
    let mouseY = 0
    let currentX = 0
    let currentY = 0
    let rafId: number

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!isVisible) setIsVisible(true)

      const target = e.target as HTMLElement | null
      if (target) {
        const interactive = target.closest('a, button, [data-cursor], [role="button"]')
        if (interactive) {
          setIsBig(true)
          const customLabel = interactive.getAttribute('data-cursor') || ''
          setLabel(customLabel)
        } else {
          setIsBig(false)
          setLabel('')
        }
      }
    }

    const onMouseLeave = () => {
      setIsVisible(false)
    }

    const loop = () => {
      currentX += (mouseX - currentX) * 0.25
      currentY += (mouseY - currentY) * 0.25

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      }
      rafId = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    rafId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(rafId)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      ref={cursorRef}
      className={`cursor ${isBig ? 'big' : ''}`}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        pointerEvents: 'none',
        mixBlendMode: 'difference',
      }}
    >
      <b>{label}</b>
    </div>
  )
}

