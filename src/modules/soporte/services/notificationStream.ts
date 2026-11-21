import { apiClient } from '@/modules/core/api/apiClient'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import { env } from '@/configs/env'
import type { NotificacionDto } from '../types/notification.dto'
import { aNotificacion } from '../utils/notificaciones'
import { NOTIFICACIONES } from './notificationService'

/** Lee un cuerpo text/event-stream y entrega cada evento completo. */
async function leer(body: ReadableStream<Uint8Array>, alEvento: (e: { id?: string; event: string; data: string }) => void) {
  const lector = body.getReader()
  const dec = new TextDecoder()
  let resto = ''
  for (;;) {
    const { done, value } = await lector.read()
    if (done) return
    resto += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n')
    let corte = resto.indexOf('\n\n')
    while (corte >= 0) {
      const bloque = resto.slice(0, corte)
      resto = resto.slice(corte + 2)
      let id: string | undefined
      let event = 'message'
      const data: string[] = []
      for (const l of bloque.split('\n')) {
        if (l.startsWith('id:')) id = l.slice(3).trim()
        else if (l.startsWith('event:')) event = l.slice(6).trim()
        else if (l.startsWith('data:')) data.push(l.slice(5).replace(/^ /, ''))
      }
      alEvento({ id, event, data: data.join('\n') })
      corte = resto.indexOf('\n\n')
    }
  }
}

/**
 * Campana en tiempo real (SR-RF-104). Pide un ticket de 60 s, abre el stream con él (el JWT nunca viaja en la dirección)
 * y, si se corta, pide otro ticket y reabre con Last-Event-ID para recibir lo que se perdió. Devuelve la función que lo cierra.
 * Con datos de prueba no hace nada: el contador se sigue consultando cada 15 s.
 */
export function abrirCampana(alAviso: (n: NotificacionDto) => void): () => void {
  if (env.useMocks || !tokenStorage.get()) return () => {}
  let activo = true
  let ctrl: AbortController | null = null
  let ultimo: string | undefined
  let espera = 1000
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

  void (async () => {
    while (activo && tokenStorage.get()) {
      try {
        const t = await apiClient.post<{ ticket?: string; token?: string }>(`${NOTIFICACIONES}/stream-ticket`)
        const ticket = t.data.ticket ?? t.data.token
        if (!ticket) throw new Error('sin ticket')
        ctrl = new AbortController()
        const res = await fetch(`${env.apiUrl}${NOTIFICACIONES}/stream?ticket=${encodeURIComponent(ticket)}`, {
          headers: { Accept: 'text/event-stream', ...(ultimo ? { 'Last-Event-ID': ultimo } : {}) },
          signal: ctrl.signal,
        })
        if (!res.ok || !res.body) throw new Error('stream')
        espera = 1000
        await leer(res.body, (e) => {
          if (e.id) ultimo = e.id
          if (e.event !== 'notificacion') return
          try { alAviso(aNotificacion(JSON.parse(e.data))) } catch { /* aviso ilegible: se ignora */ }
        })
      } catch { /* se reintenta abajo */ }
      if (!activo) return
      await dormir(espera)
      espera = Math.min(espera * 2, 30_000)
    }
  })()

  return () => { activo = false; ctrl?.abort() }
}
