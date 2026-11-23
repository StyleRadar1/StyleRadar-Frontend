import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { env } from '@/configs/env'
import { formatCOP } from '@/modules/core/utils/format'
import type { TryOnJobStatusDto } from '../types/tryon.dto'

const isExpired = (r: TryOnJobStatusDto) =>
  Boolean(r.expiresAt && new Date(r.expiresAt).getTime() <= Date.now())

/**
 * RF-26: muestra el resultado desde la URL temporal (SAS) mientras no venza.
 * El backend real no envía `expiresAt`; en ese caso calculamos ~15 min orientativos
 * desde `completedAt` y usamos `onError` del `<img>` para detectar enlaces SAS caducados.
 */
export function ResultViewer({
  result,
  garmentName,
  garmentId,
  garmentStore,
  garmentPrice,
  garmentSizes,
  originalPhotoUrl,
  onRegenerate,
  onRefreshLink,
  onOtherGarment,
  onDeletePhoto,
}: {
  result: TryOnJobStatusDto
  garmentName: string
  garmentId?: string
  garmentStore?: string
  garmentPrice?: number
  garmentSizes?: string[]
  originalPhotoUrl?: string
  onRegenerate: () => void
  onRefreshLink?: () => void | Promise<void>
  onOtherGarment: () => void
  onDeletePhoto?: () => void
}) {
  const [expired, setExpired] = useState(() => isExpired(result))
  const [broken, setBroken] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [compareBefore, setCompareBefore] = useState(false)

  useEffect(() => {
    setExpired(isExpired(result))
    setBroken(false)
  }, [result.jobId, result.resultImageUrl, result.resultUrl, result.expiresAt])

  useEffect(() => {
    if (expired || !result.expiresAt) return
    const ms = new Date(result.expiresAt).getTime() - Date.now()
    const t = setTimeout(() => setExpired(true), Math.max(0, ms))
    return () => clearTimeout(t)
  }, [expired, result.expiresAt])

  const untilDate = result.expiresAt
    ? new Date(result.expiresAt)
    : result.completedAt
      ? new Date(new Date(result.completedAt).getTime() + 15 * 60 * 1000)
      : null
  const until = untilDate ? untilDate.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : ''

  const handleRefresh = async () => {
    if (!onRefreshLink) return
    setRefreshing(true)
    try {
      await onRefreshLink()
      setBroken(false)
      setExpired(false)
    } finally {
      setRefreshing(false)
    }
  }

  if (expired || broken) {
    return (
      <div role="alert" className="rounded-2xl border border-[var(--color-warning-border,#d97706)] bg-[var(--color-warning-bg,rgba(217,119,6,0.1))] text-[var(--color-warning-text,#92400e)] p-5">
        <p className="font-semibold">El resultado ya no está disponible</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Por privacidad, el enlace del resultado vence a los 15 minutos. Puedes renovar el enlace sin gastar cuota o generar una prueba nueva.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onRefreshLink && (
            <button type="button" disabled={refreshing} onClick={handleRefresh} className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-4 py-2 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all shadow-sm disabled:opacity-60">
              {refreshing ? 'Actualizando…' : 'Actualizar enlace'}
            </button>
          )}
          <button type="button" onClick={onRegenerate} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all">Generar de nuevo</button>
          <button type="button" onClick={onOtherGarment} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all">Probar otra prenda</button>
        </div>
      </div>
    )
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="relative bg-[var(--color-surface-subtle)]">
        {compareBefore && originalPhotoUrl ? (
          <div className="grid grid-cols-2 gap-1">
            <div className="relative">
              <img src={originalPhotoUrl} alt="Tu foto original" className="mx-auto max-h-[520px] w-full object-contain" />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white">Antes</span>
            </div>
            <div className="relative">
              <img src={result.resultImageUrl || result.resultUrl} alt={`Resultado de la prueba con ${garmentName}`} onError={() => setBroken(true)} className="mx-auto max-h-[520px] w-full object-contain" />
              <span className="absolute bottom-2 right-2 rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-[10px] font-bold text-white">Después</span>
            </div>
          </div>
        ) : (
          <img src={result.resultImageUrl || result.resultUrl} alt={`Resultado de la prueba con ${garmentName}`} onError={() => setBroken(true)} className="mx-auto max-h-[520px] w-full object-contain" />
        )}
        {env.useMocks && (
          <span className="absolute left-3 top-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-1 text-[11px] font-bold text-[var(--color-text)] backdrop-blur-sm shadow-sm">
            Simulado: no es un resultado real del probador
          </span>
        )}
        {originalPhotoUrl && (
          <button
            type="button"
            onClick={() => setCompareBefore((v) => !v)}
            aria-pressed={compareBefore}
            className="absolute right-3 top-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-1 text-[11px] font-bold text-[var(--color-text)] backdrop-blur-sm shadow-sm hover:border-[var(--color-accent)]"
          >
            {compareBefore ? 'Ver solo resultado' : 'Comparar Antes / Después'}
          </button>
        )}
      </div>

      {/* Tarjeta comercial complementaria de la prenda */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">{garmentName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {garmentStore || 'Tienda StyleRadar'}
              {garmentSizes?.length ? ` · Tallas: ${garmentSizes.join(', ')}` : ''}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
              {until ? `Disponible hasta las ${until}` : 'Enlace temporal disponible por 15 min'}
            </p>
          </div>
          {typeof garmentPrice === 'number' && (
            <p className="text-sm font-extrabold text-[var(--color-accent)]">{formatCOP(garmentPrice)}</p>
          )}
        </div>

        <figcaption className="mt-3 flex flex-wrap items-center gap-2">
          {garmentId && (
            <Link
              to={`/catalogo/${garmentId}`}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-[var(--color-accent-contrast,#ffffff)] hover:brightness-110 shadow-sm"
            >
              Ver prenda / Comprar
            </Link>
          )}
          <button type="button" onClick={onOtherGarment} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-4 py-2 text-xs font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] transition-all">
            Probar otra prenda
          </button>
          {onDeletePhoto && (
            <button type="button" onClick={onDeletePhoto} className="ml-auto text-xs font-semibold text-[var(--color-danger-text,#ff8a8a)] underline underline-offset-4 hover:brightness-110">
              Eliminar esta fotografía y resultados
            </button>
          )}
        </figcaption>
      </div>
    </figure>
  )
}
