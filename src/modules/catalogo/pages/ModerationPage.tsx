import { useState, useMemo } from 'react'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { Card, Button, Badge } from '@/modules/core/design-system'
import { Loading, EmptyState, ErrorState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { ErrorToast, FieldError } from '@/modules/core/components/ErrorFeedback'
import { formatCOP } from '@/modules/core/utils/format'
import { useModeration } from '../hooks/useModeration'
import { REJECTION_REASONS, type ModerationItemDto, type ModerationType } from '../types/moderation.dto'

export default function ModerationPage() {
  const {
    items,
    history,
    loading,
    error,
    reload,
    approve,
    reject,
    approvePublisher,
    rejectPublisher,
  } = useModeration()

  const [filtroTipo, setFiltroTipo] = useState<ModerationType | 'TODAS'>('TODAS')
  const [vista, setVista] = useState<'item' | 'pub'>('item')
  const [toast, setToast] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string } | null>(null)

  // Estados para diálogos
  const [itemParaAprobar, setItemParaAprobar] = useState<ModerationItemDto | null>(null)
  const [itemParaRechazar, setItemParaRechazar] = useState<ModerationItemDto | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState<string>('')
  const [detalleRechazo, setDetalleRechazo] = useState<string>('')
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null)

  // Diálogos de lote por publicador
  const [loteParaAprobar, setLoteParaAprobar] = useState<{ publicador: string; count: number } | null>(null)
  const [loteParaRechazar, setLoteParaRechazar] = useState<{ publicador: string; count: number } | null>(null)

  const itemsFiltrados = useMemo(() => {
    if (filtroTipo === 'TODAS') return items
    return items.filter((x) => x.tipo === filtroTipo)
  }, [items, filtroTipo])

  const gruposPorPublicador = useMemo(() => {
    const mapa = new Map<string, ModerationItemDto[]>()
    for (const it of itemsFiltrados) {
      const arr = mapa.get(it.publicador) ?? []
      arr.push(it)
      mapa.set(it.publicador, arr)
    }
    return Array.from(mapa.entries()).map(([publicador, publicaciones]) => ({
      publicador,
      publicaciones,
      tipoPublicador: publicaciones[0]?.tipoPublicador ?? 'Persona',
      tipo: publicaciones[0]?.tipo ?? 'Segunda mano',
    }))
  }, [itemsFiltrados])

  const handleModerationError = (err: unknown, selectId?: string): boolean => {
    const kind = errorKind(err)
    const fields = fieldErrors(err)
    if (selectId && (fields.motivo || (err instanceof ApiError && err.status === 400))) {
      setErrorMotivo(fields.motivo ?? 'Selecciona el motivo de rechazo.')
      window.setTimeout(() => document.getElementById(selectId)?.focus(), 0)
      return true
    }
    if ((err instanceof ApiError && err.status === 422) || kind === 'conflicto') {
      setItemParaAprobar(null)
      setItemParaRechazar(null)
      setLoteParaAprobar(null)
      setLoteParaRechazar(null)
      setErrorMotivo(null)
      setToast({ tone: 'warn', text: 'Ya fue moderado — actualizamos la lista' })
      void reload()
      return true
    }
    setToast({ tone: 'bad', text: errorMessage(err, 'No pudimos completar la moderación.') })
    return false
  }

  const handleConfirmApprove = async () => {
    if (!itemParaAprobar) return
    const titulo = itemParaAprobar.titulo
    try {
      await approve(itemParaAprobar.id)
      setItemParaAprobar(null)
      setToast({ tone: 'ok', text: `«${titulo}» fue aprobada y ya está disponible en el catálogo.` })
    } catch (err) {
      if (!handleModerationError(err)) setItemParaAprobar(null)
    }
  }

  const handleConfirmReject = async () => {
    if (!itemParaRechazar) return
    if (!motivoRechazo) {
      setErrorMotivo('Selecciona el motivo de rechazo (obligatorio según RF-61).')
      window.setTimeout(() => document.getElementById('motivoRechazo')?.focus(), 0)
      return
    }
    const titulo = itemParaRechazar.titulo
    const motivoFinal = motivoRechazo === 'Otro' && detalleRechazo.trim() ? detalleRechazo.trim() : motivoRechazo
    try {
      await reject(itemParaRechazar.id, motivoFinal, detalleRechazo)
      setItemParaRechazar(null)
      setMotivoRechazo('')
      setDetalleRechazo('')
      setErrorMotivo(null)
      setToast({ tone: 'ok', text: `«${titulo}» fue rechazada. Se notificó al publicador.` })
    } catch (err) {
      if (!handleModerationError(err, 'motivoRechazo')) setItemParaRechazar(null)
    }
  }

  const handleConfirmBatchApprove = async () => {
    if (!loteParaAprobar) return
    const pub = loteParaAprobar.publicador
    try {
      await approvePublisher(pub)
      setLoteParaAprobar(null)
      setToast({ tone: 'ok', text: `Se aprobaron todas las publicaciones de ${pub}.` })
    } catch (err) {
      if (!handleModerationError(err)) setLoteParaAprobar(null)
    }
  }

  const handleConfirmBatchReject = async () => {
    if (!loteParaRechazar) return
    if (!motivoRechazo) {
      setErrorMotivo('Selecciona el motivo de rechazo en lote.')
      window.setTimeout(() => document.getElementById('motivoLote')?.focus(), 0)
      return
    }
    const pub = loteParaRechazar.publicador
    const motivoFinal = motivoRechazo === 'Otro' && detalleRechazo.trim() ? detalleRechazo.trim() : motivoRechazo
    try {
      await rejectPublisher(pub, motivoFinal)
      setLoteParaRechazar(null)
      setMotivoRechazo('')
      setDetalleRechazo('')
      setErrorMotivo(null)
      setToast({ tone: 'ok', text: `Se rechazaron las publicaciones de ${pub}.` })
    } catch (err) {
      if (!handleModerationError(err, 'motivoLote')) setLoteParaRechazar(null)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-arena">Administración · RF-61</span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Moderación de publicaciones
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Revisa fotos, precio y descripción antes de aprobar o rechazar con motivo las prendas del catálogo
            y de segunda mano.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="violeta">Pendientes: {items.length}</Badge>
        </div>
      </div>

      {/* Alerta de acción reciente */}
      <ErrorToast
        open={Boolean(toast)}
        tone={toast?.tone ?? 'ok'}
        icon={toast?.tone === 'warn' ? 'refresh' : toast?.tone === 'bad' ? 'warn' : 'ok'}
        title={toast?.text ?? ''}
        onClose={() => setToast(null)}
      />

      {/* Barra de filtros y visualización */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Filtros por tipo de publicación */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por origen">
          <button
            type="button"
            onClick={() => setFiltroTipo('TODAS')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filtroTipo === 'TODAS' ? 'bg-arena text-grafito shadow-sm' : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            Todas ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('Catálogo')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filtroTipo === 'Catálogo' ? 'bg-arena text-grafito shadow-sm' : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            Catálogo de tiendas ({items.filter((x) => x.tipo === 'Catálogo').length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('Segunda mano')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filtroTipo === 'Segunda mano' ? 'bg-arena text-grafito shadow-sm' : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            Segunda mano ({items.filter((x) => x.tipo === 'Segunda mano').length})
          </button>
        </div>

        {/* Toggle de organización */}
        <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1" role="group" aria-label="Organizar por">
          <button
            type="button"
            onClick={() => setVista('item')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              vista === 'item' ? 'bg-violeta text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Por prenda
          </button>
          <button
            type="button"
            onClick={() => setVista('pub')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              vista === 'pub' ? 'bg-violeta text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Por publicador
          </button>
        </div>
      </div>

      {/* Estados principales */}
      {loading && <Loading label="Cargando cola de moderación..." />}

      {!!error && <ErrorState error={error} onRetry={reload} title="No se pudo cargar la moderación" />}

      {!loading && !error && itemsFiltrados.length === 0 && (
        <div className="mt-10">
          <EmptyState title="Todo al día">
            <p>No hay publicaciones esperando moderación en esta categoría. Las nuevas publicaciones aparecerán aquí automáticamente.</p>
          </EmptyState>
        </div>
      )}

      {/* Listado Por Prenda */}
      {!loading && !error && itemsFiltrados.length > 0 && vista === 'item' && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itemsFiltrados.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between overflow-hidden p-0">
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                <img
                  src={item.imagen}
                  alt={item.titulo}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLElement).style.display = 'none'
                  }}
                />
                <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {item.tipo}
                </span>
                <span className="absolute bottom-3 right-3 rounded-md bg-violeta/90 px-2.5 py-1 text-xs font-bold text-white shadow">
                  {formatCOP(item.precio)}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${item.tipoPublicador === 'Tienda' ? 'text-violeta-claro' : 'text-arena'}`}>
                    {item.tipoPublicador}
                  </span>
                  <span className="text-xs text-white/40">·</span>
                  <span className="truncate text-xs font-medium text-white/70">{item.publicador}</span>
                </div>

                <h3 className="mt-1.5 line-clamp-1 font-bold text-white">{item.titulo}</h3>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                    Cat: {item.categoria}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                    Tallas: {item.tallas.join(', ')}
                  </span>
                </div>

                {item.nota && (
                  <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                    ⚠️ {item.nota}
                  </p>
                )}

                <p className="mt-3 text-[11px] text-white/50">{item.fecha}</p>

                {/* Acciones */}
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                  <Button
                    variant="secundario"
                    onClick={() => {
                      setItemParaRechazar(item)
                      setMotivoRechazo('')
                      setDetalleRechazo('')
                      setErrorMotivo(null)
                    }}
                    className="px-3 py-1.5 text-xs"
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="primario"
                    onClick={() => setItemParaAprobar(item)}
                    className="px-4 py-1.5 text-xs"
                  >
                    ✓ Aprobar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Listado Por Publicador */}
      {!loading && !error && itemsFiltrados.length > 0 && vista === 'pub' && (
        <div className="mt-8 space-y-8">
          {gruposPorPublicador.map((grupo) => (
            <div key={grupo.publicador} className="rounded-2xl border border-white/10 bg-white/[.02] p-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase text-white/80">
                      {grupo.tipoPublicador}
                    </span>
                    <span className="text-xs text-white/50">{grupo.tipo}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-white">{grupo.publicador}</h2>
                  <p className="text-xs text-white/60">
                    {grupo.publicaciones.length} {grupo.publicaciones.length === 1 ? 'publicación pendiente' : 'publicaciones pendientes'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secundario"
                    onClick={() => {
                      setLoteParaRechazar({ publicador: grupo.publicador, count: grupo.publicaciones.length })
                      setMotivoRechazo('')
                      setErrorMotivo(null)
                    }}
                    className="px-3 py-2 text-xs"
                  >
                    Rechazar todo
                  </Button>
                  <Button
                    variant="primario"
                    onClick={() => setLoteParaAprobar({ publicador: grupo.publicador, count: grupo.publicaciones.length })}
                    className="px-4 py-2 text-xs"
                  >
                    ✓ Aprobar todo ({grupo.publicaciones.length})
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grupo.publicaciones.map((item) => (
                  <Card key={item.id} className="p-4">
                    <h4 className="font-semibold text-white">{item.titulo}</h4>
                    <p className="text-xs text-white/60">{formatCOP(item.precio)} · Tallas: {item.tallas.join(', ')}</p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setItemParaRechazar(item)
                          setMotivoRechazo('')
                          setDetalleRechazo('')
                          setErrorMotivo(null)
                        }}
                        className="text-xs text-white/70 hover:text-rose-300"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemParaAprobar(item)}
                        className="text-xs font-semibold text-violeta-claro hover:underline"
                      >
                        Aprobar
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historial de Decisiones (Auditoría) */}
      <details className="mt-12 rounded-2xl border border-white/10 bg-white/[.02] p-6">
        <summary className="cursor-pointer text-sm font-bold text-white/80 hover:text-white">
          Historial de decisiones recientes ({history.length})
        </summary>
        <ul className="mt-4 divide-y divide-white/5">
          {history.length === 0 ? (
            <li className="py-3 text-sm text-white/60">Aún no hay decisiones registradas.</li>
          ) : (
            history.map((h) => (
              <li key={h.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${h.aprobado ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {h.aprobado ? 'APROBADA' : 'RECHAZADA'}
                  </span>
                  <span className="font-semibold text-white">{h.titulo}</span>
                  <span className="text-white/50"> · {h.publicador}</span>
                  {!h.aprobado && h.motivo && (
                    <p className="mt-0.5 text-xs text-rose-300/80">Motivo: {h.motivo}</p>
                  )}
                </div>
                <span className="text-xs text-white/40">{h.fecha}</span>
              </li>
            ))
          )}
        </ul>
      </details>

      {/* Diálogo de Confirmación: Aprobar */}
      <ConfirmDialog
        open={Boolean(itemParaAprobar)}
        title="¿Aprobar publicación?"
        confirmLabel="Aprobar prenda"
        onConfirm={handleConfirmApprove}
        onCancel={() => setItemParaAprobar(null)}
      >
        <p>
          «<strong>{itemParaAprobar?.titulo}</strong>» de {itemParaAprobar?.publicador} será publicada
          inmediatamente y quedará visible en el radar y el catálogo para toda la comunidad.
        </p>
      </ConfirmDialog>

      {/* Diálogo de Confirmación: Rechazar (RF-61 con Motivo Obligatorio) */}
      <ConfirmDialog
        open={Boolean(itemParaRechazar)}
        title="Rechazar publicación"
        confirmLabel="Rechazar con motivo"
        danger
        onConfirm={handleConfirmReject}
        onCancel={() => setItemParaRechazar(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-white/80">
            Indica la razón por la cual no se aprueba «<strong>{itemParaRechazar?.titulo}</strong>».
            Este motivo le llegará al publicador por notificación.
          </p>

          <div>
            <label htmlFor="motivoRechazo" className="block text-xs font-semibold text-white/80">
              Motivo de rechazo <span className="text-rose-400">*</span>
            </label>
            <select
              id="motivoRechazo"
              value={motivoRechazo}
              onChange={(e) => {
                setMotivoRechazo(e.target.value)
                setErrorMotivo(null)
              }}
              aria-invalid={Boolean(errorMotivo)}
              aria-describedby={errorMotivo ? 'motivoRechazo-err' : undefined}
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-grafito px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            >
              <option value="">Selecciona un motivo</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <FieldError id="motivoRechazo-err" message={errorMotivo ?? undefined} />
          </div>

          <div>
            <label htmlFor="detalleRechazo" className="block text-xs font-semibold text-white/80">
              Observaciones adicionales (opcional)
            </label>
            <textarea
              id="detalleRechazo"
              rows={2}
              value={detalleRechazo}
              onChange={(e) => setDetalleRechazo(e.target.value)}
              placeholder="Instrucciones para corregir la publicación..."
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-grafito px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* Diálogos en Lote */}
      <ConfirmDialog
        open={Boolean(loteParaAprobar)}
        title="¿Aprobar publicaciones en lote?"
        confirmLabel="Aprobar todo el lote"
        onConfirm={handleConfirmBatchApprove}
        onCancel={() => setLoteParaAprobar(null)}
      >
        <p>
          Se aprobarán las <strong>{loteParaAprobar?.count}</strong> prendas pendientes de{' '}
          <strong>{loteParaAprobar?.publicador}</strong> y se publicarán en el catálogo.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(loteParaRechazar)}
        title="Rechazar publicaciones en lote"
        confirmLabel="Rechazar lote"
        danger
        onConfirm={handleConfirmBatchReject}
        onCancel={() => setLoteParaRechazar(null)}
      >
        <div className="space-y-4">
          <p>
            Rechazar las <strong>{loteParaRechazar?.count}</strong> publicaciones de{' '}
            <strong>{loteParaRechazar?.publicador}</strong>.
          </p>
          <div>
            <label htmlFor="motivoLote" className="block text-xs font-semibold text-white/80">
              Motivo común de rechazo <span className="text-rose-400">*</span>
            </label>
            <select
              id="motivoLote"
              value={motivoRechazo}
              onChange={(e) => {
                setMotivoRechazo(e.target.value)
                setErrorMotivo(null)
              }}
              aria-invalid={Boolean(errorMotivo)}
              aria-describedby={errorMotivo ? 'motivoLote-err' : undefined}
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-grafito px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            >
              <option value="">Selecciona un motivo</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <FieldError id="motivoLote-err" message={errorMotivo ?? undefined} />
          </div>
        </div>
      </ConfirmDialog>
    </section>
  )
}
