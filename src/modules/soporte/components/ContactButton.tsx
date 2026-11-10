import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { chatService } from '../services/chatService'
import type { IniciarConversacionDto } from '../types/chat.dto'
import { ChatIcon } from './ChatIcon'

interface Props extends IniciarConversacionDto {
  label: string
  /** Botón principal (violeta) o secundario (con borde). */
  primary?: boolean
  /** Solo el ícono redondo (para las tarjetas del catálogo); `label` queda como nombre accesible. */
  icon?: boolean
  className?: string
}

/**
 * Abre la conversación (o la que ya existía) y lleva a «Mensajes» con ella abierta.
 * RF-73: escribirle a una tienda desde el catálogo. RF-41: fundación y donante.
 */
export function ContactButton({ label, primary, icon, className = '', ...req }: Props) {
  // Sin AuthProvider (pruebas de otros módulos) se comporta como visitante en lugar de romper la página
  const user = useContext(AuthContext)?.user ?? null
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cls = icon
    ? 'grid h-10 w-10 place-items-center rounded-full bg-violeta text-blanco shadow-lg ring-1 ring-white/20 transition hover:scale-110 hover:bg-violeta-claro disabled:opacity-60'
    : `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${primary ? 'bg-violeta' : 'border border-white/25 hover:bg-white/10'}`
  const iconCls = icon ? 'h-5 w-5' : 'h-4 w-4'

  if (!user) {
    return icon
      ? <Link to="/login" state={{ from: location.pathname }} aria-label={`Inicia sesión para escribir a ${req.contacto.nombre}`} title="Inicia sesión para escribir" className={`${cls} ${className}`}><ChatIcon className={iconCls} /></Link>
      : <Link to="/login" state={{ from: location.pathname }} className={`${cls} ${className}`}>Inicia sesión para escribir</Link>
  }
  // El administrador no tiene conversaciones, y nadie se escribe a sí mismo
  if (user.role === 'ADMIN_STYLERADAR') return null
  if (user.id === req.contacto.id) return icon ? null : <p className="text-xs text-white/55">Es tu publicación</p>

  const start = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const c = await chatService.start(req)
      navigate(`/mensajes?c=${encodeURIComponent(c.id)}`)
    } catch (e) {
      setError(errorMessage(e, 'No pudimos abrir la conversación. Intenta de nuevo.'))
      setBusy(false)
    }
  }

  if (icon) {
    return (
      <div className={className}>
        <button type="button" onClick={start} disabled={busy} aria-label={label} title={label} className={cls}>
          <ChatIcon className={iconCls} />
        </button>
        {error && <p role="alert" className="absolute bottom-12 right-0 w-48 rounded-lg bg-grafito p-2 text-xs text-[#ffb4b4] shadow-lg">{error}</p>}
      </div>
    )
  }

  return (
    <div className={className}>
      <button type="button" onClick={start} disabled={busy} className={`${cls} w-full`}>
        <ChatIcon className={iconCls} />
        {busy ? 'Abriendo…' : label}
      </button>
      {error && <p role="alert" className="mt-1.5 text-xs text-[#ffb4b4]">{error}</p>}
    </div>
  )
}
