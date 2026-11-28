import { useRef, useState } from 'react'
import type { StoreGalleryItem } from '../services/storePublicService'

export interface StoreGalleryShowcaseProps {
  photos: StoreGalleryItem[]
  storeName: string
  onOpenLightbox: (index: number) => void
}

export function StoreGalleryShowcase({
  photos,
  storeName,
  onOpenLightbox,
}: StoreGalleryShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const total = photos.length
  if (total === 0) return null

  const safeIndex = Math.min(activeIndex, total - 1)
  const activePhoto = photos[safeIndex]
  const tagLabel = activePhoto.tag || (safeIndex === 0 ? 'Portada' : `Foto ${safeIndex + 1}`)

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total)
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total)

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

  return (
    <div
      className="sr-gallery-showcase"
      role="region"
      aria-label={`Galería fotográfica de ${storeName}`}
    >
      <div
        className="sr-gallery-showcase__stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="sr-gallery-showcase__trigger"
          onClick={() => onOpenLightbox(safeIndex)}
          aria-label={`Ampliar ${tagLabel} de ${storeName}`}
        >
          <img
            src={activePhoto.url}
            alt={`${tagLabel} de ${storeName}`}
            className="sr-gallery-showcase__img"
            loading="lazy"
          />
          <span className="sr-gallery-showcase__shade" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="sr-gallery-showcase__arrow sr-gallery-showcase__arrow--prev"
          onClick={goPrev}
          aria-label="Foto anterior"
        >
          ‹
        </button>
        <button
          type="button"
          className="sr-gallery-showcase__arrow sr-gallery-showcase__arrow--next"
          onClick={goNext}
          aria-label="Foto siguiente"
        >
          ›
        </button>

        <div className="sr-gallery-showcase__meta">
          <span className="sr-gallery-showcase__tag">{tagLabel}</span>
          <span className="sr-gallery-showcase__counter" aria-live="polite">
            {safeIndex + 1} / {total}
          </span>
        </div>
      </div>

      <div className="sr-gallery-showcase__thumbs" role="list" aria-label="Miniaturas de la galería">
        {photos.map((photo, idx) => {
          const isCurrent = idx === safeIndex
          const label = photo.tag || (idx === 0 ? 'Portada' : `Foto ${idx + 1}`)
          return (
            <button
              key={photo.id || idx}
              type="button"
              role="listitem"
              aria-current={isCurrent ? 'true' : undefined}
              aria-label={`Ver ${label} (${idx + 1} de ${total})`}
              onClick={() => setActiveIndex(idx)}
              className={`sr-gallery-showcase__thumb ${isCurrent ? 'is-active' : ''}`}
            >
              <img src={photo.url} alt="" loading="lazy" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
