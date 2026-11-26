import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useMapData } from '@/modules/mapa/hooks/useMapData'
import MapaBogota from '@/modules/mapa/components/MapaBogota'
import MapCard from '@/modules/mapa/components/MapCard'
import type { MapFilter, MapPinDto } from '@/modules/mapa/types/map.dto'

const FILTROS: { id: MapFilter; label: string }[] = [
  { id: 'todos', label: 'Todo' },
  { id: 'tiendas', label: 'Tiendas' },
  { id: 'fundaciones', label: 'Fundaciones' },
]

const MAX_LISTA = 6

const distanciaKm = (pin: MapPinDto) => {
  const n = Number.parseFloat((pin.d ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

export function MapaCercano() {
  const { data: pins, error, loading, reload } = useMapData()
  const [filtro, setFiltro] = useState<MapFilter>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const reducir = useReducedMotion()

  const visibles = useMemo(
    () =>
      pins.filter((p) =>
        filtro === 'todos' ? true : filtro === 'tiendas' ? p.tipo === 'tienda' : p.tipo === 'fundacion',
      ),
    [pins, filtro],
  )

  const cercanos = useMemo(
    () => [...visibles].sort((a, b) => distanciaKm(a) - distanciaKm(b)).slice(0, MAX_LISTA),
    [visibles],
  )

  const seleccionado = pins.find((p) => p.id === selectedId) ?? null

  const handleSelect = useCallback((pin: MapPinDto | null) => setSelectedId(pin?.id ?? null), [])
  const handleHover = useCallback((pin: MapPinDto | null) => setHoveredId(pin?.id ?? null), [])

  const animacion = reducir
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      }

  const hayError = Boolean(error)
  const sinDatos = hayError || pins.length === 0

  return (
    <section className="sr-inicio-bloque sr-inicio-mapa" aria-labelledby="inicio-mapa-titulo">
      <motion.div className="sr-inicio-mapa__cabecera" {...animacion}>
        <div>
          <p className="sr-inicio-kicker">Cerca de ti</p>
          <h2 id="inicio-mapa-titulo" className="sr-inicio-titulo">
            Tiendas y fundaciones <span className="sr-inicio-acento">en tu radar</span>
          </h2>
        </div>
        <div className="sr-inicio-filtros" role="group" aria-label="Filtrar lugares">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => {
                setFiltro(f.id)
                setSelectedId(null)
              }}
              className="sr-inicio-filtro"
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div className="sr-inicio-mapa__panel" {...animacion}>
        {sinDatos ? (
          <div className="sr-inicio-mapa__vacio" role={hayError ? 'alert' : 'status'}>
            <p className="sr-inicio-mapa__vacio-titulo">
              {hayError
                ? 'No pudimos cargar las tiendas y fundaciones.'
                : loading
                  ? 'Cargando el radar de Bogotá…'
                  : 'Todavía no hay tiendas o fundaciones para mostrar.'}
            </p>
            <div className="sr-inicio-mapa__vacio-acciones">
              {hayError && (
                <button type="button" onClick={reload} className="sr-inicio-boton-secundario">
                  Reintentar
                </button>
              )}
              <Link to="/mapa" className="sr-inicio-boton-secundario">
                Abrir el mapa completo →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <aside className="sr-inicio-mapa__lista" aria-label="Lugares más cercanos">
              <ul>
                {cercanos.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      aria-pressed={selectedId === pin.id}
                      onClick={() => setSelectedId(pin.id)}
                      onMouseEnter={() => setHoveredId(pin.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(pin.id)}
                      onBlur={() => setHoveredId(null)}
                      className={`sr-inicio-lugar ${pin.tipo === 'fundacion' ? 'sr-inicio-lugar--fundacion' : ''}`}
                    >
                      <span className="sr-inicio-lugar__punto" aria-hidden="true" />
                      <span className="sr-inicio-lugar__info">
                        <span className="sr-inicio-lugar__nombre">{pin.name}</span>
                        <span className="sr-inicio-lugar__meta">
                          {[pin.cat, pin.barrio].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      {pin.d && <span className="sr-inicio-lugar__distancia">{pin.d}</span>}
                    </button>
                  </li>
                ))}
              </ul>
              {cercanos.length === 0 && (
                <p className="sr-inicio-lugar__meta px-3 py-4">No hay lugares para este filtro.</p>
              )}
              <Link to="/mapa" className="sr-inicio-enlace sr-inicio-mapa__ver-todo">
                Abrir el mapa completo →
              </Link>
            </aside>

            <div className="sr-inicio-mapa__lienzo">
              <MapaBogota
                pins={visibles}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={handleSelect}
                onHover={handleHover}
                showControls={false}
                className="h-full min-h-[360px] w-full"
              />
              {seleccionado && <MapCard pin={seleccionado} onClose={() => setSelectedId(null)} />}
            </div>
          </>
        )}
      </motion.div>
    </section>
  )
}
