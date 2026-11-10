import { NavLink } from 'react-router-dom'
import { useUnreadMessages } from '../hooks/useUnreadCount'

/** Ícono de mensajes del menú con el número de mensajes sin leer (RF-41 y RF-73). */
export function MessagesLink() {
  const count = useUnreadMessages(true)
  return (
    <NavLink to="/mensajes" aria-label={count ? `Mensajes, ${count} sin leer` : 'Mensajes'}
      className={({ isActive }) => `relative grid h-10 w-10 place-items-center rounded-lg border hover:bg-white/10 ${isActive ? 'border-arena' : 'border-white/20'}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" />
      </svg>
      {count > 0 && (
        <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-violeta px-1 text-[11px] font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </NavLink>
  )
}
