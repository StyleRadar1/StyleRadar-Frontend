import { useCallback, useEffect, useRef, useState } from 'react'
import { errorKind } from '@/modules/core/api/errors'
import { tryOnService } from '../services/tryOnService'
import type { TryOnJobStatusDto } from '../types/tryon.dto'

export type JobPhase = 'idle' | 'creating' | 'waiting' | 'completed' | 'failed' | 'expired' | 'offline' | 'error' | 'cancelled'

export interface JobState {
  phase: JobPhase
  jobId?: string
  progress?: number
  result?: TryOnJobStatusDto
  error?: unknown
}

export const POLL = { first: 1000, max: 5000, factor: 1.5, maxNetworkFailures: 4, timeoutMs: 90000 }

const newKey = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)

/**
 * RF-25: crea el job (202 + jobId) y consulta su estado sin bloquear la interfaz.
 * - No crea un segundo job mientras haya uno activo (evita duplicados por doble clic).
 * - Si se cae la red, conserva el jobId y permite seguir consultando el mismo job.
 * - Deja de consultar al completar, fallar, vencer, cancelar o salir de la pantalla.
 */
export function useTryOnJob() {
  const [state, setState] = useState<JobState>({ phase: 'idle' })
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const run = useRef(0)
  const busy = useRef(false)

  const stop = useCallback(() => { clearTimeout(timer.current); run.current++ }, [])
  useEffect(() => stop, [stop])

  const poll = useCallback((jobId: string, startedAt: number) => {
    const my = ++run.current
    let delay = POLL.first
    let failures = 0
    const tick = async () => {
      if (my !== run.current) return
      if (Date.now() - startedAt > POLL.timeoutMs) {
        busy.current = false
        setState({ phase: 'expired', jobId })
        return
      }
      try {
        const s = await tryOnService.getJob(jobId)
        if (my !== run.current) return
        failures = 0
        if (s.status === 'COMPLETED') { busy.current = false; setState({ phase: 'completed', jobId, result: s, progress: 100 }); return }
        if (s.status === 'FAILED') { busy.current = false; setState({ phase: 'failed', jobId, result: s }); return }
        if (s.status === 'EXPIRED') { busy.current = false; setState({ phase: 'expired', jobId }); return }
        setState({ phase: 'waiting', jobId, progress: s.progress })
      } catch (e) {
        if (my !== run.current) return
        const kind = errorKind(e)
        if (kind === 'sin-conexion' && ++failures < POLL.maxNetworkFailures) {
          setState((st) => ({ ...st, phase: 'waiting', jobId }))
        } else {
          busy.current = false
          setState({ phase: kind === 'sin-conexion' ? 'offline' : 'error', jobId, error: e })
          return
        }
      }
      delay = Math.min(POLL.max, delay * POLL.factor)
      timer.current = setTimeout(tick, delay)
    }
    timer.current = setTimeout(tick, POLL.first)
  }, [])

  /** Inicia una prueba. Ignora la llamada si ya hay una en curso. */
  const start = useCallback(async (photoId: string, garmentId: string) => {
    if (busy.current) return
    busy.current = true
    stop()
    setState({ phase: 'creating' })
    try {
      const created = await tryOnService.createJob({ photoId, garmentId }, newKey())
      setState({ phase: 'waiting', jobId: created.jobId, progress: 0 })
      poll(created.jobId, Date.now())
    } catch (e) {
      busy.current = false
      setState({ phase: errorKind(e) === 'sin-conexion' ? 'offline' : 'error', error: e })
    }
  }, [poll, stop])

  /** Después de un corte de red, sigue consultando el mismo job sin crear otro. */
  const resume = useCallback(() => {
    if (!state.jobId || busy.current) return
    busy.current = true
    setState((st) => ({ ...st, phase: 'waiting', error: undefined }))
    poll(state.jobId, Date.now())
  }, [poll, state.jobId])

  const cancel = useCallback(() => { stop(); busy.current = false; setState({ phase: 'cancelled' }) }, [stop])
  const reset = useCallback(() => { stop(); busy.current = false; setState({ phase: 'idle' }) }, [stop])

  const active = state.phase === 'creating' || state.phase === 'waiting'
  return { ...state, active, start, resume, cancel, reset }
}

