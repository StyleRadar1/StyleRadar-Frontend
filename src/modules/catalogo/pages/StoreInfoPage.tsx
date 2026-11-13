import { useState, type FormEvent } from 'react'
import './StoreInfoPage.css'

type LegalStoreInfo = {
  legalName: string
  nit: string
  representative: string
  phone: string
  email: string
  payoutAccount: string
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

function readInfo(): LegalStoreInfo {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...INITIAL_INFO, ...JSON.parse(saved) as Partial<LegalStoreInfo> } : INITIAL_INFO
  } catch {
    return INITIAL_INFO
  }
}

export default function StoreInfoPage() {
  const [info, setInfo] = useState<LegalStoreInfo>(readInfo)
  const [draft, setDraft] = useState<LegalStoreInfo>(() => readInfo())
  const [notice, setNotice] = useState('')
  const [storePhoto, setStorePhoto] = useState<string>(() => {
    try {
      return localStorage.getItem(PHOTO_KEY) || DEFAULT_PHOTO
    } catch {
      return DEFAULT_PHOTO
    }
  })

  const discard = () => {
    setDraft(info)
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
    const next = { ...draft, legalName: draft.legalName.trim(), representative: draft.representative.trim(), nit: draft.nit.trim(), phone: draft.phone.trim(), payoutAccount: draft.payoutAccount.trim() }
    setInfo(next)
    setDraft(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* El formulario sigue usable si el navegador no permite almacenamiento. */ }
    setNotice('La información legal de la tienda se guardó.')
  }

  const update = (key: keyof LegalStoreInfo, value: string) => setDraft((current) => ({ ...current, [key]: value }))

  return <main className="store-info">
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
                <span>📷 Cambiar foto</span>
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

        <form className="store-info__form" onSubmit={save}>
          <label className="store-info__field store-info__field--wide"><span>Razón social</span><input value={draft.legalName} onChange={(event) => update('legalName', event.target.value)} autoComplete="organization" /></label>
          <label className="store-info__field"><span>NIT <button type="button" className="store-info__help" title="Número de identificación tributaria asociado a la tienda." aria-label="Ayuda sobre el NIT">?</button></span><input value={draft.nit} onChange={(event) => update('nit', event.target.value)} inputMode="numeric" /></label>
          <label className="store-info__field store-info__field--wide"><span>Representante legal</span><input value={draft.representative} onChange={(event) => update('representative', event.target.value)} autoComplete="name" /></label>
          <label className="store-info__field"><span>Teléfono</span><input value={draft.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" /></label>
          <label className="store-info__field store-info__field--wide"><span>Correo de la cuenta</span><input value={draft.email} readOnly aria-readonly="true" type="email" /></label>
          <label className="store-info__field"><span>Cuenta para pagos</span><input value={draft.payoutAccount} onChange={(event) => update('payoutAccount', event.target.value)} /></label>
          <div className="store-info__actions"><button type="button" className="store-info__button" onClick={discard}>Descartar</button><button type="submit" className="store-info__button store-info__button--primary">Guardar</button></div>
        </form>
      </section>
    </div>
  </main>
}
