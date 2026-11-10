import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { cerrarSesionYVolverAlInicio } from '@/modules/identidad/states/salida'
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

  const discard = () => {
    setDraft(info)
    setNotice('')
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
    <header className="store-info__store-head"><div className="store-info__identity"><span className="store-info__avatar">LS</span><div><h1>Luna Store</h1><p>TIENDA ALIADA · LUNA@STYLERADAR.CO · DESDE FEB 2026</p></div></div><div className="store-info__status"><div><strong>Verificada</strong><span>VERIFICACIÓN</span></div><div><strong>Activa</strong><span>SUSCRIPCIÓN</span></div></div></header>
    <div className="store-info__layout"><aside className="store-info__side"><Link className="is-current" to="/tienda/informacion">Información de la tienda</Link><Link to="/tienda/estadisticas">Estadísticas</Link><Link to="/tienda/suscripcion">Suscripción</Link><button type="button" onClick={cerrarSesionYVolverAlInicio}>↪ <span>Cerrar sesión</span></button></aside>
      <section className="store-info__main"><header className="store-info__heading"><h2>Información de la tienda</h2><p>Datos legales y de contacto de la tienda. StyleRadar los usa para<br className="store-info__wide-break" /> verificarla y facturar; no se muestran al público.</p></header>
        {notice && <p className="store-info__notice" role="status">{notice}</p>}
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
