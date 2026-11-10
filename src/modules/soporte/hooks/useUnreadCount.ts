import { useEffect, useState } from 'react'
import { CHAT_CHANGED, chatService } from '../services/chatService'
import { NOTIFICATIONS_CHANGED, notificationService } from '../services/notificationService'

/** Cada cuánto se vuelve a preguntar mientras la pestaña está visible. */
const EVERY_MS = 60_000
/** El chat se consulta más seguido mientras el squad confirma si habrá tiempo real. */
const CHAT_EVERY_MS = 15_000

/**
 * Contador para un ícono del menú. Se actualiza al abrir la página, cada cierto tiempo con la pestaña
 * visible y apenas llega el evento de cambio. Si el servicio falla deja el último valor: el menú no debe romperse.
 */
function usePolledCount(load: () => Promise<number>, event: string, every: number, enabled: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let active = true
    const refresh = () => {
      if (document.visibilityState === 'hidden') return
      load().then((n) => { if (active) setCount(n) }).catch(() => {})
    }
    refresh()
    const timer = window.setInterval(refresh, every)
    window.addEventListener(event, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener(event, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [load, event, every, enabled])

  return enabled ? count : 0
}

const notificaciones = () => notificationService.unreadCount()
const mensajes = () => chatService.unreadCount()

/** Notificaciones sin leer, para la campana (RF-31). */
export const useUnreadCount = (enabled: boolean) => usePolledCount(notificaciones, NOTIFICATIONS_CHANGED, EVERY_MS, enabled)

/** Mensajes sin leer, para el ícono de mensajes (RF-73: la tienda responde desde la barra). */
export const useUnreadMessages = (enabled: boolean) => usePolledCount(mensajes, CHAT_CHANGED, CHAT_EVERY_MS, enabled)
