import { useEffect, useState } from 'react'
import { NOTIFICATIONS_CHANGED, notificationService } from '../services/notificationService'

/** Cada cuánto se vuelve a preguntar por avisos nuevos mientras la pestaña está visible. */
const EVERY_MS = 60_000

/**
 * Contador de notificaciones sin leer para la campana. Se actualiza al abrir la página,
 * cada minuto con la pestaña visible y apenas se marca algo como leído.
 * Si el servicio falla deja el último valor: la campana no debe romper el menú.
 */
export function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let active = true
    const load = () => {
      if (document.visibilityState === 'hidden') return
      notificationService.unreadCount().then((n) => { if (active) setCount(n) }).catch(() => {})
    }
    load()
    const timer = window.setInterval(load, EVERY_MS)
    window.addEventListener(NOTIFICATIONS_CHANGED, load)
    document.addEventListener('visibilitychange', load)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener(NOTIFICATIONS_CHANGED, load)
      document.removeEventListener('visibilitychange', load)
    }
  }, [enabled])

  return enabled ? count : 0
}
