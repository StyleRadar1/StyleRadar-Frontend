import { useEffect, useRef } from 'react'
import type { StoreGalleryItem } from '../services/storePublicService'

export interface StorePhotoLightboxProps {
  open: boolean
  photos: StoreGalleryItem[]
  index: number
  storeName: string
  onClose: () => void
  onIndexChange: (nextIndex: number) => void
}

export function StorePhotoLightbox({
  open,
  photos,
  index,
  storeName,
  onClose,
  onIndexChange,
}: StorePhotoLightboxProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const touchStartX = useRef<number | null>(null)

  const total = photos.length
  const safeIndex = total > 0 ? ((index % total) + total) % total : 0
  const current = photos[safeIndex]

  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement as HTMLElement | null
    closeBtnRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight' && total > 1) {
        e.preventDefault()
        onIndexChange((safeIndex + 1) % total)
      } else if (e.key === 'ArrowLeft' && total > 1) {
        e.preventDefault()
        onIndexChange((safeIndex - 1 + total) % total)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus?.()
    }
  }, [open, safeIndex, total, onClose, onIndexChange])

  if (!open || !current) return null

  const goPrev = () => onIndexChange((safeIndex - 1 + total) % total)
  const goNext = () => onIndexChange((safeIndex + 1) % total)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || total <= 1) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null
    if (delta >= 40) goPrev()
    else if (delta <= -40) goNext()
  }

  const tagLabel = current.tag || (safeIndex === 0 ? 'Portada' : `Foto ${safeIndex + 1}`)

  return (
    <div
      className="sr-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${storeName}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sr-lightbox__bar">
        <span className="sr-lightbox__counter">
          Foto {safeIndex + 1} de {total} · {tagLabel}
        </span>
        <button
          ref={closeBtnRef}
          type="button"
          className="sr-lightbox__close"
          onClick={onClose}
          aria-label="Cerrar galería"
        >
          ×
        </button>
      </div>

      <div className="sr-lightbox__stage">
        {total > 1 && (
          <button
            type="button"
            className="sr-lightbox__nav sr-lightbox__nav--prev"
            onClick={goPrev}
            aria-label="Foto anterior"
          >
            ‹
          </button>
        )}

        <img
          src={current.url}
          alt={`${tagLabel} de ${storeName}`}
          className="sr-lightbox__img"
        />

        {total > 1 && (
          <button
            type="button"
            className="sr-lightbox__nav sr-lightbox__nav--next"
            onClick={goNext}
            aria-label="Foto siguiente"
          >
            ›
          </button>
        )}
      </div>

      <div className="sr-lightbox__footer">
        <span>{storeName}</span>
        <span>{safeIndex + 1} / {total}</span>
      </div>
    </div>
  )
}
