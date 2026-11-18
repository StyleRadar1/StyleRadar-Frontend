import { useState, useId } from 'react'
import type { BodyMeasurements } from '../types/bodyMeasurements.dto'
import {
  DEFAULT_BODY_MEASUREMENTS,
  computeBodyDeformation,
  estimateMeasurements,
  saveBodyMeasurements,
  validateBodyMeasurements,
} from '../utils/bodyMeasurementsEngine'

interface BodyMeasurementsWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (measurements: BodyMeasurements, persist: boolean) => void
  initialMeasurements?: BodyMeasurements | null
}

export function BodyMeasurementsWizardModal({
  isOpen,
  onClose,
  onSave,
  initialMeasurements,
}: BodyMeasurementsWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const consentId = useId()

  const [form, setForm] = useState<BodyMeasurements>(() => {
    return initialMeasurements || { ...DEFAULT_BODY_MEASUREMENTS }
  })

  const [hasEstimated, setHasEstimated] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [activeGuideKey, setActiveGuideKey] = useState<string>('pecho')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  if (!isOpen) return null

  /* Actualizar campos numéricos */
  const updateField = (field: keyof BodyMeasurements, val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }))
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  /* Paso 1 a 2 */
  const handleNextStep1 = () => {
    setStep(2)
  }

  /* Paso 2 a 3 */
  const handleNextStep2 = () => {
    if (form.estatura < 140 || form.estatura > 210) {
      setValidationErrors({ estatura: 'La estatura debe estar entre 1,40 m y 2,10 m.' })
      return
    }
    setValidationErrors({})
    setStep(3)
  }

  /* Estimación automática */
  const handleEstimate = () => {
    const estimated = estimateMeasurements(form.cuerpoBase, form.estatura, form.peso, form.tallaHabitual)
    setForm((prev) => ({
      ...prev,
      ...estimated,
      esAproximado: true,
    }))
    setHasEstimated(true)
  }

  /* Paso 3 a 4 (Validar coherencia) */
  const handleNextStep3 = () => {
    const res = validateBodyMeasurements(form)
    if (!res.valid) {
      setValidationErrors(res.errors)
      return
    }
    setValidationErrors({})
    setValidationWarnings(res.warnings)
    setStep(4)
  }

  /* Guardar definitivo con consentimiento */
  const handleSavePermanent = () => {
    if (!consentChecked) {
      setValidationErrors({ consent: 'Debes autorizar el tratamiento de tus medidas corporales (mayor de 18 años) para guardarlas permanentemente.' })
      return
    }
    saveBodyMeasurements(form, true)
    onSave(form, true)
    onClose()
  }

  /* Continuar con medidas temporales (sin guardar permanente) */
  const handleContinueTemporary = () => {
    saveBodyMeasurements(form, false)
    onSave(form, false)
    onClose()
  }

  /* Factores de deformación para previsualización en vivo */
  const deformation = computeBodyDeformation(form)

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-purple-500/30 bg-[#151022] p-6 sm:p-8 text-white shadow-2xl backdrop-blur-2xl">
        {/* Encabezado con barra de progreso */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#c4b5fd]">
              Asistente de Medidas Anatómicas · Paso {step} de 4
            </span>
            <h2 id="wizard-title" className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {step === 1 && 'Elige tu silueta base y unidades'}
              {step === 2 && 'Estatura, peso y talla'}
              {step === 3 && 'Tus medidas en centímetros'}
              {step === 4 && 'Vista previa y confirmación'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente"
            className="rounded-full h-8 w-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 my-4" role="tablist" aria-label="Progreso del asistente">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-gradient-to-r from-[#7c3aed] to-[#a855f7]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* ═════════════════════════════════════════════════════════
            PASO 1: CUERPO BASE Y UNIDADES
            ═════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
                1. Selecciona la silueta de cuerpo base
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { id: 'femenino', label: 'Femenino', icon: '👗', desc: 'Curvas acentuadas y cintura definida' },
                    { id: 'masculino', label: 'Masculino', icon: '👔', desc: 'Hombros anchos y corte recto' },
                    { id: 'neutro', label: 'Neutro', icon: '✨', desc: 'Silueta recta balanceada' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateField('cuerpoBase', c.id)}
                    className={`p-4 rounded-2xl border text-left transition ${
                      form.cuerpoBase === c.id
                        ? 'border-[#a855f7] bg-[#a855f7]/20 shadow-lg shadow-purple-900/40 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{c.icon}</span>
                    <strong className="block text-sm font-bold">{c.label}</strong>
                    <span className="text-[11px] text-white/60 leading-tight block mt-1">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
                2. Sistema de unidades preferido
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('unidades', 'metric')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                    form.unidades === 'metric'
                      ? 'border-[#a855f7] bg-[#a855f7]/25 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Métrico (cm, m, kg)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('unidades', 'imperial')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                    form.unidades === 'imperial'
                      ? 'border-[#a855f7] bg-[#a855f7]/25 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Imperial (pulgadas, pies, lbs)
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleContinueTemporary}
                className="text-xs text-white/60 hover:text-white underline underline-offset-4 transition"
              >
                Continuar con medidas temporales (sin guardar)
              </button>
              <button
                type="button"
                onClick={handleNextStep1}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-xs font-bold tracking-wide shadow-lg shadow-purple-900/40 hover:brightness-110 transition"
              >
                Continuar a estatura y talla →
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            PASO 2: ESTATURA, PESO Y TALLA
            ═════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Estatura: <strong className="text-purple-300">{(form.estatura / 100).toFixed(2)} m ({form.estatura} cm)</strong>
                </label>
                {form.unidades === 'imperial' && (
                  <span className="text-xs text-white/50">
                    ~{Math.floor(form.estatura / 30.48)}&apos; {Math.round((form.estatura % 30.48) / 2.54)}&quot;
                  </span>
                )}
              </div>
              <input
                type="range"
                min={140}
                max={210}
                step={1}
                value={form.estatura}
                onChange={(e) => updateField('estatura', Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
                aria-label="Estatura en centímetros"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>1,40 m</span>
                <span>1,75 m (estándar)</span>
                <span>2,10 m</span>
              </div>
              {validationErrors.estatura && (
                <p className="text-xs text-rose-400 mt-1">{validationErrors.estatura}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                  Peso (Opcional): <span className="text-purple-300">{form.peso || 65} kg</span>
                </label>
                <input
                  type="number"
                  min={35}
                  max={200}
                  value={form.peso || ''}
                  placeholder="ej. 65"
                  onChange={(e) => updateField('peso', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                  Talla habitual de ropa
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateField('tallaHabitual', t)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        form.tallaHabitual === t
                          ? 'border-[#a855f7] bg-[#a855f7]/30 text-white'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-white/60 hover:text-white transition"
              >
                ← Volver a silueta
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-xs font-bold tracking-wide shadow-lg shadow-purple-900/40 hover:brightness-110 transition"
              >
                Continuar a medidas anatómicas →
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            PASO 3: MEDIDAS EN CM Y GUÍA ILUSTRADA
            ═════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6 pt-2">
            {/* Banner con botón "No sé mis medidas" */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30">
              <div>
                <strong className="text-xs text-purple-200 block">¿No tienes una cinta métrica a la mano?</strong>
                <span className="text-[11px] text-white/70">
                  Calculamos una estimación antropométrica con tu estatura, peso y talla.
                </span>
              </div>
              <button
                type="button"
                onClick={handleEstimate}
                className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-200 text-xs font-bold hover:bg-purple-600/50 transition active:scale-95 shadow-sm"
              >
                ✨ No sé mis medidas (Estimar)
              </button>
            </div>

            {hasEstimated && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2">
                <span>✓</span>
                <span>Medidas estimadas aplicadas con éxito. Puedes modificarlas libremente abajo.</span>
              </div>
            )}

            {/* Guía ilustrada de medición interactiva */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                Guía rápida de medición:
              </span>
              <p className="text-white/80 leading-relaxed">
                {activeGuideKey === 'pecho' && '📏 Pecho/Busto: Pasa la cinta métrica horizontalmente por la parte más prominente del busto o tórax.'}
                {activeGuideKey === 'cintura' && '📏 Cintura: Mide alrededor de tu cintura natural, justo por encima del ombligo, sin apretar.'}
                {activeGuideKey === 'cadera' && '📏 Cadera: Mide la circunferencia en el punto más ancho de los glúteos con los pies juntos.'}
                {activeGuideKey === 'hombros' && '📏 Hombros: Distancia en línea recta desde la punta del hombro izquierdo al derecho.'}
                {activeGuideKey === 'largoBrazo' && '📏 Brazo: Desde el borde del hombro hasta la muñeca con el brazo ligeramente doblado.'}
                {activeGuideKey === 'largoTorso' && '📏 Torso: Desde la base del cuello hasta la línea de la cintura.'}
                {activeGuideKey === 'largoPierna' && '📏 Pierna: Desde la cintura hasta el tobillo por el costado exterior.'}
              </p>
            </div>

            {/* Inputs de medidas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {[
                { key: 'pecho', label: 'Pecho / Busto', min: 60, max: 150 },
                { key: 'cintura', label: 'Cintura', min: 45, max: 140 },
                { key: 'cadera', label: 'Cadera', min: 65, max: 160 },
                { key: 'hombros', label: 'Hombros', min: 30, max: 65 },
                { key: 'largoBrazo', label: 'Largo de brazo', min: 45, max: 80 },
                { key: 'largoTorso', label: 'Largo de torso', min: 35, max: 65 },
                { key: 'largoPierna', label: 'Largo de pierna', min: 70, max: 125 },
              ].map(({ key, label, min, max }) => {
                const val = (form as any)[key] || min
                return (
                  <div
                    key={key}
                    onFocus={() => setActiveGuideKey(key)}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 focus-within:border-purple-500 transition"
                  >
                    <label className="block text-[11px] font-bold text-white/80 mb-1">
                      {label}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={min}
                        max={max}
                        value={val}
                        onChange={(e) => updateField(key as keyof BodyMeasurements, Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none font-mono"
                      />
                      <span className="text-[11px] text-white/50">cm</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {Object.keys(validationErrors).length > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
                {Object.values(validationErrors).map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-white/60 hover:text-white transition"
              >
                ← Volver a estatura
              </button>
              <button
                type="button"
                onClick={handleNextStep3}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-xs font-bold tracking-wide shadow-lg shadow-purple-900/40 hover:brightness-110 transition"
              >
                Ver vista previa en vivo →
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            PASO 4: VISTA PREVIA EN VIVO Y AUTORIZACIÓN EXPRESA
            ═════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Maniquí en vivo adaptado a las medidas */}
              <div className="relative h-64 sm:h-72 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden">
                <div
                  className="relative h-full flex items-center justify-center"
                  style={{
                    transformOrigin: 'bottom center',
                    transform: `scale(${deformation.heightScale})`,
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  <img
                    src={deformation.silhouetteSrc}
                    alt="Vista previa del maniquí"
                    className="h-full object-contain filter drop-shadow(0 10px 25px rgba(0,0,0,0.5))"
                    style={{
                      transform: `scaleX(${deformation.chestScale})`,
                      transition: 'transform 0.3s ease-out',
                    }}
                  />
                </div>
                {/* Etiqueta de estatura sobre el stage */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  {(form.estatura / 100).toFixed(2)} m · {form.cuerpoBase.toUpperCase()}
                </div>
              </div>

              {/* Deslizadores rápidos para ajustar en vivo */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-white/80 mb-1">
                    <span>Pecho:</span>
                    <strong className="text-purple-300">{form.pecho} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={65}
                    max={145}
                    value={form.pecho}
                    onChange={(e) => updateField('pecho', Number(e.target.value))}
                    className="w-full accent-purple-500"
                    aria-label="Ajustar pecho"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-white/80 mb-1">
                    <span>Cintura:</span>
                    <strong className="text-purple-300">{form.cintura} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={135}
                    value={form.cintura}
                    onChange={(e) => updateField('cintura', Number(e.target.value))}
                    className="w-full accent-purple-500"
                    aria-label="Ajustar cintura"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-white/80 mb-1">
                    <span>Cadera:</span>
                    <strong className="text-purple-300">{form.cadera} cm</strong>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={155}
                    value={form.cadera}
                    onChange={(e) => updateField('cadera', Number(e.target.value))}
                    className="w-full accent-purple-500"
                    aria-label="Ajustar cadera"
                  />
                </div>

                {validationWarnings.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
                    {validationWarnings[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Casilla de autorización expresa Ley 1581 (sin premarcar, mayor de 18) */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <label htmlFor={consentId} className="flex items-start gap-3 cursor-pointer">
                <input
                  id={consentId}
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => {
                    setConsentChecked(e.target.checked)
                    if (validationErrors.consent) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.consent
                        return copy
                      })
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/50 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-[11px] text-white/80 leading-relaxed">
                  Autorizo de manera previa, expresa e informada a StyleRadar para almacenar y tratar mis medidas corporales anatómicas con el fin exclusivo de simular el ajuste virtual de prendas en el probador (Ley 1581 de 2012). <strong>Declaro bajo juramento ser mayor de 18 años.</strong>
                </span>
              </label>

              {validationErrors.consent && (
                <p className="text-xs text-rose-400 font-semibold">{validationErrors.consent}</p>
              )}
            </div>

            {/* Botones de acción final */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSavePermanent}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-xs font-black tracking-wide shadow-lg shadow-purple-900/40 hover:brightness-110 transition cursor-pointer"
              >
                Guardar mi cuerpo
              </button>

              <button
                type="button"
                onClick={handleContinueTemporary}
                className="w-full py-2.5 rounded-full border border-white/20 bg-transparent text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition cursor-pointer"
              >
                Continuar con medidas temporales (sin guardar)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
