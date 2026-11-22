import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { env } from '@/configs/env'
import { ResultViewer } from '../components/ResultViewer'
import { useTryOnJob } from '../hooks/useTryOnJob'
import { tryOnService } from '../services/tryOnService'
import TryOnPage from '../pages/TryOnPage'
import { renderAt } from './helpers'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Integración real TryOn ↔ PT8080-VirtualTryOn-Service', () => {
  it('ResultViewer: cuando TryOnJobResponse viene SIN expiresAt, muestra la imagen y no la marca expirada', () => {
    renderAt('/probador/avanzado', [
      {
        path: '/probador/avanzado',
        element: (
          <ResultViewer
            result={{
              jobId: 'job-real-1',
              status: 'COMPLETED',
              resultImageUrl: 'https://styleradar.blob.core.windows.net/results/res.png?sig=abc',
              completedAt: new Date().toISOString(),
            }}
            garmentName="Camisa lino"
            garmentId="p-1"
            garmentPrice={120000}
            onRegenerate={vi.fn()}
            onRefreshLink={vi.fn()}
            onOtherGarment={vi.fn()}
          />
        ),
      },
    ])

    expect(screen.getByAltText('Resultado de la prueba con Camisa lino')).toBeInTheDocument()
    expect(screen.queryByText('El resultado ya no está disponible')).not.toBeInTheDocument()
  })

  it('TryOnPage: cuando getConsent responde 400 CONSENT_REQUIRED, muestra el flujo de aceptación Ley 1581', async () => {
    vi.spyOn(tryOnService, 'getConsent').mockRejectedValueOnce(
      new ApiError(400, 'Falta consentimiento', 'CONSENT_REQUIRED'),
    )
    vi.spyOn(tryOnService, 'listGarments').mockResolvedValueOnce([])

    renderAt('/probador/avanzado', [{ path: '/probador/avanzado', element: <TryOnPage /> }])

    expect(
      await screen.findByText(/Autorizo expresamente el uso en el probador virtual/i),
    ).toBeInTheDocument()
    const acceptBtn = screen.getByRole('button', { name: 'Aceptar y continuar' })
    expect(acceptBtn).toBeDisabled()
  })

  it('useTryOnJob: detiene el polling inmediatamente cuando el backend responde CANCELLED', async () => {
    vi.useFakeTimers()
    vi.spyOn(tryOnService, 'createJob').mockResolvedValueOnce({ jobId: 'job-cancel-1', status: 'QUEUED' })
    const getJobSpy = vi.spyOn(tryOnService, 'getJob').mockResolvedValueOnce({
      jobId: 'job-cancel-1',
      status: 'CANCELLED',
    })

    const { result } = renderHook(() => useTryOnJob(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    })

    await act(async () => {
      await result.current.start('foto-1', 'prenda-1', 'M')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })

    expect(result.current.phase).toBe('cancelled')
    expect(result.current.active).toBe(false)
    expect(getJobSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000)
    })
    expect(getJobSpy).toHaveBeenCalledTimes(1)
  })

  it('apiClient: cuando se envía FormData, elimina Content-Type para no forzar application/json', async () => {
    const originalUseMocks = env.useMocks
    env.useMocks = false
    const capturedHeaders: Record<string, unknown>[] = []

    const mockAdapter = vi.fn(async (config) => {
      capturedHeaders.push({
        contentType: config.headers?.get ? config.headers.get('Content-Type') : config.headers?.['Content-Type'],
      })
      return { data: { photoId: 'ph-1', photoUrl: 'https://sas.example/ph.png' }, status: 201, statusText: 'Created', headers: {}, config }
    })

    try {
      const form = new FormData()
      form.append('photo', new Blob(['img'], { type: 'image/png' }), 'test.png')
      await apiClient.post('/api/v1/try-on/photos', form, { adapter: mockAdapter })

      await waitFor(() => expect(mockAdapter).toHaveBeenCalledTimes(1))
      expect(capturedHeaders[0].contentType).not.toBe('application/json')
      expect(String(capturedHeaders[0].contentType ?? '')).not.toContain('application/json')
    } finally {
      env.useMocks = originalUseMocks
    }
  })
})
