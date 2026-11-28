import './EscenarioIA.css'

export interface PruebaReciente {
  id: string
  url: string
  nombre: string
}

interface Props {
  /** Foto frontal ya subida (si la hay) */
  fotoUrl?: string | null
  garment?: { nombre: string; imagen: string; tienda: string } | null
  talla?: string | null
  /** Hay una prueba generándose */
  procesando: boolean
  progreso?: number | null
  recientes: PruebaReciente[]
  onAbrirReciente: (id: string) => void
}

const CONSEJOS = [
  { t: 'Cuerpo entero', d: 'De la cabeza a los pies y de frente.' },
  { t: 'Buena luz', d: 'Luz pareja y sin sombras fuertes.' },
  { t: 'Fondo despejado', d: 'Así la IA reconoce bien tu silueta.' },
]

/**
 * Escenario de la prueba con IA: antes de generar muestra el «antes y después» como un lienzo de dos marcos
 * (tu foto + tu prenda) para que la columna nunca quede vacía y se entienda qué falta, con tus pruebas
 * recientes a mano. Es el patrón de los probadores virtuales: foto original, prenda de referencia y resultado
 * enlazados en la misma vista.
 */
export function EscenarioIA({ fotoUrl, garment, talla, procesando, progreso, recientes, onAbrirReciente }: Props) {
  const pasoFoto = fotoUrl ? 'listo' : 'actual'
  const pasoPrenda = garment ? 'listo' : fotoUrl ? 'actual' : 'pendiente'
  const pasoProbar = fotoUrl && garment ? 'actual' : 'pendiente'

  return (
    <div className="sr-esc">
      <ol className="sr-esc__pasos" aria-label="Avance de la prueba">
        {[
          ['Foto', pasoFoto],
          ['Prenda', pasoPrenda],
          ['Probar', procesando ? 'listo' : pasoProbar],
        ].map(([nombre, estado], i) => (
          <li key={nombre} className="sr-esc__paso" data-estado={estado}>
            <span className="sr-esc__num" aria-hidden="true">{estado === 'listo' ? '✓' : i + 1}</span>
            {nombre}
          </li>
        ))}
      </ol>

      <div className="sr-esc__lienzo">
        <figure className="sr-esc__marco">
          <figcaption>Tu foto</figcaption>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Tu foto frontal" draggable={false} onContextMenu={(e) => e.preventDefault()} />
          ) : (
            <div className="sr-esc__vacio">
              <svg viewBox="0 0 120 220" className="sr-esc__silueta" aria-hidden="true">
                <circle cx="60" cy="26" r="16" />
                <path d="M34 62c0-8 8-14 26-14s26 6 26 14l6 56h-14l-4 92H46l-4-92H28l6-56Z" />
              </svg>
              <p>Sube tu foto frontal para empezar</p>
            </div>
          )}
        </figure>

        <div className="sr-esc__medio" aria-hidden="true">
          <span>{procesando ? '…' : '+'}</span>
        </div>

        <figure className="sr-esc__marco sr-esc__marco--resultado" data-procesando={procesando}>
          <figcaption>{garment ? `Con ${garment.nombre}` : 'Con tu prenda'}</figcaption>
          {garment ? (
            <>
              <img src={garment.imagen} alt={`Prenda elegida: ${garment.nombre}`} className="sr-esc__prenda" />
              <div className="sr-esc__velo">
                {procesando ? (
                  <>
                    <span className="sr-esc__pulso" aria-hidden="true" />
                    <p>Vistiendo tu foto con IA…</p>
                    {progreso ? <p className="sr-esc__pct">{progreso}%</p> : null}
                  </>
                ) : (
                  <>
                    <p className="sr-esc__velo-t">{garment.nombre}</p>
                    <p>{garment.tienda}{talla ? ` · Talla ${talla}` : ''}</p>
                    <p className="sr-esc__velo-s">{fotoUrl ? 'Listo para probar' : 'Falta tu foto'}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="sr-esc__vacio">
              <svg viewBox="0 0 64 64" className="sr-esc__percha" aria-hidden="true">
                <path d="M32 14a5 5 0 1 0-5-5" />
                <path d="M32 14v6L6 40a4 4 0 0 0 2.4 7.2h47.2A4 4 0 0 0 58 40L32 20" />
              </svg>
              <p>Elige una prenda para ver cómo te queda</p>
            </div>
          )}
        </figure>
      </div>

      {!fotoUrl && (
        <ul className="sr-esc__consejos" aria-label="Consejos para una buena foto">
          {CONSEJOS.map((c) => (
            <li key={c.t}>
              <strong>{c.t}</strong>
              <span>{c.d}</span>
            </li>
          ))}
        </ul>
      )}

      {recientes.length > 0 && (
        <div className="sr-esc__recientes">
          <h3>Tus pruebas recientes</h3>
          <ul>
            {recientes.map((r, i) => (
              <li key={r.id}>
                <button type="button" onClick={() => onAbrirReciente(r.id)} aria-label={`Reabrir prueba anterior ${i + 1}`}>
                  <img src={r.url} alt="" loading="lazy" />
                  <span>{r.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
