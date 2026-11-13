import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario, hasScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { MOCK_JOB_TIMES, TRYON_GARMENTS } from '../mocks/tryon'
import type { PhotoUploadResponseDto, TryOnGarmentDto, TryOnJobCreatedDto, TryOnJobRequestDto, TryOnJobStatusDto } from '../types/tryon.dto'

/* ---- estado del backend simulado (solo en memoria; nunca guarda la imagen) ---- */
const mock = {
  photos: new Set<string>(),
  jobs: new Map<string, { created: number; req: TryOnJobRequestDto }>(),
  keys: new Map<string, string>(),
  consent: false,
  seq: 0,
}
const id = (p: string) => `${p}-${Date.now().toString(36)}-${++mock.seq}`

export const tryOnService = {
  /** RF-24: prendas que se pueden probar. */
  async listGarments(): Promise<TryOnGarmentDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(hasScenario('catalogo-vacio') ? [] : TRYON_GARMENTS)
    }
    return apiClient.get<TryOnGarmentDto[]>('/api/tryon/garments').then((r) => r.data)
  },

  /** RF-23: sube la foto frontal con progreso real de subida. */
  async uploadPhoto(file: File, onProgress?: (pct: number) => void, signal?: AbortSignal): Promise<PhotoUploadResponseDto> {
    if (env.useMocks) {
      for (const pct of [15, 40, 70, 100]) {
        if (signal?.aborted) throw new ApiError(0, 'Subida cancelada.')
        await new Promise((r) => setTimeout(r, 180))
        onProgress?.(pct)
      }
      failIfScenario('subida-falla')
      failWithScenario('foto-formato', 400, 'VALIDATION_FAILED')
      failWithScenario('foto-pesada', 413, 'PAYLOAD_TOO_LARGE')
      failWithScenario('foto-dimensiones', 422, 'INVALID_PHOTO_DIMENSIONS')
      const photoId = id('foto')
      mock.photos.add(photoId)
      return { photoId }
    }
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<PhotoUploadResponseDto>('/api/tryon/photos', form, {
      timeout: 60000,
      signal,
      onUploadProgress: (e) => { if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100)) },
    }).then((r) => r.data)
  },

  /**
   * RF-25: crea el job y devuelve 202 con jobId. La clave de idempotencia evita jobs
   * duplicados si la petición se reenvía (doble clic o red inestable).
   */
  async createJob(req: TryOnJobRequestDto, idempotencyKey: string): Promise<TryOnJobCreatedDto> {
    if (env.useMocks) {
      failIfScenario()
      if (hasScenario('consentimiento') && !mock.consent) throw new ApiError(400, 'Falta el consentimiento (Ley 1581).', 'CONSENT_REQUIRED')
      failWithScenario('cuota-agotada', 429, 'QUOTA_EXCEEDED')
      failWithScenario('prenda-no-probable', 400, 'INVALID_GARMENT')
      failWithScenario('ia-lenta', 504, 'AI_TIMEOUT')
      if (!mock.photos.has(req.photoId)) throw new ApiError(404, 'La foto ya no existe. Súbela otra vez.', 'JOB_NOT_FOUND')
      const g = TRYON_GARMENTS.find((x) => x.id === req.garmentId)
      if (!g || !g.disponible || g.zona === 'NO_COMPATIBLE') throw new ApiError(400, 'Esa prenda no se puede probar.', 'INVALID_GARMENT')
      const prev = mock.keys.get(idempotencyKey)
      if (prev) return mockDelay({ jobId: prev, status: 'PENDING' as const })
      const jobId = id('job')
      mock.keys.set(idempotencyKey, jobId)
      mock.jobs.set(jobId, { created: Date.now(), req })
      return mockDelay({ jobId, status: 'PENDING' as const }, 250)
    }
    return apiClient.post<TryOnJobCreatedDto>('/api/tryon/jobs', req, { headers: { 'Idempotency-Key': idempotencyKey } }).then((r) => r.data)
  },

  /** RF-25/26: estado del job. Solo el dueño lo puede consultar (403 si no). */
  async getJob(jobId: string): Promise<TryOnJobStatusDto> {
    if (env.useMocks) {
      failIfScenario()
      failWithScenario('prueba-no-existe', 404, 'JOB_NOT_FOUND')
      const job = mock.jobs.get(jobId)
      if (!job) throw new ApiError(404, 'No encontramos esa prueba.', 'JOB_NOT_FOUND')
      const t = Date.now() - job.created
      if (t < MOCK_JOB_TIMES.pending) return mockDelay({ jobId, status: 'PENDING' as const, progress: 10 }, 120)
      if (t < MOCK_JOB_TIMES.done) return mockDelay({ jobId, status: 'PROCESSING' as const, progress: Math.round(20 + (t / MOCK_JOB_TIMES.done) * 70) }, 120)
      if (hasScenario('silueta')) return mockDelay({ jobId, status: 'FAILED' as const, error: 'SILHOUETTE_NOT_DETECTED' }, 120)
      if (hasScenario('job-falla')) return mockDelay({ jobId, status: 'FAILED' as const, error: 'El proveedor de IA no respondió.' }, 120)
      if (hasScenario('job-expira')) return mockDelay({ jobId, status: 'EXPIRED' as const }, 120)
      const g = TRYON_GARMENTS.find((x) => x.id === job.req.garmentId)!
      const expires = hasScenario('resultado-expirado') ? Date.now() - 1000 : Date.now() + 10 * 60 * 1000
      return mockDelay({ jobId, status: 'COMPLETED' as const, progress: 100, resultUrl: g.imagen, expiresAt: new Date(expires).toISOString() }, 120)
    }
    return apiClient.get<TryOnJobStatusDto>(`/api/tryon/jobs/${encodeURIComponent(jobId)}`).then((r) => r.data)
  },

  /**
   * Ley 1581: autorización del tratamiento de la foto. Sin ella, el servidor responde 400 CONSENT_REQUIRED.
   * Ruta provisional como las demás; el contrato del servicio está en POST /api/v1/try-on/consents.
   */
  async giveConsent(): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      await mockDelay(null, 250)
      mock.consent = true
      return
    }
    await apiClient.post('/api/tryon/consents', {
      termsVersion: 'v1.0-LEY1581-2026',
      accepted: true,
      purposes: ['VIRTUAL_TRY_ON_INFERENCE', 'TEMPORARY_SILHOUETTE_STORAGE'],
    })
  },

  /** RF-27: borrado físico de la foto y de los resultados generados con ella. */
  async deletePhoto(photoId: string): Promise<void> {
    if (env.useMocks) {
      await mockDelay(null, 400)
      failIfScenario('borrado-falla')
      mock.photos.delete(photoId)
      for (const [k, j] of mock.jobs) if (j.req.photoId === photoId) mock.jobs.delete(k)
      return
    }
    await apiClient.delete(`/api/tryon/photos/${encodeURIComponent(photoId)}`)
  },
}
