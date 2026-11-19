import { useEffect, useRef, useState, useContext, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useResource } from '@/modules/core/hooks/useResource'
import { Aviso, BTN_PRINCIPAL, BTN_SECUNDARIO } from '@/modules/core/components/Aviso'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { PlanGate } from '@/modules/transacciones/components/PlanGate'
import { useUserPlan } from '@/modules/transacciones/hooks/useUserPlan'
import { getTryOnPhotoUses, setTryOnPhotoUses } from '@/modules/transacciones/services/userPlanService'
import { PLAN_LIMITS } from '@/modules/transacciones/types/plan.dto'
import { GarmentSelector } from '../components/GarmentSelector'
import { garmentProblem } from '../utils/garments'
import { PhotoPicker, type UploadedPhoto } from '../components/PhotoPicker'
import { ResultViewer } from '../components/ResultViewer'
import { useTryOnJob } from '../hooks/useTryOnJob'
import { problemaPrueba, problemaResultado, type ProblemaPrueba } from '../utils/tryOnRules'
import { tryOnService } from '../services/tryOnService'
import type {
  BiometricConsentStatusDto,
  GarmentValidationResponseDto,
  TryOnGarmentDto,
  TryOnJobStatusDto,
  TryOnQuotaDto,
} from '../types/tryon.dto'

/** Probador virtual: RF-23 (foto), RF-24 (prenda/talla), RF-25 (job), RF-26 (resultado), SR-P5-N01 (consentimiento), SR-P5-N02 (cuotas) y SR-P5-N03 (historial). */
export default function TryOnPage() {
  const auth = useContext(AuthContext)
  const user = auth?.user ?? null
  const isBuyer = user?.role === 'COMPRADOR'
  const { plan: userPlan } = useUserPlan(isBuyer)
  const userId = user?.id ?? 'u-1'

  const [photo, setPhoto] = useState<UploadedPhoto | null>(null)
  const [tryOnUses, setTryOnUsesState] = useState<number>(() => getTryOnPhotoUses(userId))
  const { data: garments, loading: gLoading, error: gError, reload: loadGarments } = useResource(tryOnService.listGarments, [] as TryOnGarmentDto[])
  const [garmentId, setGarmentId] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [garmentValidation, setGarmentValidation] = useState<GarmentValidationResponseDto | null>(null)
  const [validatingSize, setValidatingSize] = useState(false)

  /* Cuotas (SR-P5-N02) */
  const [quotas, setQuotas] = useState<TryOnQuotaDto | null>(null)

  /* Historial de pruebas (SR-P5-N03) */
  const [historyJobs, setHistoryJobs] = useState<TryOnJobStatusDto[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  /* Consentimiento biométrico (SR-P5-N01) */
  const [consentStatus, setConsentStatus] = useState<BiometricConsentStatusDto | null>(null)
  const [confirmRevokeConsent, setConfirmRevokeConsent] = useState(false)
  const [revokingConsent, setRevokingConsent] = useState(false)

  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [delMsg, setDelMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const job = useTryOnJob()
  const selectorRef = useRef<HTMLElement>(null)
  const fotoRef = useRef<HTMLElement>(null)

  /** Ley 1581: qué se estaba haciendo cuando el servidor pidió la autorización. */
  const [consent, setConsent] = useState<null | 'foto' | 'prueba'>(null)
  const [consintiendo, setConsintiendo] = useState(false)
  const [consentMsg, setConsentMsg] = useState('')

  const loadQuotas = useCallback(async () => {
    try {
      const q = await tryOnService.getQuotas(userId)
      setQuotas(q)
    } catch {
      // Si falla, se mantiene fallback local
    }
  }, [userId])

  const loadConsent = useCallback(async () => {
    try {
      const c = await tryOnService.getConsent(userId)
      setConsentStatus(c)
    } catch {
      // Fallback
    }
  }, [userId])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const jobs = await tryOnService.listJobs(userId)
      setHistoryJobs(jobs)
    } catch {
      // Ignorar fallo silencioso de historial
    } finally {
      setLoadingHistory(false)
    }
  }, [userId])

  useEffect(() => {
    loadQuotas()
    loadConsent()
    loadHistory()
  }, [loadQuotas, loadConsent, loadHistory])

  // Límite de cuotas mensual
  const limitReached =
    (isBuyer && userPlan === 'RADAR' && tryOnUses >= PLAN_LIMITS.probadorFoto) ||
    (quotas !== null && quotas.remainingCount <= 0)

  // La URL temporal de la foto se libera al salir de la pantalla.
  const photoUrl = photo?.previewUrl
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const garment = garments.find((g) => g.id === garmentId)

  // Validación de compatibilidad anatómica (RF-24)
  useEffect(() => {
    if (!garmentId) {
      setGarmentValidation(null)
      return
    }
    const g = garments.find((x) => x.id === garmentId)
    const sizeToValidate = selectedSize || g?.tallas[0] || 'M'
    setValidatingSize(true)
    tryOnService
      .validateGarment(garmentId, sizeToValidate)
      .then((val) => setGarmentValidation(val))
      .catch(() => setGarmentValidation(null))
      .finally(() => setValidatingSize(false))
  }, [garmentId, selectedSize, garments])

  const canStart = !!photo && !!garment && !garmentProblem(garment) && !job.active && !limitReached

  const startTry = () => {
    if (limitReached) return
    if (photo && garment && !garmentProblem(garment)) {
      const nextCount = tryOnUses + 1
      setTryOnPhotoUses(nextCount, userId)
      setTryOnUsesState(nextCount)
      job.start(photo.photoId, garment.id, selectedSize || garment.tallas[0])
    }
  }

  // Refrescar cuotas e historial cuando el job culmine
  useEffect(() => {
    if (job.phase === 'completed' || job.phase === 'failed') {
      loadQuotas()
      loadHistory()
    }
  }, [job.phase, loadQuotas, loadHistory])

  const otherGarment = () => {
    job.reset()
    setGarmentId(null)
    setSelectedSize(null)
    setGarmentValidation(null)
    selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const otherPhoto = () => {
    job.reset()
    setPhoto(null)
    fotoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const aceptarConsentimiento = async () => {
    const venia = consent
    setConsintiendo(true)
    setConsentMsg('')
    try {
      await tryOnService.giveConsent(userId)
      setConsent(null)
      loadConsent()
      if (venia === 'prueba') {
        job.reset()
        startTry()
      }
    } catch {
      setConsentMsg('No pudimos guardar tu autorización. Intenta de nuevo.')
    } finally {
      setConsintiendo(false)
    }
  }

  const handleRevokeConsent = async () => {
    setRevokingConsent(true)
    try {
      await tryOnService.revokeConsent(userId)
      setConsentStatus(null)
      setPhoto(null)
      job.reset()
      setDelMsg({ ok: true, text: 'Revocaste tu consentimiento biométrico. Tu foto y registros fueron purgados.' })
    } catch {
      setDelMsg({ ok: false, text: 'No se pudo revocar el consentimiento en este momento. Intenta más tarde.' })
    } finally {
      setRevokingConsent(false)
      setConfirmRevokeConsent(false)
    }
  }

  /** Botones que resuelven cada problema de la prueba. */
  const accionesDe = (p: ProblemaPrueba) => {
    switch (p.accion) {
      case 'consentimiento':
        return (
          <>
            <button type="button" onClick={() => setConsent('prueba')} className={BTN_PRINCIPAL}>
              Ver y aceptar
            </button>
            <button type="button" onClick={job.reset} className={BTN_SECUNDARIO}>
              Ahora no
            </button>
          </>
        )
      case 'planes':
        return <Link to="/planes" className={BTN_PRINCIPAL}>Ver Radar+</Link>
      case 'otra-foto':
        return <button type="button" onClick={otherPhoto} className={BTN_PRINCIPAL}>Subir otra foto</button>
      case 'otra-prenda':
        return <button type="button" onClick={otherGarment} className={BTN_PRINCIPAL}>Elegir otra prenda</button>
      case 'volver':
        return <button type="button" onClick={job.reset} className={BTN_PRINCIPAL}>Volver al probador</button>
      case 'iniciar-sesion':
        return <Link to="/login" className={BTN_PRINCIPAL}>Iniciar sesión</Link>
      default:
        return <button type="button" onClick={() => { job.reset(); startTry() }} className={BTN_PRINCIPAL}>Reintentar</button>
    }
  }

  const problema = job.phase === 'error' ? problemaPrueba(job.error) : job.phase === 'failed' ? problemaResultado(job.result?.error || job.result?.errorMessage) : null

  const deletePhoto = async () => {
    if (!photo) return
    setDeleting(true)
    setDelMsg(null)
    try {
      await tryOnService.deletePhoto(photo.photoId)
      job.reset()
      setPhoto(null)
      setDelMsg({ ok: true, text: 'Eliminamos tu foto y los resultados generados con ella.' })
    } catch {
      setDelMsg({ ok: false, text: 'No tenemos confirmación de que tu foto se haya borrado. Intenta de nuevo.' })
    } finally {
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  const openPastResult = (histJob: TryOnJobStatusDto) => {
    const matchedGarment = garments.find((g) => g.id === histJob.garmentId)
    if (matchedGarment) {
      setGarmentId(matchedGarment.id)
    }
    job.openCompleted(histJob)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="sr-probador-page min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">Probador virtual · Bogotá</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--color-text)] md:text-5xl">Pruébate una prenda con IA sobre tu silueta</h1>
        </div>

        {/* Indicador de cuotas mensuales (SR-P5-N02) */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-right shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)]">Cuota mensual (RF-24 / N02)</p>
          <p className="text-sm font-extrabold text-[var(--color-text)]">
            {quotas
              ? `${quotas.remainingCount} de ${quotas.monthlyLimit} pruebas disponibles`
              : `${PLAN_LIMITS.probadorFoto - tryOnUses} de ${PLAN_LIMITS.probadorFoto} disponibles`}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {quotas?.billingPeriod || 'Periodo mensual'} · {userPlan === 'RADAR_PLUS' ? 'Plan Radar+' : 'Plan Radar'}
          </p>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">
        Sube tu foto frontal autorizada, elige una prenda y su talla, valida la compatibilidad corporal y genera tu visualización virtual. Tu foto es privada conforme a la Ley 1581 de 2012 y puedes eliminarla o revocar el consentimiento en cualquier momento.
      </p>

      {/* Barra de consentimiento y privacidad biométrica (SR-P5-N01) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 text-xs text-[var(--color-text)] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>
            <strong>Tratamiento biométrico:</strong> {consentStatus?.accepted ? 'Autorizado (Ley 1581 / v1.0)' : 'Pendiente de autorización expresa'}
          </span>
        </div>
        {consentStatus?.accepted && (
          <button
            type="button"
            onClick={() => setConfirmRevokeConsent(true)}
            className="font-semibold text-[var(--color-danger-text,#ff8a8a)] hover:underline"
          >
            Revocar consentimiento
          </button>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-8">
          <section ref={fotoRef} aria-labelledby="t-foto" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="t-foto" className="text-lg font-bold text-[var(--color-text)]">1. Tu foto frontal</h2>
              {isBuyer && (
                <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                  {userPlan === 'RADAR_PLUS'
                    ? 'Probador con foto propia · Sin límite (Radar+)'
                    : `Saldo: ${quotas?.remainingCount ?? PLAN_LIMITS.probadorFoto - tryOnUses} pruebas`}
                </span>
              )}
            </div>
            {limitReached && (
              <p role="alert" className="mt-3 rounded-xl border border-[var(--color-danger-border,#ff8a8a)] bg-[var(--color-danger-bg,rgba(220,38,38,0.12))] p-3 text-xs font-semibold text-[var(--color-danger-text,#ff8a8a)]">
                Alcanzaste el límite de pruebas del probador virtual de tu periodo mensual. Pásate a Radar+ para continuar probando prendas sin límite.
              </p>
            )}
            <div className="mt-4">
              <PlanGate title="Pruébate la ropa sobre tu foto con Radar+" text="Con el plan Radar usas el maniquí. Radar+ te deja subir tu foto de cuerpo entero y ver las prendas sobre ti.">
                <PhotoPicker
                  photo={photo}
                  onUploaded={(p) => {
                    setDelMsg(null)
                    job.reset()
                    setPhoto(p)
                  }}
                  onConsentRequired={() => setConsent('foto')}
                />
              </PlanGate>
            </div>
            {photo && (
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                className="mt-4 text-sm text-[var(--color-danger-text,#ff8a8a)] underline underline-offset-4 hover:brightness-110"
              >
                Eliminar mi foto y resultados
              </button>
            )}
            {delMsg && (
              <div
                role={delMsg.ok ? 'status' : 'alert'}
                className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm border ${
                  delMsg.ok
                    ? 'bg-[var(--color-success-bg,rgba(30,107,58,0.12))] text-[var(--color-success-text,#144a27)] border-[var(--color-success-border,#1e6b3a)]'
                    : 'bg-[var(--color-danger-bg,rgba(220,38,38,0.12))] text-[var(--color-danger-text,#ff8a8a)] border-[var(--color-danger-border,#ff8a8a)]'
                }`}
              >
                <span>{delMsg.text}</span>
                {!delMsg.ok && <button type="button" onClick={deletePhoto} className="ml-2 font-semibold underline">Reintentar</button>}
              </div>
            )}
          </section>

          <section ref={selectorRef} aria-labelledby="t-prenda" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <h2 id="t-prenda" className="text-lg font-bold text-[var(--color-text)]">2. Elige una prenda y tu talla</h2>
            <div className="mt-4">
              <GarmentSelector
                garments={garments}
                loading={gLoading}
                error={gError}
                onRetry={loadGarments}
                selected={garmentId}
                selectedSize={selectedSize}
                validation={garmentValidation}
                validatingSize={validatingSize}
                onSelect={(id) => {
                  if (!job.active) {
                    setGarmentId(id)
                    const g = garments.find((x) => x.id === id)
                    setSelectedSize(g?.tallas[0] || 'M')
                    if (job.phase !== 'idle') job.reset()
                  }
                }}
                onSelectSize={(size) => {
                  if (!job.active) {
                    setSelectedSize(size)
                    if (job.phase !== 'idle') job.reset()
                  }
                }}
              />
            </div>
          </section>

          {/* Historial de pruebas anteriores (SR-P5-N03 & RF-26) */}
          <section aria-labelledby="t-historial" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="t-historial" className="text-lg font-bold text-[var(--color-text)]">Mis pruebas anteriores</h2>
                <p className="text-xs text-[var(--color-text-muted)]">Reabre tus visualizaciones previas sin crear nuevos trabajos ni gastar cuota.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHistory((prev) => !prev)
                  if (!showHistory && !historyJobs.length) loadHistory()
                }}
                className="text-xs font-bold text-[var(--color-accent)] hover:underline"
              >
                {showHistory ? 'Ocultar historial' : `Ver historial (${historyJobs.length})`}
              </button>
            </div>

            {showHistory && (
              <div className="mt-4">
                {loadingHistory ? (
                  <p className="text-xs text-[var(--color-text-muted)] animate-pulse">Cargando tu historial de pruebas…</p>
                ) : historyJobs.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">Aún no has generado pruebas en este periodo.</p>
                ) : (
                  <ul className="divide-y divide-[var(--color-border)]" aria-label="Lista de pruebas anteriores">
                    {historyJobs.map((hj) => (
                      <li key={hj.jobId} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          {hj.resultUrl || hj.resultImageUrl ? (
                            <img src={hj.resultUrl || hj.resultImageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-xs">
                              📸
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-[var(--color-text)]">{hj.garmentName || 'Prueba virtual'}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">
                              Estado: <span className="font-bold">{hj.status}</span> · {hj.createdAt ? new Date(hj.createdAt).toLocaleDateString('es-CO') : ''}
                            </p>
                          </div>
                        </div>
                        {hj.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => openPastResult(hj)}
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1 text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]"
                          >
                            Abrir resultado
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>

        <aside aria-labelledby="t-resultado" className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm lg:sticky lg:top-24">
          <h2 id="t-resultado" className="text-lg font-bold text-[var(--color-text)]">3. Resultado de la prueba</h2>
          {!photo && <p className="mt-3 text-sm text-[var(--color-text-muted)]">Primero sube tu foto frontal autorizada.</p>}
          {photo && !garment && <p className="mt-3 text-sm text-[var(--color-text-muted)]">Ahora elige una prenda y tu talla.</p>}

          {photo && garment && job.phase === 'idle' && (
            <div className="mt-4">
              <button
                type="button"
                onClick={startTry}
                disabled={!canStart}
                className="w-full rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-5 py-3 font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50 transition-all shadow-sm"
              >
                Probarme {garment.nombre}
              </button>
              {limitReached && (
                <p className="mt-2 text-center text-xs text-[var(--color-danger-text,#ff8a8a)]">
                  Cuotas mensuales agotadas. Pasa a Radar+ para continuar.
                </p>
              )}
            </div>
          )}

          {job.active && (
            <div className="mt-4" role="status" aria-live="polite">
              <p className="font-semibold text-[var(--color-text)]">{job.phase === 'creating' ? 'Enviando tu prueba…' : 'Estamos vistiendo tu foto con IA…'}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Puede tardar unos segundos. Puedes seguir mirando prendas mientras tanto.</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                {job.progress ? (
                  <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${job.progress}%` }} />
                ) : (
                  <div className="h-full w-1/3 animate-pulse bg-[var(--color-accent)] motion-reduce:animate-none" />
                )}
              </div>
              <button type="button" onClick={job.cancel} className="mt-3 text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">
                Dejar de esperar
              </button>
            </div>
          )}

          {job.phase === 'completed' && job.result && garment && (
            <div className="mt-4">
              <ResultViewer
                result={job.result}
                garmentName={garment.nombre}
                onRegenerate={startTry}
                onOtherGarment={otherGarment}
              />
            </div>
          )}

          {job.phase === 'expired' && (
            <Aviso
              tono="error"
              className="mt-4"
              titulo="La prueba tardó demasiado y se canceló"
              acciones={
                <button type="button" onClick={() => { job.reset(); startTry() }} className={BTN_PRINCIPAL}>
                  Intentar de nuevo
                </button>
              }
            >
              Puedes intentarlo otra vez; no se cobrará ni se duplicará nada.
            </Aviso>
          )}

          {problema && (
            <Aviso
              tono={problema.accion === 'consentimiento' || problema.accion === 'planes' ? 'alerta' : 'error'}
              className="mt-4"
              titulo={problema.titulo}
              acciones={accionesDe(problema)}
            >
              {problema.texto}
            </Aviso>
          )}

          {job.phase === 'offline' && (
            <div role="alert" className="mt-4 rounded-2xl border border-[var(--color-warning-border,#d97706)] bg-[var(--color-warning-bg,rgba(217,119,6,0.1))] p-5 text-[var(--color-warning-text,#92400e)]">
              <p className="font-semibold">Se perdió la conexión</p>
              <p className="mt-1 text-sm text-[var(--color-text)]">
                {job.jobId ? 'Tu prueba sigue en proceso. Cuando vuelva la conexión, seguimos consultando la misma prueba sin crear otra.' : 'Revisa tu internet e inténtalo de nuevo.'}
              </p>
              <button
                type="button"
                onClick={job.jobId ? job.resume : startTry}
                className="mt-4 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-4 py-2 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] shadow-sm"
              >
                {job.jobId ? 'Seguir consultando' : 'Reintentar'}
              </button>
            </div>
          )}

          {job.phase === 'cancelled' && (
            <div className="mt-4 text-sm text-[var(--color-text-muted)]">
              Dejaste de esperar la prueba. <button type="button" onClick={() => { job.reset(); startTry() }} className="font-semibold text-[var(--color-text)] underline">Volver a intentar</button>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={!!consent}
        title="Antes de probar, acepta el uso de tu foto"
        confirmLabel="Acepto"
        cancelLabel="Ahora no"
        busy={consintiendo}
        onConfirm={aceptarConsentimiento}
        onCancel={() => {
          setConsent(null)
          setConsentMsg('')
          if (job.phase === 'error') job.reset()
        }}
      >
        <p>Lo pide la Ley 1581 de protección de datos. Tu foto solo se usa para generar la prueba en el probador, se guarda de forma temporal y la puedes borrar cuando quieras.</p>
        {consent === 'foto' && <p className="mt-2">Después de aceptar, vuelve a elegir tu foto.</p>}
        {consentMsg && <p role="alert" className="mt-2 text-[#ffb4b4]">{consentMsg}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDel}
        title="¿Eliminar tu foto?"
        confirmLabel="Eliminar"
        danger
        busy={deleting}
        onConfirm={deletePhoto}
        onCancel={() => setConfirmDel(false)}
      >
        Se borra de StyleRadar tu foto original y los resultados generados con ella. No se puede deshacer.
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmRevokeConsent}
        title="¿Revocar consentimiento biométrico?"
        confirmLabel="Revocar y purgar"
        danger
        busy={revokingConsent}
        onConfirm={handleRevokeConsent}
        onCancel={() => setConfirmRevokeConsent(false)}
      >
        Conforme a la Ley 1581 de 2012, revocar tu consentimiento suprime tu autorización biométrica y purga cualquier fotografía frontal activa asociada a tu cuenta.
      </ConfirmDialog>
    </section>
  </div>
  )
}
