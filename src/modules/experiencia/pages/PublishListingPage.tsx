import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { Steps } from '@/modules/core/components/Steps'
import { formatCOP } from '@/modules/core/utils/format'
import { ChoiceGroup, Field } from '../components/Field'
import { MultiPhotoInput } from '../components/MultiPhotoInput'
import { secondHandService } from '../services/secondHandService'
import {
  CATEGORIAS,
  CONSERVACIONES,
  CONSERVACION_LABEL,
  LISTING_RULES,
  LOCALIDADES_BOGOTA,
  STYLE_LABEL,
  STYLES_ENUM,
  TALLAS,
  mapCategoriaToGarmentType,
  type ConservationStatus,
  type ListingDto,
  type ListingRequestDto,
  type LocalidadEnum,
  type SizeEnum,
  type StyleEnum,
} from '../types/secondhand.dto'
import { a11y, inputCls } from '../utils/form'
import { emptyListing, priceValue, validateListingStep, type ListingErrors, type ListingForm } from '../utils/listingForm'

const STEPS = ['Fotos y estado', 'Detalles', 'Precio y resumen']

/**
 * RF-33 a RF-35 (y RF-37 al editar): asistente de publicación en 3 pantallas.
 * Los datos viven en el estado de la página, así que ir atrás no borra nada.
 */
export default function PublishListingPage() {
  const { id } = useParams()
  const editing = !!id
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ListingForm>(emptyListing)
  const [errors, setErrors] = useState<ListingErrors>({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<unknown>(null)
  const [done, setDone] = useState<ListingDto | null>(null)
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [blocked, setBlocked] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!id) return
    secondHandService.get(id).then((l) => {
      if (l.estado !== 'DISPONIBLE' && l.status !== 'AVAILABLE') {
        setBlocked(`Esta publicación está ${l.estado === 'VENDIDA' || l.status === 'SOLD' ? 'vendida' : 'retirada'} y ya no se puede editar.`)
      }
      setForm({
        esDonacion: Boolean(l.esDonacion),
        fotos: (l.photos || l.fotos).map((url, i) => ({ key: `old-${i}`, url })),
        conservacion: l.conservacion,
        titulo: l.garmentName || l.titulo,
        categoria: l.categoria,
        garmentType: l.garmentType,
        talla: l.size || l.talla,
        size: l.size as SizeEnum,
        style: l.style,
        color: l.color || '',
        localidad: l.localidad || 'CHAPINERO',
        marca: l.brand || l.marca,
        descripcion: l.description || l.descripcion,
        precio: (l.price ?? l.precio).toLocaleString('es-CO').replace(/,/g, '.'),
      })
    }).catch(setLoadError).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { heading.current?.focus() }, [step, done])

  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const next = () => {
    const e = validateListingStep(step, form)
    setErrors(e)
    if (Object.keys(e).length) return
    setStep((s) => s + 1)
  }
  const back = () => { setErrors({}); setStep((s) => s - 1) }

  const submit = async () => {
    const all = { ...validateListingStep(0, form), ...validateListingStep(1, form), ...validateListingStep(2, form) }
    setErrors(all)
    if (Object.keys(all).length || sending) return
    setSending(true)
    setSendError(null)

    const priceNum = form.esDonacion ? 0 : priceValue(form.precio)
    const data: ListingRequestDto = {
      garmentName: form.titulo.trim(),
      titulo: form.titulo.trim(),
      categoria: form.categoria || 'Camisas',
      garmentType: form.garmentType || mapCategoriaToGarmentType(form.categoria || ''),
      talla: form.talla || 'M',
      size: (form.size || form.talla || 'M') as SizeEnum,
      style: (form.style || 'CASUAL') as StyleEnum,
      color: form.color || 'Negro',
      localidad: (form.localidad || 'CHAPINERO') as LocalidadEnum,
      conservacion: form.conservacion as ListingDto['conservacion'],
      conservationStatus: (form.conservacion === 'COMO_NUEVO'
        ? 'LIKE_NEW'
        : form.conservacion === 'MUY_BUENO'
          ? 'GOOD_CONDITION'
          : 'ACCEPTABLE') as ConservationStatus,
      marca: form.marca.trim(),
      brand: form.marca.trim(),
      descripcion: form.descripcion.trim(),
      description: form.descripcion.trim(),
      precio: priceNum,
      price: priceNum,
      esDonacion: form.esDonacion,
    }

    const files = form.fotos.filter((p) => p.file).map((p) => p.file!)
    try {
      const res = id
        ? await secondHandService.update(id, { ...data, fotosConservadas: form.fotos.filter((p) => !p.file).map((p) => p.url) }, files)
        : await secondHandService.create(data, files)
      setDone(res)
    } catch (e) {
      setSendError(e)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <section className="mx-auto max-w-3xl px-4 py-12"><Loading label="Cargando tu publicación…" /></section>
  if (loadError) return <section className="mx-auto max-w-3xl px-4 py-12"><ErrorState error={loadError} title="No pudimos abrir la publicación" /></section>
  if (blocked) return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div role="alert" className="rounded-2xl border border-[var(--color-warning-border,#d97706)] bg-[var(--color-warning-bg,rgba(217,119,6,0.1))] text-[var(--color-warning-text,#92400e)] p-6">
        <p className="font-semibold">{blocked}</p>
        <Link to="/segunda-mano?vista=mias" className="mt-4 inline-block rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-4 py-2 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]">Volver a mis publicaciones</Link>
      </div>
    </section>
  )

  if (done) return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">{editing ? 'Cambios guardados' : 'Publicación creada'}</p>
      <h1 ref={heading} tabIndex={-1} className="mt-3 text-4xl font-extrabold text-[var(--color-text)] outline-none">{editing ? 'Listo, actualizamos tu prenda' : '¡Tu prenda ya está en Segunda vida!'}</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">«{done.garmentName || done.titulo}» {done.esDonacion ? 'en Vitrina de Donaciones ($0 COP)' : `por ${formatCOP(done.price ?? done.precio)}`}. Te avisaremos cuando haya novedades.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link to="/segunda-mano?vista=mias" className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-5 py-3 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]">Ver mis publicaciones</Link>
        {!editing && <button type="button" onClick={() => { setForm(emptyListing()); setDone(null); setStep(0) }} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-5 py-3 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]">Publicar otra</button>}
      </div>
    </section>
  )

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">
        Segunda vida · {editing ? 'Editar publicación' : form.esDonacion ? 'Donar una prenda' : 'Vender una prenda'}
      </p>

      {/* Selector de Modalidad arriba del todo (Ley de Hick + Divulgación Progresiva) */}
      {!editing && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Modalidad de publicación">
          <button
            type="button"
            role="radio"
            aria-checked={!form.esDonacion}
            onClick={() => { set('esDonacion', false); set('precio', '') }}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              !form.esDonacion
                ? 'border-[var(--color-accent)] bg-[var(--color-surface)] ring-2 ring-[var(--color-focus-ring)] shadow-sm'
                : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-[var(--color-text)]">Vender en Segunda Vida</span>
              <span className={`h-4 w-4 rounded-full border-2 grid place-items-center ${!form.esDonacion ? 'border-[var(--color-accent)]' : 'border-gray-400'}`}>
                {!form.esDonacion && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Fija un precio y véndela a otros usuarios.</p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={form.esDonacion}
            onClick={() => { set('esDonacion', true); set('precio', '0') }}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              form.esDonacion
                ? 'border-[var(--color-accent)] bg-[var(--color-surface)] ring-2 ring-[var(--color-focus-ring)] shadow-sm'
                : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-[var(--color-text)]">Donar a Fundación (Vitrina Abierta)</span>
              <span className={`h-4 w-4 rounded-full border-2 grid place-items-center ${form.esDonacion ? 'border-[var(--color-accent)]' : 'border-gray-400'}`}>
                {form.esDonacion && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Valor $0 COP · Cualquier fundación aliada podrá reclamarla.</p>
          </button>
        </div>
      )}

      <h1 ref={heading} tabIndex={-1} className="mt-6 text-3xl font-extrabold tracking-tight text-[var(--color-text)] outline-none md:text-4xl">{STEPS[step]}</h1>
      <div className="mt-5"><Steps steps={STEPS} current={step} /></div>

      <form className="mt-8 space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7 shadow-sm" noValidate
        onSubmit={(e) => { e.preventDefault(); if (step < 2) next(); else submit() }}>
        {step === 0 && (<>
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">Fotos (hasta {LISTING_RULES.maxFotos})</p>
            <MultiPhotoInput id="lfotos" photos={form.fotos} onChange={(p) => set('fotos', p)} max={LISTING_RULES.maxFotos} error={errors.fotos} />
          </div>
          <ChoiceGroup label="Estado de conservación" options={CONSERVACIONES} labels={CONSERVACION_LABEL} value={form.conservacion} onChange={(v) => set('conservacion', v)} error={errors.conservacion} />
        </>)}

        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field id="ltit" label="Nombre de la prenda" error={errors.titulo}>
              <input {...a11y('ltit', errors.titulo)} className={inputCls} value={form.titulo} maxLength={LISTING_RULES.tituloMax} onChange={(e) => set('titulo', e.target.value)} placeholder="Ej. Jean recto azul claro" /></Field></div>
            <Field id="lcat" label="Categoría" error={errors.categoria}>
              <select {...a11y('lcat', errors.categoria)} className={inputCls} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                <option value="">Elige una</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field id="ltal" label="Talla" error={errors.talla}>
              <select {...a11y('ltal', errors.talla)} className={inputCls} value={form.talla} onChange={(e) => set('talla', e.target.value)}>
                <option value="">Elige una</option>{TALLAS.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field id="lstyle" label="Estilo">
              <select id="lstyle" className={inputCls} value={form.style || 'CASUAL'} onChange={(e) => set('style', e.target.value as StyleEnum)}>
                {STYLES_ENUM.map((st) => <option key={st} value={st}>{STYLE_LABEL[st]}</option>)}</select></Field>
            <Field id="lloc" label="Localidad en Bogotá">
              <select id="lloc" className={inputCls} value={form.localidad || 'CHAPINERO'} onChange={(e) => set('localidad', e.target.value as LocalidadEnum)}>
                {LOCALIDADES_BOGOTA.map((loc) => <option key={loc.id} value={loc.id}>{loc.nombre}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field id="lmar" label="Marca" error={errors.marca}>
              <input {...a11y('lmar', errors.marca)} className={inputCls} value={form.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Ej. Levi’s" />
              <label className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]"><input type="checkbox" checked={form.marca === 'Sin marca'} onChange={(e) => set('marca', e.target.checked ? 'Sin marca' : '')} /> No tiene marca o no la sé</label>
            </Field></div>
            <div className="sm:col-span-2"><Field id="ldes" label="Descripción" error={errors.descripcion} hint={`${form.descripcion.trim().length}/${LISTING_RULES.descripcionMax} · Cuenta medidas, detalles o defectos.`}>
              <textarea {...a11y('ldes', errors.descripcion, true)} className={`${inputCls} min-h-28`} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></Field></div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
            {form.esDonacion ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  $0 COP — Donación benéfica (sin costo)
                </span>
                <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">Vitrina Abierta para Fundaciones</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Esta prenda se publicará con precio de $0 COP para que cualquier fundación aliada pueda solicitarla o recogerla de inmediato.
                </p>
              </div>
            ) : (
              <Field id="lpre" label="Precio en pesos colombianos (COP)" error={errors.precio} hint={`Entre ${formatCOP(LISTING_RULES.precioMin)} y ${formatCOP(LISTING_RULES.precioMax)}.`}>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-semibold">$</span>
                  <input {...a11y('lpre', errors.precio, true)} inputMode="numeric" className={`${inputCls} pl-8`} value={form.precio} onChange={(e) => set('precio', e.target.value)} placeholder="85.000" /></div>
              </Field>
            )}

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4" aria-label="Resumen de la publicación">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">Resumen</p>
              <div className="mt-3 flex gap-3">
                {form.fotos[0] && <img src={form.fotos[0].url} alt="" className="h-24 w-20 rounded-lg object-cover bg-[var(--color-surface)]" />}
                <div className="text-sm">
                  <p className="font-semibold text-[var(--color-text)]">{form.titulo || 'Sin nombre'}</p>
                  <p className="text-[var(--color-text-muted)]">{form.categoria} · Talla {form.talla} · {form.conservacion ? CONSERVACION_LABEL[form.conservacion] : ''}</p>
                  <p className="text-[var(--color-text-muted)]">{form.marca}</p>
                  <p className="mt-1 font-semibold text-[var(--color-text)]">
                    {form.esDonacion ? '$0 COP (Donación)' : priceValue(form.precio) > 0 ? formatCOP(priceValue(form.precio)) : '—'}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-xs text-[var(--color-text-muted)]">{form.descripcion}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">{form.fotos.length} foto{form.fotos.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        )}

        {sendError != null && (
          <p role="alert" className="flex items-center gap-2 rounded-xl border border-[var(--color-danger-border,#ff8a8a)] bg-[var(--color-danger-bg,rgba(220,38,38,0.12))] p-3 text-sm text-[var(--color-danger-text,#ff8a8a)] font-medium">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>No pudimos {editing ? 'guardar los cambios' : 'publicar tu prenda'}. {errorMessage(sendError)} Tus datos siguen aquí; puedes intentarlo de nuevo.</span>
          </p>
        )}

        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--color-border)] pt-5">
          {step > 0 ? (
            <button type="button" onClick={back} disabled={sending} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-5 py-3 text-sm font-semibold hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]">Atrás</button>
          ) : (
            <button type="button" onClick={() => navigate(-1)} className="rounded-xl px-5 py-3 text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">Cancelar</button>
          )}
          <button
            type="submit"
            disabled={sending}
            aria-label={step < 2 ? 'Continuar' : sending ? 'Enviando…' : editing ? 'Guardar cambios' : 'Publicar'}
            className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-6 py-3 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-60 transition-all shadow-sm"
          >
            {step < 2 ? 'Continuar' : sending ? 'Enviando…' : editing ? 'Guardar cambios' : form.esDonacion ? 'Publicar prenda en donación' : 'Publicar'}
          </button>
        </div>
      </form>
    </section>
  )
}
