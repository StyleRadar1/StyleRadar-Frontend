import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Role } from '@/modules/core/types/roles'
import type { UserSessionDto } from '@/modules/identidad/types/auth.dto'
import { useAuth } from '@/modules/identidad/hooks/useAuth'
import './WelcomeOverlay.css'

/** Etiqueta, frase, foto y colores de cada rol (alineadas con los representantes oficiales). */
const COPY: Record<Role, { tag: string; line: string; pic: string; role: string; ink: string; line2: string; pos?: string }> = {
  COMPRADOR: { tag: 'Usuario', line: 'Tu estilo, cerca de ti', pic: '/img/representantes/R1.png', pos: '50% 18%', role: '#48119a', ink: '#ffffff', line2: '#7b4dd8' },
  ADMIN_ALMACEN: { tag: 'Tienda', line: 'Que te encuentren en tu talla', pic: '/img/representantes/R2.png', pos: '50% 15%', role: '#e8dccb', ink: '#262626', line2: '#e8dccb' },
  REPRESENTANTE_FUNDACION: { tag: 'Fundación', line: 'La ropa sigue su camino', pic: '/img/representantes/R3.png', pos: '50% 24%', role: '#b9b9ca', ink: '#262626', line2: '#b9b9ca' },
  ADMIN_STYLERADAR: { tag: 'Administrador', line: 'Todo StyleRadar en un vistazo', pic: '/img/representantes/R4.png', pos: '50% 20%', role: '#262626', ink: '#ffffff', line2: '#7b4dd8' },
}

interface Shown { name: string; role: Role; nuevo: boolean }

/**
 * Pantalla de bienvenida al iniciar sesión o crear la cuenta: «Hola de nuevo, Valentina».
 * Aparece cuando se inicia sesión exitosamente o se crea una cuenta,
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
    if (prevId === null && user && !shown) {
      const persona = user.role === 'COMPRADOR' || user.role === 'ADMIN_STYLERADAR'
      setShown({ name: persona ? user.name.split(/\s+/)[0] : user.name, role: user.role, nuevo: pathname === '/registro' })
    } else if (!user) {
      setShown(null)
    }
  }

  useEffect(() => {
    const handleLoginSuccess = (e: Event) => {
      const customEvent = e as CustomEvent<UserSessionDto>
      const u = customEvent.detail
      if (!u) return
      const persona = u.role === 'COMPRADOR' || u.role === 'ADMIN_STYLERADAR'
      setShown({
        name: persona ? u.name.split(/\s+/)[0] : u.name,
        role: u.role,
        nuevo: window.location.pathname === '/registro',
      })
    }

    window.addEventListener('sr:login-success', handleLoginSuccess)
    return () => window.removeEventListener('sr:login-success', handleLoginSuccess)
  }, [])

  useEffect(() => {
    if (!shown) return
    document.documentElement.classList.add('lock')
    const close = () => {
      document.documentElement.classList.remove('lock')
      setShown(null)
    }
    const timer = setTimeout(close, 2400)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('lock')
    }
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
      <img src={c.pic} alt="" style={c.pos ? { objectPosition: c.pos } : undefined} />
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
