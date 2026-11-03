import { useEffect, useRef, useState } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { Steps } from '@/modules/core/components/Steps'
import { ChoiceGroup, Field } from '../components/Field'
import { MultiPhotoInput } from '../components/MultiPhotoInput'
import { donationService } from '../services/donationService'
import { FRANJAS, type DonationDto, type FoundationDto, type Modalidad } from '../types/donation.dto'
import { CATEGORIAS, CONSERVACIONES, CONSERVACION_LABEL } from '../types/secondhand.dto'
import { formatDay, isoDay } from '../utils/dates'
import { DONATION_RULES, emptyDonation, foundationProblem, validateDonationStep, type DonationErrors, type DonationForm } from '../utils/donationForm'
import { a11y, inputCls } from '../utils/form'

const STEPS = ['La prenda', 'Fundación', 'Entrega y resumen']
const MODALIDAD_LABEL: Record<Modalidad, string> = { RECOGIDA: 'Que la recojan', ENTREGA_EN_PUNTO: 'La llevo a un punto de acopio' }

/** RF-42 y RF-44 (fundación) y RF-45 y RF-48 (solicitud con logística) en 3 pantallas. */
export default function DonatePage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<DonationForm>(emptyDonation)
  const [errors, setErrors] = useState<DonationErrors>({})
  const { data: foundations, loading: fLoading, error: fError, reload: loadF } = useResource(donationService.foundations, [] as FoundationDto[])
  const [onlyCompatible, setOnlyCompatible] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<unknown>(null)
  const [done, setDone] = useState<DonationDto | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => { heading.current?.focus() }, [step, done])

  const set = <K extends keyof DonationForm>(k: K, v: DonationForm[K]) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const fd = foundations.find((x) => x.id === form.fundacionId)
  const next = () => { const e = validateDonationStep(step, form, foundations); setErrors(e); if (!Object.keys(e).length) setStep((s) => s + 1) }

  const submit = async () => {
    const all = { ...validateDonationStep(0, form), ...validateDonationStep(1, form, foundations), ...validateDonationStep(2, form) }
    setErrors(all)
    if (Object.keys(all).length || sending) return
    setSending(true); setSendError(null)
    try {
      const res = await donationService.create({
        fundacionId: form.fundacionId,
        prenda: { titulo: form.titulo.trim(), categoria: form.categoria, talla: form.talla.trim(), conservacion: form.conservacion as DonationDto['prenda']['conservacion'], cantidad: Number(form.cantidad), descripcion: form.descripcion.trim() },
        logistica: { modalidad: form.modalidad as Modalidad, fecha: form.fecha, franja: form.franja,
          ...(form.modalidad === 'ENTREGA_EN_PUNTO' ? { puntoId: form.puntoId } : { direccion: form.direccion.trim() }) },
      }, form.fotos.map((p) => p.file!).filter(Boolean))
      setDone(res)
    } catch (e) { setSendError(e) } finally { setSending(false) }
  }

  if (done) return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Solicitud enviada</p>
      <h1 ref={heading} tabIndex={-1} className="mt-3 text-4xl font-extrabold outline-none">Gracias por donar</h1>
      <p className="mt-3 text-white/70">{done.fundacion.nombre} revisará «{done.prenda.titulo}». Propusiste {formatDay(done.logistica.fecha)}, de {done.logistica.franja}. Te avisaremos cuando la acepten.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link to="/segunda-mano" className="rounded-xl bg-violeta px-5 py-3 text-sm font-semibold">Volver a Segunda vida</Link>
        <button type="button" onClick={() => { setForm(emptyDonation()); setDone(null); setStep(0) }} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold">Donar otra prenda</button>
      </div>
    </section>
  )

  const shown = foundations.filter((f) => !onlyCompatible || !foundationProblem(f, form.categoria))

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Donar una prenda</p>
      <h1 ref={heading} tabIndex={-1} className="mt-2 text-3xl font-extrabold tracking-tight outline-none md:text-4xl">{STEPS[step]}</h1>
      <div className="mt-5"><Steps steps={STEPS} current={step} /></div>

      <form className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/[.03] p-5 md:p-7" noValidate onSubmit={(e) => { e.preventDefault(); if (step < 2) next(); else submit() }}>
        {step === 0 && (<>
          <div><p className="mb-2 text-sm font-semibold">Fotos (hasta {DONATION_RULES.maxFotos})</p>
            <MultiPhotoInput id="dfotos" photos={form.fotos} onChange={(p) => set('fotos', p)} max={DONATION_RULES.maxFotos} error={errors.fotos} /></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field id="dtit" label="¿Qué donas?" error={errors.titulo}><input {...a11y('dtit', errors.titulo)} className={inputCls} value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ej. Suéter de lana" /></Field></div>
            <Field id="dcat" label="Categoría" error={errors.categoria}><select {...a11y('dcat', errors.categoria)} className={inputCls} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}><option value="">Elige una</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field id="dtal" label="Talla" error={errors.talla}><input {...a11y('dtal', errors.talla)} className={inputCls} value={form.talla} onChange={(e) => set('talla', e.target.value)} placeholder="Ej. M o S a XL" /></Field>
            <Field id="dcan" label="Cantidad" error={errors.cantidad}><input {...a11y('dcan', errors.cantidad)} inputMode="numeric" className={inputCls} value={form.cantidad} onChange={(e) => set('cantidad', e.target.value.trim())} /></Field>
            <div className="sm:col-span-2"><ChoiceGroup label="Estado" options={CONSERVACIONES} labels={CONSERVACION_LABEL} value={form.conservacion} onChange={(v) => set('conservacion', v)} error={errors.conservacion} /></div>
            <div className="sm:col-span-2"><Field id="ddes" label="Descripción" error={errors.descripcion}><textarea {...a11y('ddes', errors.descripcion)} className={`${inputCls} min-h-24`} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></Field></div>
          </div>
        </>)}

        {step === 1 && (
          fLoading ? <Loading label="Buscando fundaciones cercanas…" /> : fError ? <ErrorState error={fError} onRetry={loadF} title="No pudimos cargar las fundaciones" /> : (
            <fieldset>
              <legend className="text-sm font-semibold">Elige la fundación (de la más cercana a la más lejana)</legend>
              <label className="mt-2 flex items-center gap-2 text-sm text-white/75"><input type="checkbox" checked={onlyCompatible} onChange={(e) => setOnlyCompatible(e.target.checked)} /> Solo las que reciben {form.categoria.toLowerCase() || 'esta categoría'}</label>
              <div role="radiogroup" aria-label="Fundaciones" className="mt-4 space-y-2">
                {shown.length ? shown.map((f) => {
                  const p = foundationProblem(f, form.categoria)
                  return (
                    <button key={f.id} type="button" role="radio" aria-checked={form.fundacionId === f.id} disabled={!!p} onClick={() => set('fundacionId', f.id)}
                      className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border p-4 text-left ${form.fundacionId === f.id ? 'border-arena ring-2 ring-arena' : 'border-white/10'} disabled:cursor-not-allowed disabled:opacity-50`}>
                      <span><span className="block font-semibold">{f.nombre}</span><span className="block text-xs text-white/60">{f.barrio} · a {f.distanciaKm.toLocaleString('es-CO')} km · Recibe {f.categorias.join(', ').toLowerCase()}</span></span>
                      {p && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{p}</span>}
                    </button>
                  )
                }) : <p className="text-sm text-white/70">Ninguna fundación cercana recibe {form.categoria.toLowerCase()} ahora. Desmarca el filtro para verlas todas o cambia la categoría.</p>}
              </div>
              {errors.fundacionId && <p role="alert" className="mt-2 text-xs text-[#ffb4b4]">{errors.fundacionId}</p>}
            </fieldset>
          ))}

        {step === 2 && (<>
          <ChoiceGroup label="¿Cómo la entregas?" options={['RECOGIDA', 'ENTREGA_EN_PUNTO'] as const} labels={MODALIDAD_LABEL} value={form.modalidad} onChange={(v) => set('modalidad', v)} error={errors.modalidad} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="dfec" label="Día" error={errors.fecha}><input {...a11y('dfec', errors.fecha)} type="date" className={inputCls} min={isoDay(DONATION_RULES.minDias)} max={isoDay(DONATION_RULES.maxDias)} value={form.fecha} onChange={(e) => set('fecha', e.target.value)} /></Field>
            <Field id="dfra" label="Franja horaria" error={errors.franja}><select {...a11y('dfra', errors.franja)} className={inputCls} value={form.franja} onChange={(e) => set('franja', e.target.value)}><option value="">Elige una</option>{FRANJAS.map((x) => <option key={x}>{x}</option>)}</select></Field>
            {form.modalidad === 'ENTREGA_EN_PUNTO' && (
              <div className="sm:col-span-2"><Field id="dpun" label="Punto de acopio" error={errors.puntoId}><select {...a11y('dpun', errors.puntoId)} className={inputCls} value={form.puntoId} onChange={(e) => set('puntoId', e.target.value)}><option value="">Elige uno</option>{fd?.puntos.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.direccion}</option>)}</select></Field></div>)}
            {form.modalidad === 'RECOGIDA' && (
              <div className="sm:col-span-2"><Field id="ddir" label="Dirección de recogida" error={errors.direccion}><input {...a11y('ddir', errors.direccion)} className={inputCls} value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Ej. Cra. 7 #54-20, Chapinero" /></Field></div>)}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm" aria-label="Resumen de la donación">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-arena">Resumen</p>
            <p className="mt-2"><b>{form.cantidad} × {form.titulo}</b> · {form.categoria} · Talla {form.talla}{form.conservacion ? ` · ${CONSERVACION_LABEL[form.conservacion]}` : ''}</p>
            <p className="text-white/70">Para {fd?.nombre}</p>
            <p className="text-white/70">{form.modalidad ? MODALIDAD_LABEL[form.modalidad as Modalidad] : 'Entrega por definir'}{form.fecha ? ` · ${formatDay(form.fecha)}` : ''}{form.franja ? ` · ${form.franja}` : ''}</p>
          </div>
        </>)}

        {sendError != null && <p role="alert" className="rounded-xl bg-[#ff8a8a]/10 p-3 text-sm text-[#ffb4b4]">No pudimos enviar la solicitud. {errorMessage(sendError)}</p>}

        <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-5">
          {step > 0 ? <button type="button" onClick={() => { setErrors({}); setStep((s) => s - 1) }} disabled={sending} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold">Atrás</button> : <span />}
          <button type="submit" disabled={sending || (step === 1 && (fLoading || !!fError))} className="rounded-xl bg-violeta px-6 py-3 text-sm font-semibold disabled:opacity-60">
            {step < 2 ? 'Continuar' : sending ? 'Enviando…' : 'Enviar solicitud'}</button>
        </div>
      </form>
    </section>
  )
}
