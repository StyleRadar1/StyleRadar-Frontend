import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Role } from '@/modules/core/types/roles'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import './WelcomeOverlay.css'

/** Etiqueta, frase, foto y colores de cada rol (los mismos de la bienvenida del prototipo). */
const COPY: Record<Role, { tag: string; line: string; pic: string; role: string; ink: string; line2: string }> = {
  COMPRADOR: { tag: 'Usuario', line: 'Tu estilo, cerca de ti', pic: '/img/sesion/rol-usuario.jpg', role: '#48119a', ink: '#ffffff', line2: '#7b4dd8' },
  ADMIN_ALMACEN: { tag: 'Tienda', line: 'Que te encuentren en tu talla', pic: '/img/sesion/rol-tienda.jpg', role: '#e8dccb', ink: '#262626', line2: '#e8dccb' },
  REPRESENTANTE_FUNDACION: { tag: 'Fundación', line: 'La ropa sigue su camino', pic: '/img/sesion/rol-fundacion.jpg', role: '#b9b9ca', ink: '#262626', line2: '#b9b9ca' },
  ADMIN_STYLERADAR: { tag: 'Administrador', line: 'Todo StyleRadar en un vistazo', pic: '/img/sesion/rol-admin.jpg', role: '#262626', ink: '#ffffff', line2: '#7b4dd8' },
}

interface Shown { name: string; role: Role; nuevo: boolean }

/**
 * Pantalla de bienvenida al iniciar sesión o crear la cuenta: «Hola de nuevo, Valentina».
 * Aparece cuando la sesión pasa de vacía a iniciada (no al recargar una sesión que ya existía),
 * dura unos segundos y se cierra sola, con clic o con Escape.
 */
export function WelcomeOverlay() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [prevId, setPrevId] = useState<string | null>(user?.id ?? null)
  const [shown, setShown] = useState<Shown | null>(null)

  const id = user?.id ?? null
  if (id !== prevId) {
    setPrevId(id)
    if (prevId === null && user) {
      const persona = user.role === 'COMPRADOR' || user.role === 'ADMIN_STYLERADAR'
      setShown({ name: persona ? user.name.split(/\s+/)[0] : user.name, role: user.role, nuevo: pathname === '/registro' })
    } else if (!user) setShown(null)
  }

  useEffect(() => {
    if (!shown) return
    const close = () => setShown(null)
    const timer = setTimeout(close, 2400)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey) }
  }, [shown])

  if (!shown) return null
  const c = COPY[shown.role]
  return (
    <div
      role="status"
      className="sr-wel zona-oscura"
      style={{ '--wel-role': c.role, '--wel-ink': c.ink, '--wel-line': c.line2 } as React.CSSProperties}
      onClick={() => setShown(null)}
    >
      <img src={c.pic} alt="" />
      <div className="sr-wel-in">
        <span className="sr-wel-tag"><i />{c.tag}</span>
        <h2 className={shown.name.length > 16 ? 'is-long' : undefined}>
          {shown.nuevo ? 'Tu cuenta está lista,' : 'Hola de nuevo,'}<br /><b>{shown.name}</b>
        </h2>
        <p>{c.line}</p>
        <span className="sr-wel-bar"><i /></span>
      </div>
    </div>
  )
}
