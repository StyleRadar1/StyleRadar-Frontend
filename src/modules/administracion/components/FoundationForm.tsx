import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { errorMessage } from '@/modules/core/api/errors'
import { FieldError } from '@/modules/core/components/ErrorFeedback'
import { usuarioService } from '@/modules/identidad/services/usuarioService'
import type { AdminUserDto } from '@/modules/identidad/types/usuario.dto'
import { adminFoundationService } from '../services/adminService'
import { FOUNDATION_LIMITS as L, GARMENT_CATEGORIES, GARMENT_CATEGORY_LABEL, type FoundationFormDto, type GarmentCategory } from '../types/admin.dto'
import { erroresFundacion, TEXTOS_FUNDACION, type FoundationDuplicates, type FoundationFormErrors } from '../utils/validation'

type Texto = Exclude<keyof FoundationFormDto, 'acceptedCategories' | 'representativeId' | 'representativeName' | 'legalEntityCertificateUrl' | 'certificateName'>

/** [campo, etiqueta, tipo, placeholder, máximo, ocupa dos columnas, área de texto] */
const CAMPOS: [Texto, string, string?, string?, number?, boolean?, boolean?][] = [
  ['name', 'Nombre', 'text', undefined, L.nameMax],
  ['nit', 'NIT', 'text', '900215884-1'],
  ['email', 'Correo', 'email'],
  ['phone', 'Teléfono (opcional)', 'tel', undefined, L.phone],
  ['neighborhood', 'Barrio', 'text', undefined, L.neighborhood],
  ['address', 'Dirección', 'text', undefined, L.address],
  ['description', 'Descripción (opcional)', 'text', 'Labor social y alcance de la fundación', L.description, true, true],
  ['latitude', 'Latitud', 'text', '4.6371'],
  ['longitude', 'Longitud', 'text', '-74.0659'],
]
const OPCIONALES: [Texto, string, string, number][] = [
  ['supportedCauses', 'Causas apoyadas', 'Causas sociales y cobertura geográfica', L.supportedCauses],
  ['openingHours', 'Horario de recepción', 'Lunes a viernes, 8:00 a. m. a 5:00 p. m.', L.openingHours],
  ['donationPolicies', 'Políticas de donación', 'Estado requerido de las prendas donadas', L.donationPolicies],
]

const MAX_CERT_BYTES = 6 * 1024 * 1024
const LABEL = 'text-[11px] font-bold uppercase tracking-[.14em] text-white/70'
const input = (bad: boolean) =>
  `mt-1 w-full rounded-lg border bg-black/20 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-blanco outline-none focus:border-violeta-claro ${bad ? 'border-[#ffb4b4]' : 'border-white/20'}`

/** Formulario de fundación (registrar o editar) con los campos y validaciones de SR-RF-63 y 64. */
export function FoundationForm({ id, inicial, duplicados, serverErrors, onSubmit, onUploadingChange, children }: {
  id: string
  inicial: FoundationFormDto
  duplicados?: FoundationDuplicates
  serverErrors?: FoundationFormErrors
  onSubmit: (d: FoundationFormDto) => void
  onUploadingChange?: (uploading: boolean) => void
  children: React.ReactNode
}) {
  const [d, setD] = useState(inicial)
  const [err, setErr] = useState<FoundationFormErrors>({})
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    if (!serverErrors || !Object.keys(serverErrors).length) return
    setErr((prev) => ({ ...prev, ...serverErrors }))
    const first = Object.keys(serverErrors)[0]
    if (first) window.setTimeout(() => document.getElementById(`${id}-${first}`)?.focus(), 0)
  }, [serverErrors, id])

  useEffect(() => { onUploadingChange?.(subiendo) }, [subiendo, onUploadingChange])

  const set = <K extends keyof FoundationFormDto>(k: K, v: FoundationFormDto[K], errKey: keyof FoundationFormErrors = k) => {
    setD((prev) => ({ ...prev, [k]: v }))
    setErr((prev) => ({ ...prev, [errKey]: undefined }))
  }

  const toggleCategoria = (c: GarmentCategory) =>
    set('acceptedCategories', d.acceptedCategories.includes(c) ? d.acceptedCategories.filter((x) => x !== c) : GARMENT_CATEGORIES.filter((x) => x === c || d.acceptedCategories.includes(x)))

  const onCertChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    if (file.type !== 'application/pdf' || file.size === 0 || file.size > MAX_CERT_BYTES) {
      setErr((prev) => ({ ...prev, certificate: TEXTOS_FUNDACION.certificadoFormato }))
      return
    }
    setSubiendo(true)
    setErr((prev) => ({ ...prev, certificate: undefined }))
    try {
      const url = await adminFoundationService.uploadCertificate(file)
      setD((prev) => ({ ...prev, legalEntityCertificateUrl: url, certificateName: file.name }))
    } catch (x) {
      setErr((prev) => ({ ...prev, certificate: errorMessage(x, 'No pudimos subir el certificado. Intenta de nuevo.') }))
    } finally { setSubiendo(false) }
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (subiendo) return
    const errores = erroresFundacion(d, duplicados ?? {}, { requireCertificado: true })
    setErr(errores)
    const primero = Object.keys(errores)[0]
    if (primero) { document.getElementById(`${id}-${primero}`)?.focus(); return }
    onSubmit(d)
  }

  const campo = ([k, label, type = 'text', ph, max, ancho, area]: (typeof CAMPOS)[number]) => {
    const props = {
      id: `${id}-${k}`,
      value: d[k] ?? '',
      placeholder: ph,
      'aria-invalid': !!err[k],
      'aria-describedby': err[k] ? `${id}-${k}-err` : undefined,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
      className: input(!!err[k]),
    }
    return (
      <div key={k} className={ancho ? 'sm:col-span-2' : ''}>
        <label htmlFor={`${id}-${k}`} className={LABEL}>{label}</label>
        {area ? <textarea {...props} rows={3} /> : <input {...props} type={type} inputMode={k === 'latitude' || k === 'longitude' ? 'decimal' : undefined} />}
        {max && (area || k === 'name') ? <p className="mt-1 text-right text-[11px] text-white/55">{String(d[k] ?? '').length}/{max}</p> : null}
        <FieldError id={`${id}-${k}-err`} message={err[k]} />
      </div>
    )
  }

  return (
    <form id={id} onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
      {CAMPOS.map(campo)}
      <p className="-mt-2 text-xs text-white/60 sm:col-span-2">Ubicación de la sede en grados decimales (WGS84).</p>

      <fieldset className="sm:col-span-2" aria-describedby={err.acceptedCategories ? `${id}-acceptedCategories-err` : undefined}>
        <legend className={LABEL}>Categorías de prenda que recibe</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {GARMENT_CATEGORIES.map((c, i) => (
            <label key={c} className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm">
              <input id={i === 0 ? `${id}-acceptedCategories` : undefined} type="checkbox" checked={d.acceptedCategories.includes(c)} onChange={() => toggleCategoria(c)} />
              {GARMENT_CATEGORY_LABEL[c]}
            </label>
          ))}
        </div>
        <FieldError id={`${id}-acceptedCategories-err`} message={err.acceptedCategories} />
      </fieldset>

      <RepresentativePicker
        id={id}
        valueId={d.representativeId}
        valueName={d.representativeName}
        error={err.representativeId}
        onChange={(uid, nombre) => { setD((prev) => ({ ...prev, representativeId: uid, representativeName: nombre })); setErr((prev) => ({ ...prev, representativeId: undefined })) }}
      />

      {OPCIONALES.map(([k, label, ph, max]) => campo([k, `${label} (opcional)`, 'text', ph, max, true, true]))}

      <div className="sm:col-span-2">
        <label htmlFor={`${id}-certificate`} className={LABEL}>Certificado de existencia (PDF)</label>
        <input
          id={`${id}-certificate`}
          type="file"
          accept="application/pdf,.pdf"
          disabled={subiendo}
          aria-invalid={!!err.certificate}
          aria-describedby={err.certificate ? `${id}-certificate-err` : undefined}
          onChange={onCertChange}
          className="mt-1 block w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-violeta file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
        />
        <p className="mt-1 text-xs text-white/65" aria-live="polite">
          {subiendo ? 'Subiendo el certificado…'
            : d.certificateName ? `Archivo: ${d.certificateName}`
              : d.legalEntityCertificateUrl ? <a href={d.legalEntityCertificateUrl} target="_blank" rel="noreferrer" className="underline">Ver certificado actual</a>
                : null}
        </p>
        <FieldError id={`${id}-certificate-err`} message={err.certificate} />
      </div>
      <div className="sm:col-span-2">{children}</div>
    </form>
  )
}

/** Busca y elige al representante entre los usuarios registrados (GET /api/v1/admin/users?q=). */
function RepresentativePicker({ id, valueId, valueName, error, onChange }: {
  id: string
  valueId: string
  valueName: string
  error?: string
  onChange: (id: string, name: string) => void
}) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<AdminUserDto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [fallo, setFallo] = useState('')
  const version = useRef(0)

  useEffect(() => {
    const texto = q.trim()
    if (texto.length < 2) { setResultados([]); setFallo(''); return }
    const v = ++version.current
    const t = window.setTimeout(async () => {
      setBuscando(true)
      try {
        const page = await usuarioService.listAdmin({ q: texto, size: 5 })
        if (v === version.current) { setResultados(page.content); setFallo('') }
      } catch (x) {
        if (v === version.current) { setResultados([]); setFallo(errorMessage(x, 'No pudimos buscar usuarios. Intenta de nuevo.')) }
      } finally { if (v === version.current) setBuscando(false) }
    }, 300)
    return () => window.clearTimeout(t)
  }, [q])

  const inputId = `${id}-representativeId`
  return (
    <div className="sm:col-span-2">
      {valueId ? <p className={LABEL}>Representante legal</p> : <label htmlFor={inputId} className={LABEL}>Representante legal</label>}
      {valueId ? (
        <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-white/20 bg-black/20 px-3 py-2.5 text-sm">
          <span>{valueName || `Usuario ${valueId}`}</span>
          <button id={inputId} type="button" onClick={() => onChange('', '')} aria-describedby={error ? `${inputId}-err` : undefined} className="text-xs font-semibold text-violeta-claro underline">Cambiar representante</button>
        </div>
      ) : (
        <>
          <input id={inputId} type="search" value={q} placeholder="Busca por nombre o correo" autoComplete="off"
            aria-invalid={!!error} aria-describedby={error ? `${inputId}-err` : undefined} onChange={(e) => setQ(e.target.value)} className={input(!!error)} />
          {buscando && <p className="mt-1 text-xs text-white/60">Buscando…</p>}
          {fallo && <p className="mt-1 text-xs text-[#ffb4b4]">{fallo}</p>}
          {!buscando && q.trim().length >= 2 && !fallo && !resultados.length && <p className="mt-1 text-xs text-white/60">No hay usuarios con ese nombre o correo.</p>}
          {resultados.length > 0 && (
            <ul className="mt-1 grid gap-1" aria-label="Usuarios encontrados">
              {resultados.map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => { onChange(String(u.id), u.name); setQ('') }} className="w-full rounded-lg border border-white/15 px-3 py-2 text-left text-sm hover:border-violeta-claro">
                    Elegir {u.name} <span className="text-white/60">· {u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <FieldError id={`${inputId}-err`} message={error} />
    </div>
  )
}
