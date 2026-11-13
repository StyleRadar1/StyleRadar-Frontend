import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { FieldError } from '@/modules/core/components/ErrorFeedback'
import type { FoundationFormDto } from '../types/admin.dto'
import { erroresFundacion, type FoundationDuplicates } from '../utils/validation'

const CAMPOS: [keyof FoundationFormDto, string, string?, string?][] = [
  ['nombre', 'Nombre'], ['nit', 'NIT', 'text', '900.000.000-0'], ['correo', 'Correo', 'email'], ['telefono', 'Teléfono', 'tel'],
  ['barrio', 'Barrio'], ['direccion', 'Dirección'], ['representante', 'Representante legal'],
]

const CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_CERT_BYTES = 6 * 1024 * 1024

/** Formulario de fundación (registrar o editar) con las validaciones del prototipo. */
export function FoundationForm({ id, inicial, otrosNits, duplicados, requireCertificado = false, serverErrors, onSubmit, children }: {
  id: string
  inicial: FoundationFormDto
  otrosNits?: string[]
  duplicados?: FoundationDuplicates
  requireCertificado?: boolean
  serverErrors?: Partial<Record<keyof FoundationFormDto, string>>
  onSubmit: (d: FoundationFormDto) => void
  children: React.ReactNode
}) {
  const [d, setD] = useState(inicial)
  const [err, setErr] = useState<Partial<Record<keyof FoundationFormDto, string>>>({})

  useEffect(() => {
    if (!serverErrors || !Object.keys(serverErrors).length) return
    setErr((prev) => ({ ...prev, ...serverErrors }))
    const first = Object.keys(serverErrors)[0]
    if (first) window.setTimeout(() => document.getElementById(`${id}-${first}`)?.focus(), 0)
  }, [serverErrors, id])

  const onCertChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    if (!CERT_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_CERT_BYTES) {
      setD((prev) => ({ ...prev, certificado: '' }))
      setErr((prev) => ({ ...prev, certificado: 'Sube un PDF, JPG o PNG de máximo 6 MB.' }))
      return
    }
    setD((prev) => ({ ...prev, certificado: file.name }))
    setErr((prev) => ({ ...prev, certificado: undefined }))
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const dup: FoundationDuplicates = duplicados ?? { nits: otrosNits ?? [] }
    const errores = erroresFundacion(d, dup, { requireCertificado })
    setErr(errores)
    const primero = Object.keys(errores)[0]
    if (primero) { document.getElementById(`${id}-${primero}`)?.focus(); return }
    onSubmit(d)
  }
  return (
    <form id={id} onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
      {CAMPOS.map(([k, label, type = 'text', ph]) => (
        <div key={k} className={k === 'representante' ? 'sm:col-span-2' : ''}>
          <label htmlFor={`${id}-${k}`} className="text-[11px] font-bold uppercase tracking-[.14em] text-white/70">{label}</label>
          <input id={`${id}-${k}`} type={type} value={d[k] ?? ''} placeholder={ph} aria-invalid={!!err[k]} aria-describedby={err[k] ? `${id}-${k}-err` : undefined}
            onChange={(e) => { setD({ ...d, [k]: e.target.value }); setErr({ ...err, [k]: undefined }) }}
            className={`mt-1 w-full rounded-lg border bg-black/20 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-blanco outline-none focus:border-violeta-claro ${err[k] ? 'border-[#ffb4b4]' : 'border-white/20'}`} />
          <FieldError id={`${id}-${k}-err`} message={err[k]} />
        </div>
      ))}
      {requireCertificado && (
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-certificado`} className="text-[11px] font-bold uppercase tracking-[.14em] text-white/70">Certificado de existencia (PDF, JPG o PNG)</label>
          <input
            id={`${id}-certificado`}
            type="file"
            accept=".pdf,image/jpeg,image/png"
            aria-invalid={!!err.certificado}
            aria-describedby={err.certificado ? `${id}-certificado-err` : undefined}
            onChange={onCertChange}
            className="mt-1 block w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-violeta file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
          />
          {d.certificado && <p className="mt-1 text-xs text-white/65">Archivo: {d.certificado}</p>}
          <FieldError id={`${id}-certificado-err`} message={err.certificado} />
        </div>
      )}
      <div className="sm:col-span-2">{children}</div>
    </form>
  )
}
