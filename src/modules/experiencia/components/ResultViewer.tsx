import { useEffect, useState } from 'react'
import { env } from '@/configs/env'
import type { TryOnJobStatusDto } from '../types/tryon.dto'

const isExpired = (r: TryOnJobStatusDto) => !r.expiresAt || new Date(r.expiresAt).getTime() <= Date.now()

/**
 * RF-26: muestra el resultado desde la URL temporal (SAS) mientras no venza.
 * Si vence o la imagen ya no carga, no la muestra y ofrece generarla de nuevo.
 */
export function ResultViewer({ result, garmentName, onRegenerate, onOtherGarment }: {
  result: TryOnJobStatusDto; garmentName: string; onRegenerate: () => void; onOtherGarment: () => void
}) {
  const [expired, setExpired] = useState(() => isExpired(result))
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    if (expired || !result.expiresAt) return
    const ms = new Date(result.expiresAt).getTime() - Date.now()
    const t = setTimeout(() => setExpired(true), Math.max(0, ms))
    return () => clearTimeout(t)
  }, [expired, result.expiresAt])

  const until = result.expiresAt ? new Date(result.expiresAt).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : ''

  if (expired || broken) {
    return (
      <div role="alert" className="rounded-2xl border border-[var(--color-warning-border,#d97706)] bg-[var(--color-warning-bg,rgba(217,119,6,0.1))] text-[var(--color-warning-text,#92400e)] p-5">
        <p className="font-semibold">El resultado ya no está disponible</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Por privacidad, el enlace del resultado vence a los pocos minutos. Puedes generarlo otra vez con la misma foto.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onRegenerate} className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-4 py-2 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all shadow-sm">Generar de nuevo</button>
          <button type="button" onClick={onOtherGarment} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all">Probar otra prenda</button>
        </div>
      </div>
    )
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="relative bg-[var(--color-surface-subtle)]">
        <img src={result.resultUrl} alt={`Resultado de la prueba con ${garmentName}`} onError={() => setBroken(true)} className="mx-auto max-h-[520px] w-full object-contain" />
        {env.useMocks && (
          <span className="absolute left-3 top-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-1 text-[11px] font-bold text-[var(--color-text)] backdrop-blur-sm shadow-sm">
            Simulado: no es un resultado real del probador
          </span>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-[var(--color-text)]">
        <span>{garmentName} · disponible hasta las {until}</span>
        <button type="button" onClick={onOtherGarment} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2 font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all">Probar otra prenda</button>
      </figcaption>
    </figure>
  )
}
