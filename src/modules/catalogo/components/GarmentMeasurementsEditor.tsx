import { useState } from 'react'
import {
  REFERENCE_GARMENT_MEASUREMENTS,
  type GarmentSizeMeasurementDto,
} from '../types/garmentMeasurements.dto'

interface GarmentMeasurementsEditorProps {
  sizes: string[]
  value: GarmentSizeMeasurementDto[]
  onChange: (next: GarmentSizeMeasurementDto[]) => void
  loading?: boolean
}

type NumericField =
  | 'minChestCm'
  | 'maxChestCm'
  | 'minWaistCm'
  | 'maxWaistCm'
  | 'minHipCm'
  | 'maxHipCm'
  | 'lengthCm'

export function GarmentMeasurementsEditor({
  sizes,
  value,
  onChange,
  loading = false,
}: GarmentMeasurementsEditorProps) {
  const [expanded, setExpanded] = useState(false)

  const displaySizes = sizes.length > 0 ? sizes : ['XS', 'S', 'M', 'L', 'XL']

  const getRow = (size: string): GarmentSizeMeasurementDto =>
    value.find((v) => v.size === size) ?? { size }

  const updateField = (size: string, field: NumericField, rawVal: string) => {
    const parsed = rawVal === '' ? undefined : Number(rawVal)
    const nextNum = parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined

    const existingIdx = value.findIndex((v) => v.size === size)
    const current = existingIdx >= 0 ? value[existingIdx] : { size }
    const updated: GarmentSizeMeasurementDto = { ...current, [field]: nextNum }

    if (existingIdx >= 0) {
      const copy = [...value]
      copy[existingIdx] = updated
      onChange(copy)
    } else {
      onChange([...value, updated])
    }
  }

  const fillReference = () => {
    const next: GarmentSizeMeasurementDto[] = displaySizes.map((size) => {
      const ref = REFERENCE_GARMENT_MEASUREMENTS[size] ?? REFERENCE_GARMENT_MEASUREMENTS.M
      return { size, ...ref }
    })
    onChange(next)
    setExpanded(true)
  }

  const filledCount = value.filter(
    (r) =>
      r.minChestCm != null ||
      r.maxChestCm != null ||
      r.minWaistCm != null ||
      r.maxWaistCm != null ||
      r.minHipCm != null ||
      r.maxHipCm != null ||
      r.lengthCm != null,
  ).length

  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-white/90">
            Medidas por talla en cm (para el probador 2D)
          </p>
          <p className="text-[11px] text-white/55">
            Opcional: si no las registras, el probador usará la guía de referencia.
            {filledCount > 0 && ` (${filledCount} tallas configuradas)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fillReference}
            className="rounded-lg border border-violeta-claro/40 bg-violeta/15 px-2.5 py-1 text-[11px] font-semibold text-violeta-claro hover:bg-violeta/25"
          >
            Llenar con guía base
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
          >
            {expanded ? 'Ocultar tabla' : 'Configurar medidas'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 overflow-x-auto">
          {loading ? (
            <p className="py-2 text-xs text-white/60">Cargando medidas guardadas…</p>
          ) : (
            <table className="w-full min-w-[540px] text-left text-[11px] text-white/85">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/50">
                  <th className="py-1.5 pr-2">Talla</th>
                  <th className="py-1.5 px-1">Pecho mín</th>
                  <th className="py-1.5 px-1">Pecho máx</th>
                  <th className="py-1.5 px-1">Cintura mín</th>
                  <th className="py-1.5 px-1">Cintura máx</th>
                  <th className="py-1.5 px-1">Cadera mín</th>
                  <th className="py-1.5 px-1">Cadera máx</th>
                  <th className="py-1.5 pl-1">Largo (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displaySizes.map((size) => {
                  const row = getRow(size)
                  const renderInput = (field: NumericField, placeholder: string) => (
                    <input
                      type="number"
                      min={20}
                      max={220}
                      value={row[field] ?? ''}
                      placeholder={placeholder}
                      onChange={(e) => updateField(size, field, e.target.value)}
                      className="w-16 rounded-md border border-white/15 bg-black/35 px-1.5 py-1 text-[11px] text-white placeholder:text-white/25 focus:border-violeta-claro focus:outline-none"
                    />
                  )
                  return (
                    <tr key={size}>
                      <td className="py-1.5 pr-2 font-bold text-white">{size}</td>
                      <td className="py-1.5 px-1">{renderInput('minChestCm', '92')}</td>
                      <td className="py-1.5 px-1">{renderInput('maxChestCm', '98')}</td>
                      <td className="py-1.5 px-1">{renderInput('minWaistCm', '76')}</td>
                      <td className="py-1.5 px-1">{renderInput('maxWaistCm', '84')}</td>
                      <td className="py-1.5 px-1">{renderInput('minHipCm', '96')}</td>
                      <td className="py-1.5 px-1">{renderInput('maxHipCm', '102')}</td>
                      <td className="py-1.5 pl-1">{renderInput('lengthCm', '70')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
