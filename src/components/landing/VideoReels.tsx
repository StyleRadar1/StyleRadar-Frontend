import { useState, useRef, useEffect, useCallback } from 'react'
import { videoFilms } from '@/data/landingData'
import './VideoReels.css'

function formatTime(s: number): string {
  const safe = Math.max(0, Math.floor(s))
  const mins = Math.floor(safe / 60)
  const secs = String(safe % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

export function VideoReels() {
  const [cur, setCur] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [hasRealVideo, setHasRealVideo] = useState<Record<number, boolean>>({})
  const [videoErrors, setVideoErrors] = useState<Record<number, boolean>>({})

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const swipedRef = useRef(false)

  const activeFilm = videoFilms[cur]
  const currentDuration = activeFilm?.dur || 60

  // Detener reproducción general
  const stopPlayback = useCallback(() => {
    const activeVid = videoRefs.current[cur]
    if (activeVid && !activeVid.paused) {
      activeVid.pause()
    }
    setIsPlaying(false)
  }, [cur])

  // Iniciar reproducción
  const startPlayback = useCallback(() => {
    const activeVid = videoRefs.current[cur]
    if (!activeVid) return

    setVideoErrors((prev) => ({ ...prev, [cur]: false }))
    activeVid.muted = isMuted
    const playPromise = activeVid.play()
    if (playPromise) {
      playPromise
        .then(() => {
          setIsPlaying(true)
          setHasRealVideo((prev) => ({ ...prev, [cur]: true }))
        })
        .catch(() => {
          setHasRealVideo((prev) => ({ ...prev, [cur]: false }))
          setVideoErrors((prev) => ({ ...prev, [cur]: true }))
          setIsPlaying(false)
        })
    } else {
      setIsPlaying(true)
    }
  }, [cur, isMuted])

  // Alternar reproducción
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }, [isPlaying, startPlayback, stopPlayback])

  // Cambiar a otro video
  const go = useCallback(
    (delta: number) => {
      stopPlayback()
      setCurrentTime(0)
      const nextIndex = (cur + delta + videoFilms.length) % videoFilms.length
      setCur(nextIndex)
    },
    [cur, stopPlayback],
  )

  // Saltar a un segundo específico
  const seek = useCallback(
    (targetSeconds: number) => {
      setCurrentTime(targetSeconds)
      const activeVid = videoRefs.current[cur]
      if (activeVid && hasRealVideo[cur]) {
        activeVid.currentTime = targetSeconds
      }
      if (!isPlaying) {
        startPlayback()
      }
    },
    [cur, hasRealVideo, isPlaying, startPlayback],
  )

  // Alternar audio
  const toggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    const activeVid = videoRefs.current[cur]
    if (activeVid) {
      activeVid.muted = nextMuted
    }
  }

  // Desplazar con click en la barra de progreso
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(clickRatio * currentDuration)
  }

  // Atajos de teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    } else if (e.key === ' ' || e.key === 'k') {
      e.preventDefault()
      togglePlay()
    } else if (e.key === 'Home') {
      e.preventDefault()
      go(-cur)
    } else if (e.key === 'End') {
      e.preventDefault()
      go(videoFilms.length - 1 - cur)
    }
  }

  // Gestos táctiles / arrastre
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return
    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y
    pointerStartRef.current = null

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      swipedRef.current = true
      go(dx < 0 ? 1 : -1)
      setTimeout(() => {
        swipedRef.current = false
      }, 100)
    }
  }

  // Pausar si sale del viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlaying) {
            stopPlayback()
          }
        })
      },
      { threshold: 0.15 },
    )

    if (rootRef.current) {
      observer.observe(rootRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [isPlaying, stopPlayback])

  // Calcular paso activo
  let activeStepIndex = 0
  activeFilm.steps.forEach((step, index) => {
    if (currentTime >= step.t) {
      activeStepIndex = index
    }
  })

  const progressRatio = Math.min(1, Math.max(0, currentTime / (currentDuration || 1)))
  const posterZoom = (1 + progressRatio * 0.08).toFixed(3)

  return (
    <section
      className="pe-sec pe-videos pe-anchor"
      id="pe-videos"
      data-seccion="videos"
      aria-labelledby="peVidTitle"
    >
      <div className="pe-in">
        <p className="pe-kicker">Videos · míralo en un minuto</p>
        <h2 className="pe-h2" id="peVidTitle">
          Así se usa StyleRadar.
        </h2>

        <div
          ref={rootRef}
          className={`vc ${isPlaying ? 'is-playing' : ''}`}
          id="vidCarousel"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Videos de StyleRadar"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* Escenario 3D interactivo */}
          <div
            ref={stageRef}
            className="vc-stage"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              pointerStartRef.current = null
            }}
          >
            <div className="vc-track">
              {videoFilms.map((v, i) => {
                const n = videoFilms.length
                let d = i - cur
                if (d > n / 2) d -= n
                if (d < -n / 2) d += n
                const pos = d === 0 ? 'center' : d < 0 ? 'left' : 'right'
                const absD = Math.abs(d)
                const zIndex = 10 - absD
                const isCurrentSlide = d === 0
                const hasFile = hasRealVideo[i]

                return (
                  <figure
                    key={v.id}
                    className={`vc-slide ${isCurrentSlide && isPlaying ? 'is-playing' : ''} ${
                      hasFile ? 'has-video' : ''
                    }`}
                    data-pos={pos}
                    style={
                      {
                        '--d': absD,
                        zIndex,
                      } as React.CSSProperties
                    }
                    role="group"
                    aria-roledescription="video"
                    aria-label={`${i + 1} de ${videoFilms.length}: ${v.title}`}
                    aria-hidden={!isCurrentSlide}
                    onClick={() => {
                      if (swipedRef.current) return
                      if (!isCurrentSlide) {
                        go(d)
                      }
                    }}
                  >
                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el
                      }}
                      className="vc-video"
                      muted={isMuted}
                      playsInline
                      preload="none"
                      poster={v.poster}
                      src={v.src}
                      onPlaying={() => {
                        setHasRealVideo((prev) => ({ ...prev, [i]: true }))
                      }}
                      onTimeUpdate={(e) => {
                        if (i === cur && hasRealVideo[i]) {
                          setCurrentTime(e.currentTarget.currentTime)
                        }
                      }}
                      onEnded={() => {
                        if (i === cur) {
                          setIsPlaying(false)
                        }
                      }}
                      onError={() => {
                        setHasRealVideo((prev) => ({ ...prev, [i]: false }))
                        if (i === cur) {
                          setVideoErrors((prev) => ({ ...prev, [i]: true }))
                          setIsPlaying(false)
                        }
                      }}
                    />

                    <img
                      className="vc-poster"
                      src={v.poster}
                      alt=""
                      loading="lazy"
                      style={
                        {
                          '--zoom': isCurrentSlide ? posterZoom : '1',
                        } as React.CSSProperties
                      }
                    />

                    <figcaption className="vc-cap">
                      <span className="vc-tag">{v.tag}</span>
                      <b>{v.title}</b>
                      <em>{formatTime(v.dur)}</em>
                    </figcaption>

                    <button
                      type="button"
                      className="vc-big"
                      tabIndex={isCurrentSlide ? 0 : -1}
                      aria-label={
                        isCurrentSlide && isPlaying
                          ? `Pausar: ${v.title}`
                          : `Reproducir: ${v.title}`
                      }
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isCurrentSlide) {
                          togglePlay()
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </figure>
                )
              })}
            </div>

            {/* Flechas de navegación del carrusel */}
            <button
              type="button"
              className="vc-arrow vc-prev"
              aria-label="Video anterior"
              onClick={() => go(-1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 5-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="vc-arrow vc-next"
              aria-label="Video siguiente"
              onClick={() => go(1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Panel lateral: controles, pasos sincronizados y tabs */}
          <aside className="vc-side">
            <p className="vc-now">
              <span className="vc-count">
                {String(cur + 1).padStart(2, '0')} / {String(videoFilms.length).padStart(2, '0')}
              </span>
              <b className="vc-title">{activeFilm.title}</b>
            </p>

            <div className="vc-bar">
              <button
                type="button"
                className="vc-play"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div
                className="vc-prog"
                aria-hidden="true"
                onClick={handleProgressClick}
                title="Avanzar video"
              >
                <i
                  style={{
                    transform: `scaleX(${progressRatio.toFixed(4)})`,
                  }}
                />
              </div>

              <span className="vc-time">
                {formatTime(currentTime)} / {formatTime(currentDuration)}
              </span>

              <button
                type="button"
                className="vc-mute"
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                aria-pressed={!isMuted}
                onClick={toggleMute}
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 9h4l5-4v14l-5-4H4z" />
                    <path d="m17 9 4 6M21 9l-4 6" fill="none" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 9h4l5-4v14l-5-4H4z" />
                    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" />
                  </svg>
                )}
              </button>
            </div>

            {videoErrors[cur] && (
              <p className="vc-note" role="alert">
                No se pudo cargar este video.{' '}
                <button
                  type="button"
                  onClick={() => {
                    const video = videoRefs.current[cur]
                    if (!video) return
                    video.load()
                    startPlayback()
                  }}
                >
                  Reintentar
                </button>
              </p>
            )}

            {/* Lista de pasos interactiva con marcas de tiempo */}
            <ol className="vc-steps">
              {activeFilm.steps.map((s, k) => {
                const isStepActive = k === activeStepIndex && (isPlaying || currentTime > 0)
                const isStepDone = k < activeStepIndex

                return (
                  <li
                    key={k}
                    className={`${isStepActive ? 'is-on' : ''} ${isStepDone ? 'is-done' : ''}`}
                  >
                    <button
                      type="button"
                      data-step={k}
                      onClick={() => seek(s.t)}
                      aria-label={`Ir al paso ${k + 1}: ${s.label} en ${formatTime(s.t)}`}
                    >
                      <span className="vc-sn">{k + 1}</span>
                      <span className="vc-sl">{s.label}</span>
                      <time>{formatTime(s.t)}</time>
                    </button>
                  </li>
                )
              })}
            </ol>

            {/* Indicadores de pestañas inferiores */}
            <div className="vc-dots" role="tablist" aria-label="Elegir video">
              {videoFilms.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  data-go={i}
                  aria-selected={i === cur}
                  aria-label={v.tag}
                  onClick={() => go(i - cur)}
                />
              ))}
            </div>
          </aside>

          {/* Anuncio accesible de cambios de video */}
          <p className="vc-live" aria-live="polite">
            Video {cur + 1} de {videoFilms.length}: {activeFilm.title}
          </p>
        </div>
      </div>
    </section>
  )
}
