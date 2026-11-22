import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { Button } from '@/modules/core/design-system'
import { BuyerRenewalStatusCard } from '@/modules/transacciones/components/BuyerRenewalStatusCard'
import { PlanDegradedBanner } from '@/modules/transacciones/components/PlanDegradedBanner'
import { BuyerPaymentsSection } from '@/modules/transacciones/pages/BuyerPaymentsPage'
import { Campo, Opciones } from '../components/Campo'
import { a11y, inputCls, labelCls } from '../utils/campo'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import {
  GARMENT_LABEL, GARMENT_TYPES, MANIQUI_LABEL, MAX_ESTILOS, MIN_ESTILOS, PLAN_LABEL, SIZES_BY_TYPE, STYLES, STYLE_LABEL,
  type ActualizarPerfilDto, type GarmentType, type Maniqui, type PerfilDto, type SizesByGarmentType, type StyleCode,
} from '../types/usuario.dto'
import { NAME_MAX, NAME_MIN, NEIGHBORHOOD_MAX } from '../types/auth.dto'
import { BodyMeasurementsWizardModal } from '@/modules/experiencia/components/BodyMeasurementsWizardModal'
import {
  clearBodyMeasurements,
  exportBodyMeasurementsJson,
  getBodyMeasurements,
  saveBodyMeasurements,
} from '@/modules/experiencia/utils/bodyMeasurementsEngine'
import type { BodyMeasurements } from '@/modules/experiencia/types/bodyMeasurements.dto'
import { iniciales, mesAnio, telefonoValido } from '../utils/formato'
import { ORDEN, TEXTOS_PERFIL, erroresDelServidor, type Errores } from '../utils/erroresPerfil'

/**
 * SR-RF-03 y SR-RF-04 más el anexo D15 de ms-usuarios: datos de la persona (GET y PUT /users/{id}),
 * estilos (PUT /users/{id}/style-preferences) y tallas por tipo de prenda (PUT /users/{id}/sizes).
 */
export default function ProfilePage() {
  const { profile, loading, error, reload, save } = useProfile()
  // El aviso vive aquí porque el formulario se vuelve a montar después de guardar.
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [tab, setTab] = useState<'info' | 'pagos'>('info')

  if (loading && !profile) return <section className="mx-auto max-w-6xl px-4 py-12"><Loading label="Cargando tu perfil…" /></section>
  if (error || !profile) return <section className="mx-auto max-w-6xl px-4 py-12"><ErrorState error={error} onRetry={reload} title="No pudimos cargar tu perfil" /></section>

  return (
    <div className="sr-perfil-page min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <PlanDegradedBanner />
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-[var(--color-border)] pb-8">
        <div className="flex flex-wrap items-center gap-5">
          <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-violeta text-3xl font-extrabold text-white md:h-24 md:w-24 md:text-4xl">{iniciales(profile.name)}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">Mi perfil</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text)] md:text-6xl">Hola, {profile.name.split(' ')[0]}</h1>
            <p className="mt-2 break-words text-xs font-semibold uppercase tracking-[.14em] text-[var(--color-text-muted)]">
              {[profile.email, profile.neighborhood && `Bogotá, ${profile.neighborhood}`, profile.registeredAt && `Miembro desde ${mesAnio(profile.registeredAt)}`, profile.plan && `Plan ${PLAN_LABEL[profile.plan]}`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Secciones de mi perfil">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'info'}
            onClick={() => setTab('info')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === 'info'
                ? 'bg-violeta text-white'
                : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]'
            }`}
          >
            Mi información
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pagos'}
            onClick={() => setTab('pagos')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === 'pagos'
                ? 'bg-violeta text-white'
                : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]'
            }`}
          >
            Ver pagos aquí
          </button>
          <Link
            to="/perfil/pagos"
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
          >
            Historial de pagos
          </Link>
        </div>
      </header>
      <BuyerRenewalStatusCard />
      {tab === 'pagos' ? (
        <div className="mt-10">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight">Historial de pagos</h2>
          <BuyerPaymentsSection />
        </div>
      ) : (
        /* La key reinicia el formulario cuando llegan datos nuevos del servidor. */
        <ProfileForm key={JSON.stringify(profile)} profile={profile} onSave={save} aviso={aviso} setAviso={setAviso} />
      )}
      </section>
    </div>
  )
}

type Aviso = { ok: boolean; text: string }
const enfocar = (e: Errores) => {
  const primero = ORDEN.find((c) => e[c])
  if (primero) document.getElementById(`pf-${primero}`)?.focus()
}

function ProfileForm({ profile, onSave, aviso, setAviso }: {
  profile: PerfilDto; onSave: (b: ActualizarPerfilDto) => Promise<PerfilDto>; aviso: Aviso | null; setAviso: (a: Aviso | null) => void
}) {
  const { updateUser } = useAuth()
  const [nombre, setNombre] = useState(profile.name)
  const [celular, setCelular] = useState(profile.phone)
  const [barrio, setBarrio] = useState(profile.neighborhood)
  const [maniqui, setManiqui] = useState<Maniqui>(profile.maniqui)
  const [tallas, setTallas] = useState<SizesByGarmentType>(profile.sizesByGarmentType)
  const [estilos, setEstilos] = useState<StyleCode[]>(profile.stylePreferences)
  const [errores, setErrores] = useState<Errores>({})
  const [saving, setSaving] = useState(false)

  // Medidas anatómicas para el probador virtual vinculadas al perfil
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements | null>(() => getBodyMeasurements(profile.id))
  const [showWizard, setShowWizard] = useState(false)

  const handleClearMeasurements = () => {
    clearBodyMeasurements(profile.id)
    setBodyMeasurements(null)
    setAviso({ ok: true, text: 'Medidas anatómicas del probador restablecidas.' })
  }

  const handleExportMeasurements = () => {
    exportBodyMeasurementsJson()
    setAviso({ ok: true, text: 'Datos de medidas corporales exportados exitosamente.' })
  }

  /** SR-RF-04: varias tallas por tipo de prenda; se marcan y desmarcan. */
  const toggleTalla = (tipo: GarmentType, talla: string) => {
    setTallas((t) => {
      const actuales = t[tipo] ?? []
      const siguientes = actuales.includes(talla) ? actuales.filter((x) => x !== talla) : [...actuales, talla]
      // Se guardan en el orden de la lista (XS antes que S, 34 antes que 35).
      return { ...t, [tipo]: SIZES_BY_TYPE[tipo].filter((x) => siguientes.includes(x)) }
    })
    setErrores((e) => ({ ...e, tallas: undefined }))
  }

  const toggleEstilo = (s: StyleCode) => {
    if (estilos.includes(s)) { setEstilos(estilos.filter((x) => x !== s)); setErrores((e) => ({ ...e, estilos: undefined })); return }
    if (estilos.length >= MAX_ESTILOS) { setErrores((e) => ({ ...e, estilos: `Puedes elegir hasta ${MAX_ESTILOS} estilos. Quita uno para agregar otro.` })); return }
    setEstilos([...estilos, s]); setErrores((e) => ({ ...e, estilos: undefined }))
  }

  const validar = (): Errores => {
    const e: Errores = {}
    const n = nombre.trim().length
    if (n < NAME_MIN || n > NAME_MAX) e.nombre = `Escribe tu nombre completo (de ${NAME_MIN} a ${NAME_MAX} caracteres).`
    if (celular.trim() && !telefonoValido(celular)) e.celular = 'Escribe un teléfono de 7 a 20 caracteres, por ejemplo +57 310 555 0142.'
    if (barrio.trim().length > NEIGHBORHOOD_MAX) e.barrio = `El barrio no puede superar ${NEIGHBORHOOD_MAX} caracteres.`
    if (estilos.length < MIN_ESTILOS) e.estilos = 'Elige al menos un estilo.'
    return e
  }

  const descartar = () => {
    setNombre(profile.name); setCelular(profile.phone); setBarrio(profile.neighborhood)
    setManiqui(profile.maniqui); setTallas(profile.sizesByGarmentType); setEstilos(profile.stylePreferences)
    setErrores({}); setAviso({ ok: true, text: 'Cambios descartados.' })
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validar(); setErrores(e); setAviso(null)
    if (Object.keys(e).length) { enfocar(e); return }
    setSaving(true)
    try {
      const upd = await onSave({
        name: nombre.trim(), phone: celular.trim(), neighborhood: barrio.trim(), maniqui,
        stylePreferences: estilos, sizesByGarmentType: tallas,
      })
      updateUser({ name: upd.name })
      setAviso({ ok: true, text: 'Cambios guardados.' })
    } catch (err) {
      // 400: los datos quedan como la persona los escribió (el formulario no se reinicia).
      if (errorKind(err) === 'datos') {
        const delServidor = erroresDelServidor(fieldErrors(err))
        const hay = Object.keys(delServidor).length > 0
        setErrores(delServidor)
        setAviso({ ok: false, text: hay ? TEXTOS_PERFIL.campos : TEXTOS_PERFIL.general })
        if (hay) enfocar(delServidor)
        return
      }
      setAviso({ ok: false, text: errorMessage(err, 'No se pudieron guardar los cambios.') })
    } finally {
      setSaving(false)
    }
  }

  const mensaje = aviso

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10" aria-labelledby="pf-titulo">
      <h2 id="pf-titulo" className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">Mi información</h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">Tus tallas se usan para mostrarte primero lo que hay disponible para ti en cada tienda.</p>

      {mensaje && (
        <p role={mensaje.ok ? 'status' : 'alert'}
          className={`mt-6 rounded-xl p-3 text-sm ${mensaje.ok ? 'bg-[var(--sr-ok,#9be3b4)]/10 text-[var(--sr-ok,#9be3b4)]' : 'bg-[var(--sr-bad,#ff8a8a)]/10 text-[var(--sr-bad,#ffb4b4)]'}`}>{mensaje.text}</p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Campo id="pf-nombre" label="Nombre completo" error={errores.nombre} className="md:col-span-2">
          <input {...a11y('pf-nombre', errores.nombre)} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={NAME_MAX} className={inputCls} />
        </Campo>
        <Campo id="pf-celular" label="Teléfono" error={errores.celular}>
          <input {...a11y('pf-celular', errores.celular)} value={celular} onChange={(e) => setCelular(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+57 300 000 0000" maxLength={20} className={inputCls} />
        </Campo>
        <Campo id="pf-correo" label="Correo" hint="Para cambiar tu correo escríbenos a soporte." className="md:col-span-2">
          <input {...a11y('pf-correo', undefined, true)} value={profile.email} disabled className={inputCls} />
        </Campo>
        <Campo id="pf-barrio" label="Barrio" error={errores.barrio}>
          <input {...a11y('pf-barrio', errores.barrio)} value={barrio} onChange={(e) => setBarrio(e.target.value)} placeholder="Ej. Chapinero" maxLength={NEIGHBORHOOD_MAX} className={inputCls} />
        </Campo>

        <div>
          <Opciones label="Maniquí del probador" options={['MUJER', 'HOMBRE'] as const} value={maniqui} onChange={setManiqui} labels={MANIQUI_LABEL} />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">El probador usa un maniquí de mujer o de hombre según lo que elijas.</p>
        </div>
        <fieldset className="md:col-span-3">
          <legend className={labelCls}>Tus tallas</legend>
          <p id="pf-tallas-hint" className="mt-1 text-xs text-white/60">Marca una o varias por tipo de prenda. Puedes dejar un tipo sin tallas.</p>
          <div id="pf-tallas" tabIndex={-1} aria-describedby={errores.tallas ? 'pf-tallas-err' : 'pf-tallas-hint'} className="mt-2 grid gap-4 outline-none">
            {GARMENT_TYPES.map((tipo) => (
              <div key={tipo} role="group" aria-label={GARMENT_LABEL[tipo]}>
                <p className="text-xs font-semibold text-white/80">{GARMENT_LABEL[tipo]}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {SIZES_BY_TYPE[tipo].map((talla) => {
                    const on = (tallas[tipo] ?? []).includes(talla)
                    return (
                      <button key={talla} type="button" aria-pressed={on} aria-label={`${GARMENT_LABEL[tipo]} ${talla}`} onClick={() => toggleTalla(tipo, talla)}
                        className={`min-w-11 rounded-full border px-3 py-1.5 text-sm font-semibold ${on ? 'border-arena bg-arena text-grafito' : 'border-white/20 hover:bg-white/10'}`}>
                        {talla}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {errores.tallas && <p id="pf-tallas-err" role="alert" className="mt-1.5 text-xs text-[var(--sr-bad,#ffb4b4)]">{errores.tallas}</p>}
        </fieldset>

        {/* ═══════════════════════════════════════════════════════════
            SECCIÓN: MEDIDAS CORPORALES PARA EL PROBADOR VIRTUAL
            ═══════════════════════════════════════════════════════════ */}
        <div className="md:col-span-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">
                Probador Virtual StyleRadar
              </span>
              <h3 className="text-xl font-extrabold tracking-tight text-[var(--color-text)] mt-0.5">
                Mis medidas corporales
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-900/20 hover:bg-purple-500 transition cursor-pointer"
              >
                {bodyMeasurements ? 'Modificar medidas del probador' : 'Configurar medidas del probador'}
              </button>
              {bodyMeasurements && (
                <button
                  type="button"
                  onClick={handleExportMeasurements}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-accent)] transition cursor-pointer"
                  title="Descargar mis datos corporales en JSON (Ley 1581)"
                >
                  📥 Descargar datos
                </button>
              )}
            </div>
          </div>

          {bodyMeasurements ? (
            <div className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Estatura:</span>
                  <strong className="text-base text-[var(--color-text)] font-extrabold">
                    {(bodyMeasurements.estatura / 100).toFixed(2).replace('.', ',')} m
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Pecho / Busto:</span>
                  <strong className="text-base text-[var(--color-accent)] font-extrabold">
                    {bodyMeasurements.pecho} cm
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Cintura:</span>
                  <strong className="text-base text-[var(--color-accent)] font-extrabold">
                    {bodyMeasurements.cintura} cm
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Cadera:</span>
                  <strong className="text-base text-[var(--color-accent)] font-extrabold">
                    {bodyMeasurements.cadera} cm
                  </strong>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-border)]">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Silueta: <strong className="text-[var(--color-text)] capitalize">{bodyMeasurements.cuerpoBase}</strong></span>
                  <span>·</span>
                  <span>Talla habitual: <strong className="text-[var(--color-text)]">{bodyMeasurements.tallaHabitual}</strong></span>
                  {bodyMeasurements.esAproximado && (
                    <>
                      <span>·</span>
                      <span className="text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        Estimación aproximada
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearMeasurements}
                  className="text-[11px] text-[var(--color-text-muted)] hover:text-rose-500 underline transition cursor-pointer"
                >
                  Restablecer medidas
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--color-surface-subtle)] text-xs text-[var(--color-text-muted)]">
              <p>
                Aún no has configurado tus medidas anatómicas. Configúralas para que el maniquí del probador se adapte a tu cuerpo real.
              </p>
            </div>
          )}
        </div>

        <fieldset className="md:col-span-3">
          <legend className={labelCls}>Estilos que más te gustan</legend>
          <p id="pf-estilos-hint" className="mt-1 text-xs text-[var(--color-text-muted)]">Elige de {MIN_ESTILOS} a {MAX_ESTILOS}. Los usamos para ordenar el catálogo y recomendarte playlists.</p>
          <div id="pf-estilos" tabIndex={-1} role="group" aria-label="Estilos" aria-describedby={errores.estilos ? 'pf-estilos-err' : 'pf-estilos-hint'} className="mt-2 flex flex-wrap gap-2 outline-none">
            {STYLES.map((s) => (
              <button key={s} type="button" aria-pressed={estilos.includes(s)} onClick={() => toggleEstilo(s)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${estilos.includes(s) ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]/70 text-[var(--color-text)] hover:border-[var(--color-accent)]'}`}>
                {estilos.includes(s) && <span aria-hidden="true">✓ </span>}{STYLE_LABEL[s]}
              </button>
            ))}
          </div>
          {errores.estilos && <p id="pf-estilos-err" role="alert" className="mt-1.5 text-xs text-[var(--sr-bad,#ffb4b4)]">{errores.estilos}</p>}
        </fieldset>
      </div>

      <div className="mt-8 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secundario" onClick={descartar} disabled={saving}>Descartar cambios</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
      </div>

      {showWizard && (
        <BodyMeasurementsWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onSave={(m, persist) => {
            saveBodyMeasurements(m, persist, profile.id)
            setBodyMeasurements(m)
            setShowWizard(false)
            if (m.cuerpoBase === 'femenino' && maniqui !== 'MUJER') setManiqui('MUJER')
            if (m.cuerpoBase === 'masculino' && maniqui !== 'HOMBRE') setManiqui('HOMBRE')
            setAviso({ ok: true, text: 'Medidas corporales para el probador actualizadas exitosamente.' })
          }}
          initialMeasurements={bodyMeasurements}
        />
      )}
    </form>
  )
}
