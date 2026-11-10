import { useState, type FormEvent } from 'react'
import type { FoundationFormDto } from '../types/admin.dto'
import { erroresFundacion } from '../utils/validation'

const CAMPOS: [keyof FoundationFormDto, string, string?, string?][] = [
  ['nombre', 'Nombre'], ['nit', 'NIT', 'text', '900.000.000-0'], ['correo', 'Correo', 'email'], ['telefono', 'Teléfono', 'tel'],
  ['barrio', 'Barrio'], ['direccion', 'Dirección'], ['representante', 'Representante legal'],
]

/** Formulario de fundación (registrar o editar) con las validaciones del prototipo. */
export function FoundationForm({ id, inicial, otrosNits, onSubmit, children }: {
  id: string; inicial: FoundationFormDto; otrosNits: string[]; onSubmit: (d: FoundationFormDto) => void; children: React.ReactNode
}) {
  const [d, setD] = useState(inicial)
  const [err, setErr] = useState<Partial<Record<keyof FoundationFormDto, string>>>({})
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const errores = erroresFundacion(d, otrosNits)
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
          <input id={`${id}-${k}`} type={type} value={d[k]} placeholder={ph} aria-invalid={!!err[k]} aria-describedby={err[k] ? `${id}-${k}-err` : undefined}
            onChange={(e) => { setD({ ...d, [k]: e.target.value }); setErr({ ...err, [k]: undefined }) }}
            className={`mt-1 w-full rounded-lg border bg-black/20 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-blanco outline-none focus:border-violeta-claro ${err[k] ? 'border-[#ffb4b4]' : 'border-white/20'}`} />
          {err[k] && <span id={`${id}-${k}-err`} className="mt-1 block text-xs text-[#ffb4b4]">{err[k]}</span>}
        </div>
      ))}
      <div className="sm:col-span-2">{children}</div>
    </form>
  )
}
