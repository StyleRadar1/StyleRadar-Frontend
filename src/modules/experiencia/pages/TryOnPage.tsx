import { useEffect, useRef, useState } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorState } from '@/modules/core/components/Status'
import { PlanGate } from '@/modules/transacciones/components/PlanGate'
import { GarmentSelector } from '../components/GarmentSelector'
import { garmentProblem } from '../utils/garments'
import { PhotoPicker, type UploadedPhoto } from '../components/PhotoPicker'
import { ResultViewer } from '../components/ResultViewer'
import { useTryOnJob } from '../hooks/useTryOnJob'
import { tryOnService } from '../services/tryOnService'
import type { TryOnGarmentDto } from '../types/tryon.dto'

/** Probador virtual: RF-23 (foto), RF-24 (prenda), RF-25 (job), RF-26 (resultado) y RF-27 (borrar). */
export default function TryOnPage() {
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null)
  const { data: garments, loading: gLoading, error: gError, reload: loadGarments } = useResource(tryOnService.listGarments, [] as TryOnGarmentDto[])
  const [garmentId, setGarmentId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [delMsg, setDelMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const job = useTryOnJob()
  const selectorRef = useRef<HTMLElement>(null)

  // La URL temporal de la foto se libera al salir de la pantalla.
  const photoUrl = photo?.previewUrl
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const garment = garments.find((g) => g.id === garmentId)
  const canStart = !!photo && !!garment && !garmentProblem(garment) && !job.active

  const startTry = () => { if (photo && garment && !garmentProblem(garment)) job.start(photo.photoId, garment.id) }
  const otherGarment = () => { job.reset(); setGarmentId(null); selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const deletePhoto = async () => {
    if (!photo) return
    setDeleting(true); setDelMsg(null)
    try {
      await tryOnService.deletePhoto(photo.photoId)
      job.reset()
      setPhoto(null)
      setDelMsg({ ok: true, text: 'Eliminamos tu foto y los resultados generados con ella.' })
    } catch (e) {
      setDelMsg({ ok: false, text: `No tenemos confirmación de que tu foto se haya borrado. ${errorMessage(e)}` })
    } finally {
      setDeleting(false); setConfirmDel(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[var(--color-accent)]">Probador virtual · Bogotá</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--color-text)] md:text-5xl">Pruébate una chaqueta hecha para el clima cambiante</h1>
      <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">Sube una foto, elige una prenda de las tiendas del radar y mira cómo te queda. Empezamos con la Chaqueta State de Remanence: canvas repelente a líquidos, forro acolchado y cuello de corduroy. Tu foto es privada y puedes borrarla en cualquier momento.</p>
      <p className="mt-3 max-w-2xl text-xs text-[var(--color-text-subtle)]">La generación de imagen todavía depende de conectar el servicio de IA. En modo demostración, cualquier resultado aparece marcado como simulado.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-8">
          <section aria-labelledby="t-foto" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <h2 id="t-foto" className="text-lg font-bold text-[var(--color-text)]">1. Tu foto</h2>
            <div className="mt-4">
              <PlanGate title="Pruébate la ropa sobre tu foto con Radar+" text="Con el plan Radar usas el maniquí. Radar+ te deja subir tu foto de cuerpo entero y ver las prendas sobre ti.">
                <PhotoPicker photo={photo} onUploaded={(p) => { setDelMsg(null); job.reset(); setPhoto(p) }} />
              </PlanGate>
            </div>
            {photo && (
              <button type="button" onClick={() => setConfirmDel(true)} className="mt-4 text-sm text-[var(--color-danger-text,#ff8a8a)] underline underline-offset-4 hover:brightness-110">Eliminar mi foto y resultados</button>
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
            <h2 id="t-prenda" className="text-lg font-bold text-[var(--color-text)]">2. Elige una prenda</h2>
            <div className="mt-4">
              <GarmentSelector garments={garments} loading={gLoading} error={gError} onRetry={loadGarments} selected={garmentId}
                onSelect={(id) => { if (!job.active) { setGarmentId(id); if (job.phase !== 'idle') job.reset() } }} />
            </div>
          </section>
        </div>

        <aside aria-labelledby="t-resultado" className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm lg:sticky lg:top-24">
          <h2 id="t-resultado" className="text-lg font-bold text-[var(--color-text)]">3. Resultado</h2>
          {!photo && <p className="mt-3 text-sm text-[var(--color-text-muted)]">Primero sube tu foto.</p>}
          {photo && !garment && <p className="mt-3 text-sm text-[var(--color-text-muted)]">Ahora elige una prenda.</p>}

          {garment?.id === 'remanence-state' && (
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
              <img src={garment.imagen} alt="Chaqueta State Negra de Remanence" className="h-52 w-full object-cover object-center" />
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">Remanence · Medellín</p>
                <p className="mt-1 font-semibold text-[var(--color-text)]">Canvas repelente a líquidos · forro acolchado</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">Una capa para mañanas frías y llovizna en Bogotá, con cuello contrastante en corduroy.</p>
              </div>
            </div>
          )}

          {photo && garment && job.phase === 'idle' && (
            <button type="button" onClick={startTry} disabled={!canStart} className="mt-4 w-full rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-5 py-3 font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-50 transition-all shadow-sm">Probarme {garment.nombre}</button>
          )}

          {job.active && (
            <div className="mt-4" role="status" aria-live="polite">
              <p className="font-semibold text-[var(--color-text)]">{job.phase === 'creating' ? 'Enviando tu prueba…' : 'Estamos vistiendo tu foto…'}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Puede tardar unos segundos. Puedes seguir mirando prendas mientras tanto.</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                {job.progress ? <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${job.progress}%` }} />
                  : <div className="h-full w-1/3 animate-pulse bg-[var(--color-accent)] motion-reduce:animate-none" />}
              </div>
              <button type="button" onClick={job.cancel} className="mt-3 text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">Dejar de esperar</button>
            </div>
          )}

          {job.phase === 'completed' && job.result && garment && (
            <div className="mt-4"><ResultViewer result={job.result} garmentName={garment.nombre} onRegenerate={startTry} onOtherGarment={otherGarment} /></div>
          )}

          {(job.phase === 'failed' || job.phase === 'expired') && (
            <div role="alert" className="mt-4 rounded-2xl border border-[var(--color-danger-border,#ff8a8a)] bg-[var(--color-danger-bg,rgba(220,38,38,0.12))] p-5 text-[var(--color-danger-text,#ff8a8a)]">
              <p className="font-semibold">{job.phase === 'failed' ? 'No pudimos generar tu prueba' : 'La prueba tardó demasiado y se canceló'}</p>
              <p className="mt-1 text-sm text-[var(--color-text)]">{job.result?.error ?? 'Puedes intentarlo otra vez; no se cobrará ni se duplicará nada.'}</p>
              <button type="button" onClick={() => { job.reset(); startTry() }} className="mt-4 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-4 py-2 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] shadow-sm">Intentar de nuevo</button>
            </div>
          )}

          {job.phase === 'offline' && (
            <div role="alert" className="mt-4 rounded-2xl border border-[var(--color-warning-border,#d97706)] bg-[var(--color-warning-bg,rgba(217,119,6,0.1))] p-5 text-[var(--color-warning-text,#92400e)]">
              <p className="font-semibold">Se perdió la conexión</p>
              <p className="mt-1 text-sm text-[var(--color-text)]">{job.jobId ? 'Tu prueba sigue en proceso. Cuando vuelva la conexión, seguimos consultando la misma prueba sin crear otra.' : errorMessage(job.error)}</p>
              <button type="button" onClick={job.jobId ? job.resume : startTry} className="mt-4 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast,#ffffff)] px-4 py-2 text-sm font-semibold hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] shadow-sm">{job.jobId ? 'Seguir consultando' : 'Reintentar'}</button>
            </div>
          )}

          {job.phase === 'error' && <div className="mt-4"><ErrorState error={job.error} onRetry={() => { job.reset(); startTry() }} title="No pudimos completar la prueba" /></div>}

          {job.phase === 'cancelled' && (
            <div className="mt-4 text-sm text-[var(--color-text-muted)]">
              Dejaste de esperar la prueba. <button type="button" onClick={() => { job.reset(); startTry() }} className="font-semibold text-[var(--color-text)] underline">Volver a intentar</button>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog open={confirmDel} title="¿Eliminar tu foto?" confirmLabel="Eliminar" danger busy={deleting} onConfirm={deletePhoto} onCancel={() => setConfirmDel(false)}>
        Se borra de StyleRadar tu foto original y los resultados generados con ella. No se puede deshacer.
      </ConfirmDialog>
    </section>
  )
}
