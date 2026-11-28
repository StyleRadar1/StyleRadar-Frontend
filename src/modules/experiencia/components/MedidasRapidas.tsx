import { useId, type CSSProperties } from 'react'
import type { BodyMeasurements, BodyType } from '@/modules/experiencia/types/bodyMeasurements.dto'
import './MedidasRapidas.css'

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
const CUERPOS: { valor: BodyType; etiqueta: string }[] = [
  { valor: 'femenino', etiqueta: 'Femenino' },
  { valor: 'masculino', etiqueta: 'Masculino' },
  { valor: 'neutro', etiqueta: 'Neutro' },
]
export const ESTATURA_MIN = 140
export const ESTATURA_MAX = 210
export const PESO_MIN = 35
export const PESO_MAX = 140

interface Props {
  medidas: BodyMeasurements
  onCambio: (cambios: Partial<BodyMeasurements>) => void
  /** true si lo que se ve ya no coincide con lo guardado */
  hayCambios: boolean
  onGuardar: () => void
  onMasMedidas: () => void
}

const relleno = (v: number, min: number, max: number) =>
  ({ '--sr-pct': `${((v - min) / (max - min)) * 100}%` }) as CSSProperties

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)))

/**
 * Medidas siempre a la vista del probador: estatura, peso, talla y tipo de cuerpo se ajustan al instante
 * y el maniquí cambia mientras se mueven. Las medidas finas (pecho, cintura…) siguen en el asistente.
 */
export function MedidasRapidas({ medidas, onCambio, hayCambios, onGuardar, onMasMedidas }: Props) {
  const id = useId()
  const peso = medidas.peso ?? 65
  return (
    <section className="sr-medidas" aria-labelledby={`${id}-t`}>
      <div className="sr-medidas__cab">
        <h3 id={`${id}-t`}>Tus medidas</h3>
        <button type="button" className="sr-medidas__enlace" onClick={onMasMedidas}>Más medidas</button>
      </div>

      <div className="sr-medidas__fila">
        <label htmlFor={`${id}-est`}>Estatura</label>
        <output htmlFor={`${id}-est`}>{(medidas.estatura / 100).toFixed(2).replace('.', ',')} m</output>
      </div>
      <input
        id={`${id}-est`}
        type="range"
        min={ESTATURA_MIN}
        max={ESTATURA_MAX}
        value={medidas.estatura}
        style={relleno(medidas.estatura, ESTATURA_MIN, ESTATURA_MAX)}
        className="sr-medidas__rango"
        onChange={(e) => onCambio({ estatura: limitar(Number(e.target.value), ESTATURA_MIN, ESTATURA_MAX) })}
        aria-valuetext={`${medidas.estatura} centímetros`}
      />
      <div className="sr-medidas__escala" aria-hidden="true"><span>1,40 m</span><span>2,10 m</span></div>

      <div className="sr-medidas__fila">
        <label htmlFor={`${id}-peso`}>Peso</label>
        <output htmlFor={`${id}-peso`}>{peso} kg</output>
      </div>
      <input
        id={`${id}-peso`}
        type="range"
        min={PESO_MIN}
        max={PESO_MAX}
        value={peso}
        style={relleno(peso, PESO_MIN, PESO_MAX)}
        className="sr-medidas__rango"
        onChange={(e) => onCambio({ peso: limitar(Number(e.target.value), PESO_MIN, PESO_MAX) })}
        aria-valuetext={`${peso} kilogramos`}
      />
      <div className="sr-medidas__escala" aria-hidden="true"><span>35 kg</span><span>140 kg</span></div>

      <fieldset className="sr-medidas__grupo">
        <legend>Talla</legend>
        <div className="sr-medidas__fichas">
          {TALLAS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={medidas.tallaHabitual === t}
              className="sr-medidas__ficha"
              onClick={() => onCambio({ tallaHabitual: t })}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="sr-medidas__grupo">
        <legend>Tipo de cuerpo</legend>
        <div className="sr-medidas__fichas">
          {CUERPOS.map((c) => (
            <button
              key={c.valor}
              type="button"
              aria-pressed={medidas.cuerpoBase === c.valor}
              className="sr-medidas__ficha"
              onClick={() => onCambio({ cuerpoBase: c.valor })}
            >
              {c.etiqueta}
            </button>
          ))}
        </div>
      </fieldset>

      {hayCambios && (
        <button type="button" className="sr-medidas__guardar" onClick={onGuardar}>
          Guardar estas medidas
        </button>
      )}
    </section>
  )
}
