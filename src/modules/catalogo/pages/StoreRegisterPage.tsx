import { useContext, useEffect, useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { env } from '@/configs/env'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ErrorBanner, FieldError } from '@/modules/core/components/ErrorFeedback'
import { Loading } from '@/modules/core/components/Status'
import { AuthContext } from '@/modules/identidad/states/authContext'
import {
  cuerpoRegistro, errorDeRut, erroresRegistroTienda, erroresServidorRegistro, storeRegistrationService, TEXTOS_REGISTRO,
  type StoreRegisterErrors, type StoreRegisterForm,
} from '../services/storeRegistrationService'
import { storeSettingsService } from '../services/storeSettingsService'
import {
  STORE_CATEGORIES, STORE_CATEGORY_TEXT, STORE_REGISTER_LIMITS, VERIFICATION_LABEL,
  type StoreCategory, type StoreResponseDto,
} from '../types/store.dto'
import './StoreInfoPage.css'

const VACIO: StoreRegisterForm = { nit: '', tradeName: '', description: '', phone: '', contactEmail: '', latitude: '', longitude: '', categories: [] }
const ORDEN: (keyof StoreRegisterErrors)[] = ['nit', 'tradeName', 'contactEmail', 'phone', 'description', 'latitude', 'longitude', 'categories', 'rut']

/**
 * F-21 · Registrar mi tienda: datos legales y RUT en PDF.
 * Primero sube el RUT (POST /api/v1/stores/documents/rut) y con su URL registra el almacén (POST /api/v1/stores).
 * El almacén queda PENDING hasta que el administrador lo verifique (SR-RF-62).
 */
export default function StoreRegisterPage() {
  const user = useContext(AuthContext)?.user ?? null
  const userId = user?.id ? String(user.id) : ''
  const uid = useId()
  const idDe = (campo: string) => `${uid}-${campo}`

  const [form, setForm] = useState<StoreRegisterForm>(VACIO)
  const [rut, setRut] = useState<File | null>(null)
  /** URL del RUT ya subido, para no volver a subirlo si el registro falla por otro dato. */
  const [rutSubido, setRutSubido] = useState<{ file: File; url: string } | null>(null)
  const [errors, setErrors] = useState<StoreRegisterErrors>({})
  const [general, setGeneral] = useState('')
  const [busy, setBusy] = useState(false)
  const [registrado, setRegistrado] = useState<StoreResponseDto | null>(null)
  const [revisando, setRevisando] = useState(!env.useMocks && !!userId)

  // Si la cuenta ya tiene almacén, no se registra otro (ms-tiendas responde 409).
  useEffect(() => {
    if (env.useMocks || !userId) return
    let active = true
    storeSettingsService.getMyStore(userId)
      .then((s) => { if (active) setRegistrado(s) })
      .catch(() => { /* 404: todavía no tiene almacén; otro error: se intenta registrar y el back decide. */ })
      .finally(() => { if (active) setRevisando(false) })
    return () => { active = false }
  }, [userId])

  if (revisando) return <main className="store-info"><Loading label="Revisando si ya tienes un almacén…" /></main>

  if (registrado) {
    const estado = registrado.verificationStatus ?? 'PENDING'
    return (
      <main className="store-info">
        <div className="store-info__layout">
          <header className="store-info__heading">
            <h2>{registrado.tradeName || 'Tu almacén'}</h2>
            <p>NIT {registrado.nit} · Estado: {VERIFICATION_LABEL[estado]}</p>
          </header>
          <p className="store-info__notice mt-6" role="status">
            {estado === 'PENDING' ? TEXTOS_REGISTRO.enviado : 'Tu cuenta ya tiene un almacén registrado.'}
          </p>
          <div className="mt-6 flex gap-3">
            <Link className="store-info__button store-info__button--primary inline-flex items-center justify-center" to="/mi-tienda">Ir a mi tienda</Link>
          </div>
        </div>
      </main>
    )
  }

  const cambiar = (campo: keyof StoreRegisterForm, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrors((e) => ({ ...e, [campo]: undefined }))
  }
  const alternarCategoria = (c: StoreCategory) => {
    setForm((f) => ({ ...f, categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c] }))
    setErrors((e) => ({ ...e, categories: undefined }))
  }
  const elegirRut = (file: File | null) => {
    setRut(file)
    setErrors((e) => ({ ...e, rut: file ? errorDeRut(file) || undefined : undefined }))
  }
  const enfocar = (e: StoreRegisterErrors) => {
    const primero = ORDEN.find((k) => e[k])
    if (primero) window.setTimeout(() => document.getElementById(idDe(primero))?.focus(), 0)
  }

  const enviar = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (busy) return
    setGeneral('')
    const e = erroresRegistroTienda(form, rut)
    if (Object.keys(e).length) { setErrors(e); enfocar(e); return }
    setErrors({})
    setBusy(true)
    try {
      let url = rutSubido && rutSubido.file === rut ? rutSubido.url : ''
      if (!url) {
        url = await storeRegistrationService.uploadRut(rut as File)
        if (!url) throw new Error('sin url')
        setRutSubido({ file: rut as File, url })
      }
      setRegistrado(await storeRegistrationService.register(cuerpoRegistro(form, url)))
    } catch (err) {
      const campos = erroresServidorRegistro(err)
      const { userId: yaTiene, ...resto } = campos as StoreRegisterErrors & { userId?: string }
      if (yaTiene) { setGeneral(TEXTOS_REGISTRO.yaTieneAlmacen); return }
      if (Object.keys(resto).length) { setErrors(resto); enfocar(resto); return }
      if (errorKind(err) === 'datos') { setErrors({ rut: TEXTOS_REGISTRO.rut }); enfocar({ rut: 'x' }); return }
      setGeneral(errorMessage(err, 'No pudimos registrar tu almacén. Intenta de nuevo.'))
    } finally { setBusy(false) }
  }

  const campo = (k: keyof StoreRegisterForm & string, label: string, props: { wide?: boolean; type?: string; inputMode?: 'numeric' | 'decimal' | 'tel' | 'email'; maxLength?: number; placeholder?: string } = {}) => (
    <label className={`store-info__field${props.wide ? ' store-info__field--wide' : ''}`} htmlFor={idDe(k)}>
      <span>{label}</span>
      <input id={idDe(k)} value={String(form[k])} onChange={(e) => cambiar(k, e.target.value)} type={props.type ?? 'text'}
        inputMode={props.inputMode} maxLength={props.maxLength} placeholder={props.placeholder}
        aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${idDe(k)}-err` : undefined} />
      <FieldError id={`${idDe(k)}-err`} message={errors[k]} />
    </label>
  )

  return (
    <main className="store-info">
      <div className="store-info__layout">
        <header className="store-info__heading">
          <h2>Registrar mi tienda</h2>
          <p>Con estos datos y el RUT verificamos tu almacén. Mientras lo revisamos, queda en estado pendiente.</p>
        </header>

        {general && <ErrorBanner className="mt-6" tone="warn" icon="info" title={general} />}

        <form className="store-info__form" noValidate onSubmit={enviar}>
          {campo('tradeName', 'Nombre comercial', { wide: true, maxLength: STORE_REGISTER_LIMITS.tradeNameMax })}
          {campo('nit', 'NIT', { inputMode: 'numeric', placeholder: '900123456-1' })}
          {campo('contactEmail', 'Correo de contacto', { wide: true, type: 'email', inputMode: 'email' })}
          {campo('phone', 'Teléfono (opcional)', { inputMode: 'tel', maxLength: STORE_REGISTER_LIMITS.phone })}
          {campo('description', 'Descripción (opcional)', { wide: true, maxLength: STORE_REGISTER_LIMITS.description })}
          <div />
          {campo('latitude', 'Latitud (opcional)', { inputMode: 'decimal', placeholder: '4.6533' })}
          {campo('longitude', 'Longitud (opcional)', { inputMode: 'decimal', placeholder: '-74.0836' })}

          <fieldset className="store-info__field store-info__field--wide" aria-describedby={errors.categories ? `${idDe('categories')}-err` : undefined}>
            <legend className="mb-2 text-[12px] font-extrabold uppercase tracking-[.14em] text-[var(--color-text-muted,#b9b9ca)]">Categorías</legend>
            <div className="flex flex-wrap gap-2" id={idDe('categories')} tabIndex={-1}>
              {STORE_CATEGORIES.map((c) => (
                <label key={c} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]">
                  <input type="checkbox" checked={form.categories.includes(c)} onChange={() => alternarCategoria(c)} />
                  {STORE_CATEGORY_TEXT[c]}
                </label>
              ))}
            </div>
            <FieldError id={`${idDe('categories')}-err`} message={errors.categories} />
          </fieldset>

          <label className="store-info__field store-info__field--wide" htmlFor={idDe('rut')}>
            <span>RUT en PDF (máximo 5 MB)</span>
            <input id={idDe('rut')} type="file" accept="application/pdf,.pdf" onChange={(e) => elegirRut(e.target.files?.[0] ?? null)}
              aria-invalid={Boolean(errors.rut)} aria-describedby={errors.rut ? `${idDe('rut')}-err` : undefined} />
            <FieldError id={`${idDe('rut')}-err`} message={errors.rut} />
          </label>

          <div className="store-info__actions">
            <button type="submit" disabled={busy} className="store-info__button store-info__button--primary disabled:opacity-60">
              {busy ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
