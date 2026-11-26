import { apiClient, ApiError } from '@/modules/core/api/apiClient'
import { mockDelay, mockSessionUser } from '@/modules/core/api/mock'
import { failIfScenario, failWithScenario, hasScenario } from '@/modules/core/api/mockScenario'
import { env } from '@/configs/env'
import { itemService } from '@/modules/catalogo/services/itemService'
import { MOCK_JOB_TIMES, TRYON_GARMENTS } from '../mocks/tryon'
import type {
  BiometricConsentStatusDto,
  GarmentValidationResponseDto,
  PhotoUploadResponseDto,
  TryOnGarmentDto,
  TryOnJobCreatedDto,
  TryOnJobRequestDto,
  TryOnJobStatusDto,
  TryOnQuotaDto,
  ZonaPrenda,
} from '../types/tryon.dto'

function mapTipoToZona(tipo?: string, noDisponible?: boolean): ZonaPrenda {
  if (noDisponible) return 'NO_COMPATIBLE'
  const t = (tipo || '').trim().toUpperCase()
  if (
    t === 'OUTERWEAR' ||
    t === 'FOOTWEAR' ||
    t === 'ACCESSORIES' ||
    /^(CHAQUETA|ABRIGO|GABARDINA|SACO|BLAZER|CALZADO|TENIS|ZAPATOS|BOTAS|ACCESORIO|CINTURON|CINTURÓN|BUFANDA|BOLSO|GORRA|GAFAS)$/i.test(t)
  ) {
    return 'NO_COMPATIBLE'
  }
  if (t === 'ONE_PIECE' || /^(VESTIDO|ENTERIZO|OVEROL|CONJUNTO)$/i.test(t)) {
    return 'CUERPO_COMPLETO'
  }
  if (t === 'BOTTOM' || /^(PANTALON|PANTALÓN|JEAN|FALDA|SHORT|BERMUDA|LEGGING|SUDADERA)$/i.test(t)) {
    return 'INFERIOR'
  }
  if (t === 'TOP' || /^(CAMISA|CAMISETA|BLUSA|POLO|BUZO|HOODIE|SUETER|SUÉTER|TOP|CHALECO)$/i.test(t)) {
    return 'SUPERIOR'
  }
  return 'NO_COMPATIBLE'
}

/* ---- estado del backend simulado (solo en memoria; nunca guarda la imagen) ---- */
const mock = {
  photos: new Set<string>(),
  jobs: new Map<string, { created: number; req: TryOnJobRequestDto; status: TryOnJobStatusDto['status'] }>(),
  keys: new Map<string, string>(),
  consent: false,
  seq: 0,
  quotas: {
    monthlyLimit: 10,
    usedCount: 2,
    remainingCount: 8,
    billingPeriod: 'Noviembre 2026',
  },
}
const id = (p: string) => `${p}-${Date.now().toString(36)}-${++mock.seq}`

export const tryOnService = {
  /** RF-24: prendas que se pueden probar desde Catálogo real (/api/v1/prendas). */
  async listGarments(): Promise<TryOnGarmentDto[]> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay(hasScenario('catalogo-vacio') ? [] : TRYON_GARMENTS)
    }
    const items = await itemService.search({})
    return items.map((item) => ({
      id: String(item.id),
      nombre: item.nombre || 'Prenda',
      tienda: item.tienda || 'StyleRadar Store',
      imagen: item.imagen || '',
      zona: mapTipoToZona(item.tipo, item.noDisponibleEnProbador),
      tallas: item.tallas?.length ? item.tallas : ['S', 'M', 'L'],
      disponible: !item.sinTablaMedidas && !item.noDisponibleEnProbador,
      precio: item.precio,
    }))
  },

  /** RF-24: validación de compatibilidad de prenda y talla con medidas */
  async validateGarment(
    garmentId: string,
    selectedSize?: string,
    selectedGarmentIds?: string[],
    userId?: string,
  ): Promise<GarmentValidationResponseDto> {
    if (env.useMocks) {
      failIfScenario()
      const g = TRYON_GARMENTS.find((x) => x.id === garmentId)
      if (!g || !g.disponible) {
        return mockDelay({
          garmentId,
          name: g?.nombre || 'Prenda no encontrada',
          category: 'TOP',
          imageUrl: g?.imagen || '',
          compatible: false,
          visible: false,
          zone: 'UPPER_BODY',
          validationMessage: 'Prenda no disponible en el catálogo.',
          sizeEligible: false,
          fitMessage: 'Prenda no disponible para prueba.',
          quotaAvailable: mock.quotas.remainingCount > 0,
        })
      }
      const isCompat = g.zona !== 'NO_COMPATIBLE'
      const sizeOk = selectedSize ? g.tallas.includes(selectedSize) : true
      return mockDelay({
        garmentId: g.id,
        name: g.nombre,
        category: g.zona === 'SUPERIOR' ? 'TOP' : 'BOTTOM',
        imageUrl: g.imagen,
        compatible: isCompat,
        visible: g.disponible,
        zone: g.zona === 'SUPERIOR' ? 'UPPER_BODY' : 'LOWER_BODY',
        validationMessage: isCompat ? 'Prenda compatible y elegible para prueba virtual.' : 'Esta categoría no admite probador virtual.',
        sizeEligible: isCompat && sizeOk,
        fitMessage: isCompat
          ? sizeOk
            ? `Talla ${selectedSize || 'habitual'} compatible con tus medidas.`
            : `La talla ${selectedSize} puede quedar ajustada.`
          : 'Categoría no compatible con el probador.',
        quotaAvailable: mock.quotas.remainingCount > 0,
      })
    }
    return apiClient
      .get<GarmentValidationResponseDto>(`/api/v1/try-on/garments/${encodeURIComponent(garmentId)}/validate`, {
        params: {
          selectedSize,
          ...(selectedGarmentIds?.length ? { selectedGarmentIds: selectedGarmentIds.join(',') } : {}),
          ...(userId ? { userId } : {}),
        },
      })
      .then((r) => r.data)
  },

  /** SR-P5-N02: consultar cuotas disponibles del probador virtual */
  async getQuotas(userId?: string): Promise<TryOnQuotaDto> {
    if (env.useMocks) {
      failIfScenario()
      return mockDelay({ ...mock.quotas })
    }
    return apiClient
      .get<TryOnQuotaDto>('/api/v1/try-on/quotas', { params: userId ? { userId } : undefined })
      .then((r) => r.data)
  },

  /** RF-23: consultar foto/silueta activa del usuario (GET /api/v1/try-on/photos/{userId}) */
  async getActivePhoto(userId?: string): Promise<PhotoUploadResponseDto | null> {
    if (env.useMocks) {
      failIfScenario()
      if (mock.photos.size === 0) return mockDelay(null)
      const photoId = Array.from(mock.photos).pop()!
      return mockDelay({ photoId, photoUrl: '' })
    }
    const uid = userId || mockSessionUser()?.id
    if (!uid) return null
    return apiClient
      .get<PhotoUploadResponseDto>(`/api/v1/try-on/photos/${encodeURIComponent(uid)}`)
      .then((r) => r.data)
      .catch(() => null)
  },

  /** RF-23: sube la foto frontal con progreso real de subida. */
  async uploadPhoto(file: File, onProgress?: (pct: number) => void, signal?: AbortSignal, userId?: string): Promise<PhotoUploadResponseDto> {
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
      return { photoId, photoUrl: URL.createObjectURL(file) }
    }
    const form = new FormData()
    form.append('photo', file)
    form.append('biometricConsent', 'true')
    if (userId) form.append('userId', String(userId))
    return apiClient.post<PhotoUploadResponseDto>('/api/v1/try-on/photos', form, {
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
    const payload: TryOnJobRequestDto = {
      ...req,
      biometricConsent: req.biometricConsent ?? true,
    }
    if (env.useMocks) {
      failIfScenario()
      if (hasScenario('consentimiento') && !mock.consent) throw new ApiError(400, 'Falta el consentimiento (Ley 1581).', 'CONSENT_REQUIRED')
      if (hasScenario('cuota-agotada') || mock.quotas.remainingCount <= 0) throw new ApiError(429, 'Alcanzaste tu límite mensual de pruebas.', 'QUOTA_EXCEEDED')
      failWithScenario('prenda-no-probable', 400, 'INVALID_GARMENT')
      failWithScenario('ia-lenta', 504, 'AI_TIMEOUT')
      if (!mock.photos.has(req.photoId)) throw new ApiError(404, 'La foto ya no existe. Súbela otra vez.', 'JOB_NOT_FOUND')
      const g = TRYON_GARMENTS.find((x) => x.id === req.garmentId)
      if (!g || !g.disponible || g.zona === 'NO_COMPATIBLE') throw new ApiError(400, 'Esa prenda no se puede probar.', 'INVALID_GARMENT')
      const prev = mock.keys.get(idempotencyKey)
      if (prev) return mockDelay({ jobId: prev, status: 'PENDING' as const })
      const jobId = id('job')
      mock.keys.set(idempotencyKey, jobId)
      mock.jobs.set(jobId, { created: Date.now(), req, status: 'PENDING' })
      mock.quotas.usedCount++
      mock.quotas.remainingCount = Math.max(0, mock.quotas.monthlyLimit - mock.quotas.usedCount)
      return mockDelay({ jobId, status: 'PENDING' as const }, 250)
    }
    return apiClient.post<TryOnJobCreatedDto>('/api/v1/try-on/jobs', payload, { headers: { 'Idempotency-Key': idempotencyKey } }).then((r) => r.data)
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
      if (hasScenario('silueta')) return mockDelay({ jobId, status: 'FAILED' as const, error: 'SILHOUETTE_NOT_DETECTED', errorMessage: 'Silueta humana no detectada.' }, 120)
      if (hasScenario('job-falla')) return mockDelay({ jobId, status: 'FAILED' as const, error: 'El proveedor de IA no respondió.', errorMessage: 'El proveedor de IA no respondió.' }, 120)
      if (hasScenario('job-expira')) return mockDelay({ jobId, status: 'EXPIRED' as const }, 120)
      const g = TRYON_GARMENTS.find((x) => x.id === job.req.garmentId)!
      const expires = hasScenario('resultado-expirado') ? Date.now() - 1000 : Date.now() + 15 * 60 * 1000
      job.status = 'COMPLETED'
      return mockDelay({
        jobId,
        status: 'COMPLETED' as const,
        garmentId: job.req.garmentId,
        garmentName: g.nombre,
        progress: 100,
        resultUrl: g.imagen,
        resultImageUrl: g.imagen,
        expiresAt: new Date(expires).toISOString(),
        createdAt: new Date(job.created).toISOString(),
        completedAt: new Date(job.created + MOCK_JOB_TIMES.done).toISOString(),
      }, 120)
    }
    return apiClient
      .get<TryOnJobStatusDto>(`/api/v1/try-on/jobs/${encodeURIComponent(jobId)}`)
      .then((r) => {
        const rawUrl = r.data.resultImageUrl || r.data.resultUrl
        const sanitizedUrl = typeof rawUrl === 'string'
          ? rawUrl.replace('styleradarpt8080blobqa.blob.core.windows.net', 'styleradarpt8080blob.blob.core.windows.net')
          : rawUrl
        return {
          ...r.data,
          resultUrl: sanitizedUrl,
          resultImageUrl: sanitizedUrl,
        }
      })
  },

  /** SR-P5-N03: consultar historial de pruebas virtuales del usuario */
  async listJobs(userId?: string): Promise<TryOnJobStatusDto[]> {
    if (env.useMocks) {
      failIfScenario()
      const list: TryOnJobStatusDto[] = []
      for (const [jId, jData] of mock.jobs.entries()) {
        const g = TRYON_GARMENTS.find((x) => x.id === jData.req.garmentId)
        list.push({
          jobId: jId,
          status: jData.status,
          garmentId: jData.req.garmentId,
          garmentName: g?.nombre || 'Prenda StyleRadar',
          resultUrl: g?.imagen,
          resultImageUrl: g?.imagen,
          createdAt: new Date(jData.created).toISOString(),
        })
      }
      return mockDelay(list.reverse(), 200)
    }
    return apiClient
      .get<TryOnJobStatusDto[]>('/api/v1/try-on/jobs', { params: userId ? { userId } : undefined })
      .then((r) => r.data.map((j) => {
        const rawUrl = j.resultImageUrl || j.resultUrl
        const sanitizedUrl = typeof rawUrl === 'string'
          ? rawUrl.replace('styleradarpt8080blobqa.blob.core.windows.net', 'styleradarpt8080blob.blob.core.windows.net')
          : rawUrl
        return {
          ...j,
          resultUrl: sanitizedUrl,
          resultImageUrl: sanitizedUrl,
        }
      }))
  },

  /** SR-P5-N01: consultar estado de consentimiento biométrico */
  async getConsent(userId?: string): Promise<BiometricConsentStatusDto> {
    if (env.useMocks) {
      failIfScenario()
      const u = userId || mockSessionUser()?.id || 'u-mock'
      return mockDelay({
        consentId: `cons-${u}`,
        userId: u,
        accepted: mock.consent,
        termsVersion: 'v1.0-LEY1581-2026',
        purposes: ['VIRTUAL_TRY_ON_INFERENCE', 'TEMPORARY_SILHOUETTE_STORAGE'],
      })
    }
    const uid = userId || mockSessionUser()?.id
    if (!uid) {
      return { userId: '', accepted: false, termsVersion: 'v1.0-LEY1581-2026' }
    }
    return apiClient.get<BiometricConsentStatusDto>(`/api/v1/try-on/consents/${encodeURIComponent(uid)}`).then((r) => r.data)
  },

  /**
   * SR-P5-N01: otorgar autorización del tratamiento de la foto (Ley 1581).
   * POST /api/v1/try-on/consents
   */
  async giveConsent(userId?: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      await mockDelay(null, 250)
      mock.consent = true
      return
    }
    const uid = userId || mockSessionUser()?.id
    await apiClient.post('/api/v1/try-on/consents', {
      userId: uid,
      termsVersion: 'v1.0-LEY1581-2026',
      accepted: true,
      purposes: [
        'PROBADOR_VIRTUAL',
        'ALMACENAMIENTO_TEMPORAL_FOTOGRAFIA',
        'VIRTUAL_TRY_ON_INFERENCE',
        'TEMPORARY_SILHOUETTE_STORAGE',
      ],
    })
  },

  /** SR-P5-N01: revocar consentimiento biométrico (DELETE /api/v1/try-on/consents/{userId}) */
  async revokeConsent(userId?: string): Promise<void> {
    if (env.useMocks) {
      failIfScenario()
      await mockDelay(null, 250)
      mock.consent = false
      mock.photos.clear()
      return
    }
    const uid = userId || mockSessionUser()?.id || ''
    await apiClient.delete(`/api/v1/try-on/consents/${encodeURIComponent(uid)}`)
  },

  /** RF-27: borrado físico de la foto y de los resultados generados con ella (DELETE /api/v1/try-on/personal-photos/{jobId}) */
  async deletePhoto(photoOrJobId: string): Promise<void> {
    if (env.useMocks) {
      await mockDelay(null, 400)
      failIfScenario('borrado-falla')
      mock.photos.delete(photoOrJobId)
      for (const [k, j] of mock.jobs) if (j.req.photoId === photoOrJobId || k === photoOrJobId) mock.jobs.delete(k)
      return
    }
    return apiClient
      .delete(`/api/v1/try-on/personal-photos/${encodeURIComponent(photoOrJobId)}`)
      .then(() => undefined)
  },
}
