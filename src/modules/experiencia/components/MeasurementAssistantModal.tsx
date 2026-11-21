import { useState } from 'react'
import { TALLAS_CALZADO, TALLAS_INFERIOR, TALLAS_SUPERIOR } from '@/modules/identidad/types/usuario.dto'
import { saveUserMeasurements, getUserMeasurements } from '../utils/lookEngine'
import type { UserMeasurements } from '../types/look.dto'

interface MeasurementAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (measurements: UserMeasurements) => void
  pendingGarmentName?: string
}

export function MeasurementAssistantModal({
  isOpen,
  onClose,
  onComplete,
  pendingGarmentName,
}: MeasurementAssistantModalProps) {
  const current = getUserMeasurements()
  const [superior, setSuperior] = useState(current.superior || 'M')
  const [inferior, setInferior] = useState(current.inferior || '30')
  const [calzado, setCalzado] = useState(current.calzado || '38')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const measurements: UserMeasurements = { superior, inferior, calzado }
    saveUserMeasurements(measurements)
    onComplete(measurements)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-[#161224]/95 p-6 shadow-2xl text-white backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar asistente"
          className="absolute right-4 top-4 text-white/60 hover:text-white transition"
        >
          ✕
        </button>

        <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c4b5fd]">
          Asistente de ajuste virtual
        </span>
        <h2 id="assistant-title" className="text-xl font-black tracking-tight mt-1">
          Configura tus medidas
        </h2>
        <p className="mt-2 text-xs text-white/70 leading-relaxed">
          {pendingGarmentName
            ? `Antes de probar ${pendingGarmentName}, confirma tus tallas habituales para evaluar tu ajuste exacto.`
            : 'Personaliza tus medidas para calcular la talla recomendada en todas las prendas de Bogotá.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/90 mb-1.5">
              Talla superior (Camisas, Chaquetas, Buzos)
            </label>
            <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Talla superior">
              {TALLAS_SUPERIOR.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSuperior(t)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    superior === t
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/30 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/90 mb-1.5">
              Talla inferior (Pantalones, Jeans)
            </label>
            <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Talla inferior">
              {TALLAS_INFERIOR.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInferior(t)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    inferior === t
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/30 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/90 mb-1.5">
              Calzado (Talla colombiana)
            </label>
            <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Calzado">
              {TALLAS_CALZADO.slice(0, 8).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCalzado(t)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                    calzado === t
                      ? 'border-[#8b5cf6] bg-[#8b5cf6]/30 text-white shadow-sm'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-xs font-bold tracking-wide shadow-lg shadow-purple-900/40 hover:brightness-110 active:scale-[0.98] transition"
          >
            Guardar medidas y probar
          </button>
        </form>
      </div>
    </div>
  )
}
