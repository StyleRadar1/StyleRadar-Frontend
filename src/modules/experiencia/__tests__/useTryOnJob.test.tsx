import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/modules/core/api/apiClient'
import { useTryOnJob } from '../hooks/useTryOnJob'
import { tryOnService } from '../services/tryOnService'

describe('job asíncrono del probador (RF-25)', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  const flush = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }

  it('conserva el jobId del 202 y pasa de espera a resultado al completar', async () => {
    vi.spyOn(tryOnService, 'createJob').mockResolvedValue({ jobId: 'job-1', status: 'PENDING' })
    const get = vi.spyOn(tryOnService, 'getJob')
      .mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
      .mockResolvedValueOnce({ jobId: 'job-1', status: 'PROCESSING', progress: 50 })
      .mockResolvedValue({ jobId: 'job-1', status: 'COMPLETED', resultUrl: 'https://sas/r.jpg', expiresAt: new Date(Date.now() + 60000).toISOString() })
    const { result } = renderHook(() => useTryOnJob())
    await act(async () => { await result.current.start('foto-1', 'p1') })
    expect(result.current.jobId).toBe('job-1')
    expect(result.current.active).toBe(true)
    await flush(1000); await flush(1500)
    expect(result.current.progress).toBe(50)
    await flush(3000)
    expect(result.current.phase).toBe('completed')
    expect(result.current.result?.resultUrl).toBe('https://sas/r.jpg')
    expect(get).toHaveBeenCalledWith('job-1')
  })

  it('no crea un segundo job si se pide otra vez mientras hay uno activo', async () => {
    const create = vi.spyOn(tryOnService, 'createJob').mockResolvedValue({ jobId: 'job-1', status: 'PENDING' })
    vi.spyOn(tryOnService, 'getJob').mockResolvedValue({ jobId: 'job-1', status: 'PENDING' })
    const { result } = renderHook(() => useTryOnJob())
    await act(async () => { await Promise.all([result.current.start('f', 'p1'), result.current.start('f', 'p1')]) })
    await act(async () => { await result.current.start('f', 'p1') })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('informa un job fallido y uno vencido', async () => {
    vi.spyOn(tryOnService, 'createJob').mockResolvedValue({ jobId: 'job-2', status: 'PENDING' })
    vi.spyOn(tryOnService, 'getJob').mockResolvedValue({ jobId: 'job-2', status: 'FAILED', error: 'El proveedor de IA no respondió.' })
    const { result } = renderHook(() => useTryOnJob())
    await act(async () => { await result.current.start('f', 'p1') })
    await flush(1000)
    expect(result.current.phase).toBe('failed')
    expect(result.current.result?.error).toMatch(/proveedor/)

    vi.spyOn(tryOnService, 'getJob').mockResolvedValue({ jobId: 'job-2', status: 'EXPIRED' })
    act(() => result.current.reset())
    await act(async () => { await result.current.start('f', 'p1') })
    await flush(1000)
    expect(result.current.phase).toBe('expired')
  })

  it('si se cae la red conserva el jobId y reanuda el mismo job sin crear otro', async () => {
    const create = vi.spyOn(tryOnService, 'createJob').mockResolvedValue({ jobId: 'job-3', status: 'PENDING' })
    const get = vi.spyOn(tryOnService, 'getJob').mockRejectedValue(new ApiError(0, 'sin red'))
    const { result } = renderHook(() => useTryOnJob())
    await act(async () => { await result.current.start('f', 'p1') })
    await flush(20000)
    expect(result.current.phase).toBe('offline')
    expect(result.current.jobId).toBe('job-3')

    get.mockResolvedValue({ jobId: 'job-3', status: 'COMPLETED', resultUrl: 'u', expiresAt: new Date(Date.now() + 60000).toISOString() })
    act(() => result.current.resume())
    await flush(1000)
    expect(result.current.phase).toBe('completed')
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('deja de consultar al cancelar', async () => {
    vi.spyOn(tryOnService, 'createJob').mockResolvedValue({ jobId: 'job-4', status: 'PENDING' })
    const get = vi.spyOn(tryOnService, 'getJob').mockResolvedValue({ jobId: 'job-4', status: 'PENDING' })
    const { result } = renderHook(() => useTryOnJob())
    await act(async () => { await result.current.start('f', 'p1') })
    act(() => result.current.cancel())
    await flush(10000)
    expect(get).not.toHaveBeenCalled()
    expect(result.current.phase).toBe('cancelled')
  })
})
