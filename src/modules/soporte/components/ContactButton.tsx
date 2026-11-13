import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { chatService } from '../services/chatService'
import type { IniciarConversacionDto } from '../types/chat.dto'
import { ChatIcon } from './ChatIcon'
import { problemaInicio, type ProblemaChat } from '../utils/chatErrors'

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
  const [error, setError] = useState<ProblemaChat | null>(null)
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
    setBusy(true); setError(null)
    try {
      const c = await chatService.start(req)
      navigate(`/mensajes?c=${encodeURIComponent(c.id)}`)
    } catch (e) {
      // 422: publicación propia o no disponible → aviso junto al botón y no se abre el chat
      setError(problemaInicio(e))
      setBusy(false)
    }
  }

  if (icon) {
    return (
      <div className={className}>
        <button type="button" onClick={start} disabled={busy} aria-label={label} title={label} className={cls}>
          <ChatIcon className={iconCls} />
        </button>
        {error && <p role="alert" className="absolute bottom-12 right-0 w-52 rounded-lg bg-grafito p-2 text-xs shadow-lg"><b className="block text-white">{error.titulo}</b><span className="text-white/70">{error.texto}</span></p>}
      </div>
    )
  }

  return (
    <div className={className}>
      <button type="button" onClick={start} disabled={busy} className={`${cls} w-full`}>
        <ChatIcon className={iconCls} />
        {busy ? 'Abriendo…' : label}
      </button>
      {error && <p role="alert" className="mt-1.5 text-xs"><b className="block text-[#ffb4b4]">{error.titulo}</b><span className="text-white/70">{error.texto}</span></p>}
    </div>
  )
}
