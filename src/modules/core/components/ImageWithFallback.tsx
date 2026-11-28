import { useEffect, useState } from 'react'

/**
 * Imagen con placeholder textual cuando no hay URL o la URL falla.
 * Evita ocultar el problema con una foto genérica que parezca real.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  placeholderClassName,
  fallbackText = 'Imagen no encontrada',
}: {
  src?: string | null
  alt: string
  className?: string
  placeholderClassName?: string
  fallbackText?: string
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={fallbackText}
        className={placeholderClassName ?? className}
      >
        <span>{fallbackText}</span>
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}
