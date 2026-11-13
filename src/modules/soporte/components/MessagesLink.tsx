import { NavLink } from 'react-router-dom'
import { useUnreadMessages } from '../hooks/useUnreadCount'
import { ChatIcon } from './ChatIcon'

/** Ícono de mensajes del menú con el número de mensajes sin leer (RF-41 y RF-73). */
export function MessagesLink() {
  const count = useUnreadMessages(true)
  return (
    <NavLink to="/mensajes" aria-label={count ? `Mensajes, ${count} sin leer` : 'Mensajes'}
      className={({ isActive }) => `relative grid h-10 w-10 place-items-center rounded-lg border hover:bg-white/10 ${isActive ? 'border-arena' : 'border-white/20'}`}>
      <ChatIcon />
      {count > 0 && (
        <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-violeta px-1 text-[0.6875rem] font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </NavLink>
  )
}
