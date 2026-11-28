import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/modules/core/hooks/useFocusTrap'
import './GuiaFotoDialog.css'

const PASOS = [
  { t: 'Cuerpo entero, de frente', d: 'Desde la cabeza hasta los pies, mirando directo a la cámara.', figura: 'frente' },
  { t: 'Brazos separados del torso', d: 'Ligeramente abiertos: sin cruzarlos ni meter las manos en los bolsillos.', figura: 'brazos' },
  { t: 'Fondo despejado y buena luz', d: 'Luz frontal pareja y un fondo limpio para que la IA reconozca tu silueta.', figura: 'luz' },
  { t: 'Foto vertical', d: 'JPG o PNG en proporción 3:4, mínimo 300 × 400 px y máximo 5 MB.', figura: 'formato' },
] as const

function Figura({ tipo }: { tipo: (typeof PASOS)[number]['figura'] }) {
  return (
    <svg viewBox="0 0 80 100" className="sr-guia__fig" aria-hidden="true">
      {tipo === 'luz' && <circle cx="66" cy="14" r="9" className="sr-guia__sol" />}
      {tipo === 'formato' && <rect x="14" y="4" width="52" height="92" rx="6" className="sr-guia__marco" />}
      <circle cx="40" cy="20" r="8" />
      <path d={tipo === 'brazos' ? 'M26 36c0-4 6-7 14-7s14 3 14 7l9 24h-5L48 44l-1 50H33l-1-50-9 16h-5l9-24Z' : 'M28 36c0-4 5-7 12-7s12 3 12 7l2 28h-5l-3-20-1 50H33l-1-50-3 20h-5l2-28Z'} />
    </svg>
  )
}

/**
 * Casilla con un bombillo: abre un pop-up con lo que hay que hacer para tomar una buena foto.
 * Reemplaza al bloque largo de reglas que antes ocupaba la tarjeta de la foto.
 */
export function GuiaFotoButton({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const titulo = useId()
  useFocusTrap(caja, abierto, true)

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto])

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        className={`sr-guia__btn ${className}`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.6 1.2 1.4 1.2 2.1h4.6c0-.7.5-1.5 1.2-2.1A6 6 0 0 0 12 3Z" />
        </svg>
        <span>¿Cómo tomar la foto?</span>
      </button>

      {abierto &&
        createPortal(
          <div className="sr-guia__fondo" onClick={() => setAbierto(false)}>
            <div
              ref={caja}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titulo}
              className="sr-guia sr-glass-card"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="sr-guia__cab">
                <div>
                  <p className="sr-guia__eyebrow">Probador con IA</p>
                  <h2 id={titulo}>Cómo tomar tu foto</h2>
                </div>
                <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="sr-guia__x">✕</button>
              </header>
              <ol className="sr-guia__pasos">
                {PASOS.map((p, i) => (
                  <li key={p.t}>
                    <Figura tipo={p.figura} />
                    <div>
                      <h3><span>{i + 1}</span>{p.t}</h3>
                      <p>{p.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="sr-guia__nota">Tu foto es privada: solo se usa para esta prueba y puedes borrarla cuando quieras.</p>
              <button type="button" onClick={() => setAbierto(false)} className="sr-guia__listo">Entendido</button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
