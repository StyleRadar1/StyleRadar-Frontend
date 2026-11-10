import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/modules/core/api/errors'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { chatService } from '../services/chatService'
import type { IniciarConversacionDto } from '../types/chat.dto'

interface Props extends IniciarConversacionDto {
  label: string
  /** Botón principal (violeta) o secundario (con borde). */
  primary?: boolean
  className?: string
}

/**
 * Abre la conversación (o la que ya existía) y lleva a «Mensajes» con ella abierta.
 * RF-40: escribirle a quien vende en segunda mano. RF-73: escribirle a una tienda. RF-41: fundación y donante.
 */
export function ContactButton({ label, primary, className = '', ...req }: Props) {
  // Sin AuthProvider (pruebas de otros módulos) se comporta como visitante en lugar de romper la página
  const user = useContext(AuthContext)?.user ?? null
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${primary ? 'bg-violeta' : 'border border-white/25 hover:bg-white/10'}`

  if (!user) return <Link to="/login" state={{ from: location.pathname }} className={`${cls} ${className}`}>Inicia sesión para escribir</Link>
  // El administrador no tiene conversaciones
  if (user.role === 'ADMIN_STYLERADAR') return null
  if (user.id === req.contacto.id) return <p className="text-xs text-white/55">Es tu publicación</p>

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

  return (
    <div className={className}>
      <button type="button" onClick={start} disabled={busy} className={`${cls} w-full`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" />
        </svg>
        {busy ? 'Abriendo…' : label}
      </button>
      {error && <p role="alert" className="mt-1.5 text-xs text-[#ffb4b4]">{error}</p>}
    </div>
  )
}
