import { useContext, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { env } from '@/configs/env'
import { StoreSuspendedBanner } from '@/modules/transacciones/components/StoreSuspendedBanner'
import { hasScenario } from '@/modules/core/api/mockScenario'
import { ErrorCard } from '@/modules/core/components/ErrorScene'
import { FieldError } from '@/modules/core/components/ErrorFeedback'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { storeSettingsService } from '../services/storeSettingsService'
import './StoreInfoPage.css'

type LegalStoreInfo = {
  legalName: string
  nit: string
  representative: string
  phone: string
  email: string
  payoutAccount: string
}

type FieldKey = keyof LegalStoreInfo

const FIELD_IDS: Record<FieldKey, string> = {
  legalName: 'store-legal-name',
  nit: 'store-nit',
  representative: 'store-rep',
  phone: 'store-phone',
  email: 'store-email',
  payoutAccount: 'store-payout',
}

function validateStoreLegalInfo(data: LegalStoreInfo): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {}
  if (!data.legalName.trim()) errors.legalName = 'Escribe la razón social o nombre de la tienda.'
  const nitDigits = data.nit.replace(/[\s.-]/g, '')
  if (!/^\d{8,12}$/.test(nitDigits)) errors.nit = 'El NIT debe tener entre 8 y 12 dígitos.'
  if (!data.representative.trim()) errors.representative = 'Escribe el nombre de la persona representante legal.'
  if (data.phone.replace(/\D/g, '').length < 7) errors.phone = 'Ingresa un teléfono válido (mínimo 7 dígitos).'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Ingresa un correo electrónico válido.'
  if (!data.payoutAccount.trim()) errors.payoutAccount = 'Indica la cuenta para recibir pagos.'
  return errors
}

const INITIAL_INFO: LegalStoreInfo = {
  legalName: 'Luna Store',
  nit: '901.482.337-1',
  representative: 'Daniela Luna',
  phone: '+57 601 555 0123',
  email: 'luna@styleradar.co',
  payoutAccount: 'Bancolombia ••• 4410',
}

const STORAGE_KEY = 'styleradar-store-legal-info'
const PHOTO_KEY = 'styleradar-store-photo'
const DEFAULT_PHOTO = '/img/sesion/rol-tienda.jpg'

function readInfo(fallbackName = '', fallbackEmail = ''): LegalStoreInfo {
  if (!env.useMocks) {
    return {
      legalName: fallbackName,
      nit: '',
      representative: fallbackName,
      phone: '',
      email: fallbackEmail,
      payoutAccount: '',
    }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...INITIAL_INFO, ...JSON.parse(saved) as Partial<LegalStoreInfo> } : INITIAL_INFO
  } catch {
    return INITIAL_INFO
  }
}

export default function StoreInfoPage() {
  const user = useContext(AuthContext)?.user ?? null
  const [searchParams] = useSearchParams()
  const [info, setInfo] = useState<LegalStoreInfo>(() => readInfo(user?.name ?? '', user?.email ?? ''))
  const [draft, setDraft] = useState<LegalStoreInfo>(() => readInfo(user?.name ?? '', user?.email ?? ''))
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [notice, setNotice] = useState('')
  const [storePhoto, setStorePhoto] = useState<string>(() => {
    try {
      return localStorage.getItem(PHOTO_KEY) || DEFAULT_PHOTO
    } catch {
      return DEFAULT_PHOTO
    }
  })

  useEffect(() => {
    if (env.useMocks || !user?.id) return
    let active = true
    storeSettingsService.getMyStore(String(user.id))
      .then((store) => {
        if (!active) return
        const loaded: LegalStoreInfo = {
          legalName: store.tradeName || user.name || '',
          nit: store.nit || '',
          representative: user.name || '',
          phone: store.phone || '',
          email: store.contactEmail || user.email || '',
          payoutAccount: '',
        }
        setInfo(loaded)
        setDraft(loaded)
      })
      .catch(() => {})
    return () => { active = false }
  }, [user?.id, user?.name, user?.email])

  const requestedStoreId = searchParams.get('tiendaId')
  const forbidden = (requestedStoreId !== null && requestedStoreId !== 't-1' && requestedStoreId !== String(user?.id ?? ''))
    || hasScenario('sin-permiso')
    || (user !== null && user.role !== 'STORE_ADMIN')

  if (forbidden) {
    return (
      <main className="store-info">
        <ErrorCard
          grande
          variant="etiqueta"
          tone="warn"
          chip="Sin acceso"
          title="No existe o no tienes acceso"
          description="Solo puedes administrar la información de tu propia tienda."
          actions={
            <Link className="store-info__button store-info__button--primary" to="/mi-tienda">
              Ir a mi tienda
            </Link>
          }
        />
      </main>
    )
  }

  const discard = () => {
    setDraft(info)
    setErrors({})
    setNotice('')
  }

  const handleCambiarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice('Por favor selecciona una imagen válida.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result
        setStorePhoto(dataUrl)
        try { localStorage.setItem(PHOTO_KEY, dataUrl) } catch {}
        setNotice('Foto de la tienda actualizada con éxito.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRestaurarFoto = () => {
    setStorePhoto(DEFAULT_PHOTO)
    try { localStorage.setItem(PHOTO_KEY, DEFAULT_PHOTO) } catch {}
    setNotice('Se restauró la foto predeterminada de la tienda.')
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice('')
    const next: LegalStoreInfo = {
      ...draft,
      legalName: draft.legalName.trim(),
      representative: draft.representative.trim(),
      nit: draft.nit.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      payoutAccount: draft.payoutAccount.trim(),
    }
    const nextErrors = validateStoreLegalInfo(next)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      const firstKey = (Object.keys(FIELD_IDS) as FieldKey[]).find((k) => nextErrors[k])
      if (firstKey) window.setTimeout(() => document.getElementById(FIELD_IDS[firstKey])?.focus(), 0)
      return
    }
    setErrors({})
    setInfo(next)
    setDraft(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* El formulario sigue usable si el navegador no permite almacenamiento. */ }
    setNotice('La información legal de la tienda se guardó.')
  }

  const update = (key: FieldKey, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  return <main className="store-info">
    <StoreSuspendedBanner />
    <div className="store-info__layout">
      <section className="store-info__main">
        <header className="store-info__heading">
          <h2>Información de la tienda</h2>
          <p>Datos legales, imagen y de contacto de la tienda. Gestiona cómo te ven tus clientes y tu radar local.</p>
        </header>

        {notice && <p className="store-info__notice" role="status">{notice}</p>}
        {/* ── Sección para cambiar la foto de la tienda ── */}
        <div className="store-info__photo-card">
          <div className="store-info__photo-preview">
            <img src={storePhoto} alt="Foto actual de la tienda" />
          </div>
          <div className="store-info__photo-info">
            <h3>Foto de la tienda</h3>
            <p>Se muestra en el radar de Bogotá, en el hero de tu panel y en tu perfil de tienda.</p>
            <div className="store-info__photo-actions">
              <label className="store-info__button store-info__button--primary cursor-pointer inline-flex items-center justify-center gap-2">
                <span>Cambiar foto</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handleCambiarFoto} />
              </label>
              {storePhoto !== DEFAULT_PHOTO && (
                <button type="button" className="store-info__button" onClick={handleRestaurarFoto}>
                  Restaurar original
                </button>
              )}
            </div>
          </div>
        </div>

        <form className="store-info__form" noValidate onSubmit={save}>
          <label className="store-info__field store-info__field--wide" htmlFor={FIELD_IDS.legalName}>
            <span>Razón social</span>
            <input id={FIELD_IDS.legalName} value={draft.legalName} onChange={(event) => update('legalName', event.target.value)} autoComplete="organization" aria-invalid={Boolean(errors.legalName)} aria-describedby={errors.legalName ? `${FIELD_IDS.legalName}-err` : undefined} />
            <FieldError id={`${FIELD_IDS.legalName}-err`} message={errors.legalName} />
          </label>
          <label className="store-info__field" htmlFor={FIELD_IDS.nit}>
            <span>NIT <button type="button" className="store-info__help" title="Número de identificación tributaria asociado a la tienda." aria-label="Ayuda sobre el NIT">?</button></span>
            <input id={FIELD_IDS.nit} value={draft.nit} onChange={(event) => update('nit', event.target.value)} inputMode="numeric" aria-invalid={Boolean(errors.nit)} aria-describedby={errors.nit ? `${FIELD_IDS.nit}-err` : undefined} />
            <FieldError id={`${FIELD_IDS.nit}-err`} message={errors.nit} />
          </label>
          <label className="store-info__field store-info__field--wide" htmlFor={FIELD_IDS.representative}>
            <span>Representante legal</span>
            <input id={FIELD_IDS.representative} value={draft.representative} onChange={(event) => update('representative', event.target.value)} autoComplete="name" aria-invalid={Boolean(errors.representative)} aria-describedby={errors.representative ? `${FIELD_IDS.representative}-err` : undefined} />
            <FieldError id={`${FIELD_IDS.representative}-err`} message={errors.representative} />
          </label>
          <label className="store-info__field" htmlFor={FIELD_IDS.phone}>
            <span>Teléfono</span>
            <input id={FIELD_IDS.phone} value={draft.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${FIELD_IDS.phone}-err` : undefined} />
            <FieldError id={`${FIELD_IDS.phone}-err`} message={errors.phone} />
          </label>
          <label className="store-info__field store-info__field--wide" htmlFor={FIELD_IDS.email}>
            <span>Correo de la cuenta</span>
            <input id={FIELD_IDS.email} value={draft.email} onChange={(event) => update('email', event.target.value)} type="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${FIELD_IDS.email}-err` : undefined} />
            <FieldError id={`${FIELD_IDS.email}-err`} message={errors.email} />
          </label>
          <label className="store-info__field" htmlFor={FIELD_IDS.payoutAccount}>
            <span>Cuenta para pagos</span>
            <input id={FIELD_IDS.payoutAccount} value={draft.payoutAccount} onChange={(event) => update('payoutAccount', event.target.value)} aria-invalid={Boolean(errors.payoutAccount)} aria-describedby={errors.payoutAccount ? `${FIELD_IDS.payoutAccount}-err` : undefined} />
            <FieldError id={`${FIELD_IDS.payoutAccount}-err`} message={errors.payoutAccount} />
          </label>
          <div className="store-info__actions"><button type="button" className="store-info__button" onClick={discard}>Descartar</button><button type="submit" className="store-info__button store-info__button--primary">Guardar</button></div>
        </form>
      </section>
    </div>
  </main>
}
