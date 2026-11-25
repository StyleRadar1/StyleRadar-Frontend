import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  active?: boolean
}

/**
 * Capa de privacidad disuasoria para el probador virtual y fotos con IA:
 * - Difumina y oculta la vista al perder el foco o cambiar de pestaña (ej. herramienta de recortes).
 * - Bloquea menú contextual, arrastre, selección de texto, atajos Ctrl+S/Ctrl+P e impresión.
 */
export function TryOnPrivacyShield({ children, className = '', active = true }: Props) {
  const [shielded, setShielded] = useState(false)

  useEffect(() => {
    if (!active) {
      setShielded(false)
      return
    }

    let timer: number | undefined

    const triggerTemporaryShield = (ms = 2200) => {
      setShielded(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!document.hidden && document.hasFocus()) {
          setShielded(false)
        }
      }, ms)
    }

    const onBlur = () => setShielded(true)
    const onFocus = () => {
      if (!document.hidden) setShielded(false)
    }
    const onVisibility = () => {
      if (document.hidden) setShielded(true)
      else if (document.hasFocus()) setShielded(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        triggerTemporaryShield()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 's')) {
        e.preventDefault()
        triggerTemporaryShield()
        return
      }
      if (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(k)) {
        triggerTemporaryShield()
      }
    }

    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyDown)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyDown)
    }
  }, [active])

  return (
    <div
      className={`sr-tryon-shield-root relative select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <style>{`
        @media print {
          .sr-tryon-shield-root { display: none !important; }
        }
      `}</style>

      <div className={shielded ? 'blur-2xl opacity-15 pointer-events-none transition duration-150' : 'transition duration-150'}>
        {children}
      </div>

      {shielded && (
        <div
          role="status"
          onClick={() => setShielded(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6 text-center backdrop-blur-xl"
        >
          <div className="max-w-md rounded-3xl border border-white/15 bg-[#181520] p-6 text-white shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-violeta-claro">
              Privacidad StyleRadar
            </p>
            <h2 className="mt-2 text-lg font-extrabold">Vista protegida</h2>
            <p className="mt-2 text-xs text-white/75 leading-relaxed">
              Ocultamos temporalmente tu fotografía y los resultados generados por IA al salir de la ventana. Haz clic aquí para continuar en el probador.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
