import { env } from '@/configs/env'
import { tokenStorage } from '@/modules/core/api/tokenStorage'
import type { MensajeDto } from '../types/chat.dto'
import { aMensaje } from './chatMapper'

export interface ChatSocketOptions {
  conversationId: string
  onMessage: (mensaje: MensajeDto) => void
  onStatusChange?: (connected: boolean) => void
}

export function buildChatWsUrl(apiUrl: string): string {
  const clean = apiUrl.trim().replace(/\/+$/, '')
  return clean.replace(/^http/i, 'ws') + '/api/v1/ws'
}

export function buildStompFrame(
  command: string,
  headers: Record<string, string> = {},
  body = '',
): string {
  const headerLines = Object.entries(headers).map(([k, v]) => `${k}:${v}`)
  return `${command}\n${headerLines.join('\n')}\n\n${body}\0`
}

export function parseStompFrames(raw: string): { command: string; headers: Record<string, string>; body: string }[] {
  const frames: { command: string; headers: Record<string, string>; body: string }[] = []
  for (const chunk of raw.split('\0')) {
    const trimmed = chunk.replace(/^\r?\n+/, '')
    if (!trimmed) continue
    const sep = trimmed.indexOf('\n\n')
    const headPart = sep >= 0 ? trimmed.slice(0, sep) : trimmed
    const body = sep >= 0 ? trimmed.slice(sep + 2) : ''
    const lines = headPart.split(/\r?\n/)
    const command = lines[0]?.trim() || ''
    if (!command) continue
    const headers: Record<string, string> = {}
    for (const line of lines.slice(1)) {
      const colon = line.indexOf(':')
      if (colon > 0) {
        headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
      }
    }
    frames.push({ command, headers, body })
  }
  return frames
}

/**
 * Cliente ligero STOMP 1.2 sobre WebSocket nativo para /api/v1/ws.
 * Suscribe a /topic/conversations/{conversationId} y notifica el estado de conexión
 * para que ChatPanel desactive el polling cuando el socket está conectado.
 */
export function connectChatSocket({ conversationId, onMessage, onStatusChange }: ChatSocketOptions): () => void {
  const token = tokenStorage.get()
  if (env.useMocks || !token || !env.apiUrl || typeof WebSocket === 'undefined') {
    onStatusChange?.(false)
    return () => {}
  }

  let active = true
  let ws: WebSocket | null = null
  let reconnectTimer: number | null = null
  let delayMs = 1000
  const wsUrl = buildChatWsUrl(env.apiUrl)

  const scheduleReconnect = () => {
    if (!active) return
    reconnectTimer = window.setTimeout(() => {
      delayMs = Math.min(delayMs * 2, 30_000)
      connect()
    }, delayMs)
  }

  const connect = () => {
    if (!active) return
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      onStatusChange?.(false)
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      if (!active || !ws) return
      ws.send(
        buildStompFrame('CONNECT', {
          'accept-version': '1.2',
          'heart-beat': '10000,10000',
          Authorization: `Bearer ${token}`,
        }),
      )
    }

    ws.onmessage = (event) => {
      if (!active || typeof event.data !== 'string') return
      const frames = parseStompFrames(event.data)
      for (const frame of frames) {
        if (frame.command === 'CONNECTED') {
          delayMs = 1000
          onStatusChange?.(true)
          ws?.send(
            buildStompFrame('SUBSCRIBE', {
              id: `sub-${conversationId}`,
              destination: `/topic/conversations/${conversationId}`,
            }),
          )
        } else if (frame.command === 'MESSAGE' && frame.body) {
          try {
            const parsed = JSON.parse(frame.body)
            onMessage(aMensaje(parsed))
          } catch {
            /* mensaje malformado ignorado */
          }
        }
      }
    }

    ws.onerror = () => {
      onStatusChange?.(false)
    }

    ws.onclose = () => {
      onStatusChange?.(false)
      if (active) scheduleReconnect()
    }
  }

  connect()

  return () => {
    active = false
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer)
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(buildStompFrame('DISCONNECT'))
      } catch {
        /* ignorar al cerrar */
      }
    }
    try {
      ws?.close()
    } catch {
      /* ignorar al cerrar */
    }
    onStatusChange?.(false)
  }
}
