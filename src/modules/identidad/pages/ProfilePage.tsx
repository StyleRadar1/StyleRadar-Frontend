import { useState, type FormEvent } from 'react'
import { errorMessage } from '@/modules/core/api/errors'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { Button } from '@/modules/core/design-system'
import { Campo, Opciones } from '../components/Campo'
import { a11y, inputCls, labelCls } from '../utils/campo'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import {
  ESTILOS, MANIQUI_LABEL, MAX_ESTILOS, PLAN_LABEL, TALLAS_CALZADO, TALLAS_INFERIOR, TALLAS_SUPERIOR,
  type ActualizarPerfilDto, type Estilo, type Maniqui, type PerfilDto, type TallasDto,
} from '../types/usuario.dto'
import { celularValido, iniciales, mesAnio } from '../utils/formato'

/** RF-03 a RF-06: datos de la persona, tallas por tipo de prenda y estilos favoritos. */
export default function ProfilePage() {
  const { profile, loading, error, reload, save } = useProfile()
  // El aviso vive aquí porque el formulario se vuelve a montar después de guardar.
  const [aviso, setAviso] = useState<Aviso | null>(null)

  if (loading && !profile) return <section className="mx-auto max-w-6xl px-4 py-12"><Loading label="Cargando tu perfil…" /></section>
  if (error || !profile) return <section className="mx-auto max-w-6xl px-4 py-12"><ErrorState error={error} onRetry={reload} title="No pudimos cargar tu perfil" /></section>

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <header className="flex flex-wrap items-center gap-5 border-b border-white/10 pb-8">
        <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-violeta text-3xl font-extrabold text-blanco md:h-24 md:w-24 md:text-4xl">{iniciales(profile.nombre)}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-arena">Mi perfil</p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Hola, {profile.nombre.split(' ')[0]}</h1>
          <p className="mt-2 break-words text-xs font-semibold uppercase tracking-[.14em] text-white/65">
            {[profile.correo, profile.barrio && `Bogotá, ${profile.barrio}`, `Miembro desde ${mesAnio(profile.miembroDesde)}`, `Plan ${PLAN_LABEL[profile.plan]}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>
      {/* La key reinicia el formulario cuando llegan datos nuevos del servidor. */}
      <ProfileForm key={JSON.stringify(profile)} profile={profile} onSave={save} aviso={aviso} setAviso={setAviso} />
    </section>
  )
}

type Aviso = { ok: boolean; text: string }
type Errores = Partial<Record<'nombre' | 'celular' | 'estilos', string>>

function ProfileForm({ profile, onSave, aviso, setAviso }: {
  profile: PerfilDto; onSave: (b: ActualizarPerfilDto) => Promise<PerfilDto>; aviso: Aviso | null; setAviso: (a: Aviso | null) => void
}) {
  const { updateUser } = useAuth()
  const [nombre, setNombre] = useState(profile.nombre)
  const [celular, setCelular] = useState(profile.celular)
  const [barrio, setBarrio] = useState(profile.barrio)
  const [maniqui, setManiqui] = useState<Maniqui>(profile.maniqui)
  const [tallas, setTallas] = useState<TallasDto>(profile.tallas)
  const [estilos, setEstilos] = useState<Estilo[]>(profile.estilos)
  const [errores, setErrores] = useState<Errores>({})
  const [saving, setSaving] = useState(false)

  const setTalla = <K extends keyof TallasDto>(k: K, v: TallasDto[K]) => setTallas((t) => ({ ...t, [k]: v }))

  const toggleEstilo = (s: Estilo) => {
    if (estilos.includes(s)) { setEstilos(estilos.filter((x) => x !== s)); setErrores((e) => ({ ...e, estilos: undefined })); return }
    if (estilos.length >= MAX_ESTILOS) { setErrores((e) => ({ ...e, estilos: `Puedes elegir hasta ${MAX_ESTILOS} estilos. Quita uno para agregar otro.` })); return }
    setEstilos([...estilos, s]); setErrores((e) => ({ ...e, estilos: undefined }))
  }

  const validar = (): Errores => {
    const e: Errores = {}
    if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo (mínimo 3 letras).'
    if (celular.trim() && !celularValido(celular)) e.celular = 'Escribe un celular de 10 dígitos que empiece por 3, por ejemplo +57 310 555 0142.'
    if (!estilos.length) e.estilos = 'Elige al menos un estilo.'
    return e
  }

  const descartar = () => {
    setNombre(profile.nombre); setCelular(profile.celular); setBarrio(profile.barrio)
    setManiqui(profile.maniqui); setTallas(profile.tallas); setEstilos(profile.estilos)
    setErrores({}); setAviso({ ok: true, text: 'Cambios descartados.' })
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validar(); setErrores(e); setAviso(null)
    if (Object.keys(e).length) {
      document.getElementById(e.nombre ? 'pf-nombre' : e.celular ? 'pf-celular' : 'pf-estilos')?.focus()
      return
    }
    setSaving(true)
    try {
      const upd = await onSave({ nombre: nombre.trim(), celular: celular.trim(), barrio: barrio.trim(), maniqui, tallas, estilos })
      updateUser({ name: upd.nombre })
      setAviso({ ok: true, text: 'Cambios guardados.' })
    } catch (err) {
      setAviso({ ok: false, text: errorMessage(err, 'No se pudieron guardar los cambios.') })
    } finally {
      setSaving(false)
    }
  }

  const mensaje = aviso

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10" aria-labelledby="pf-titulo">
      <h2 id="pf-titulo" className="text-3xl font-extrabold tracking-tight md:text-4xl">Mi información</h2>
      <p className="mt-2 max-w-xl text-sm text-white/70">Tus tallas se usan para mostrarte primero lo que hay disponible para ti en cada tienda.</p>

      {mensaje && (
        <p role={mensaje.ok ? 'status' : 'alert'}
          className={`mt-6 rounded-xl p-3 text-sm ${mensaje.ok ? 'bg-[var(--sr-ok,#9be3b4)]/10 text-[var(--sr-ok,#9be3b4)]' : 'bg-[var(--sr-bad,#ff8a8a)]/10 text-[var(--sr-bad,#ffb4b4)]'}`}>{mensaje.text}</p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Campo id="pf-nombre" label="Nombre completo" error={errores.nombre} className="md:col-span-2">
          <input {...a11y('pf-nombre', errores.nombre)} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={60} className={inputCls} />
        </Campo>
        <Campo id="pf-celular" label="Celular" error={errores.celular}>
          <input {...a11y('pf-celular', errores.celular)} value={celular} onChange={(e) => setCelular(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+57 300 000 0000" className={inputCls} />
        </Campo>
        <Campo id="pf-correo" label="Correo" hint="Para cambiar tu correo escríbenos a soporte." className="md:col-span-2">
          <input {...a11y('pf-correo', undefined, true)} value={profile.correo} disabled className={inputCls} />
        </Campo>
        <Campo id="pf-barrio" label="Barrio">
          <input id="pf-barrio" value={barrio} onChange={(e) => setBarrio(e.target.value)} placeholder="Ej. Chapinero" maxLength={40} className={inputCls} />
        </Campo>

        <div>
          <Opciones label="Maniquí del probador" options={['MUJER', 'HOMBRE'] as const} value={maniqui} onChange={setManiqui} labels={MANIQUI_LABEL} />
          <p className="mt-1.5 text-xs text-white/60">El probador usa un maniquí de mujer o de hombre según lo que elijas.</p>
        </div>
        <Campo id="pf-superior" label="Talla superior">
          <select id="pf-superior" value={tallas.superior} onChange={(e) => setTalla('superior', e.target.value as TallasDto['superior'])} className={inputCls}>
            {TALLAS_SUPERIOR.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo id="pf-inferior" label="Talla inferior">
          <select id="pf-inferior" value={tallas.inferior} onChange={(e) => setTalla('inferior', e.target.value as TallasDto['inferior'])} className={inputCls}>
            {TALLAS_INFERIOR.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo id="pf-calzado" label="Calzado">
          <select id="pf-calzado" value={tallas.calzado} onChange={(e) => setTalla('calzado', e.target.value as TallasDto['calzado'])} className={inputCls}>
            {TALLAS_CALZADO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Campo>

        <fieldset className="md:col-span-3">
          <legend className={labelCls}>Estilos que más te gustan</legend>
          <p id="pf-estilos-hint" className="mt-1 text-xs text-white/60">Elige de 1 a {MAX_ESTILOS}. Los usamos para ordenar el catálogo y recomendarte playlists.</p>
          <div id="pf-estilos" tabIndex={-1} role="group" aria-label="Estilos" aria-describedby={errores.estilos ? 'pf-estilos-err' : 'pf-estilos-hint'} className="mt-2 flex flex-wrap gap-2 outline-none">
            {ESTILOS.map((s) => (
              <button key={s} type="button" aria-pressed={estilos.includes(s)} onClick={() => toggleEstilo(s)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${estilos.includes(s) ? 'border-arena bg-arena text-grafito' : 'border-white/20 hover:bg-white/10'}`}>
                {estilos.includes(s) && <span aria-hidden="true">✓ </span>}{s}
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
    </form>
  )
}
