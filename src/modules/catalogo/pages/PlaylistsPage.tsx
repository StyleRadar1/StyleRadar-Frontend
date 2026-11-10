import { useState, useMemo } from 'react'
import { Card, Button, Badge } from '@/modules/core/design-system'
import { Loading, EmptyState, ErrorState } from '@/modules/core/components/Status'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { formatCOP } from '@/modules/core/utils/format'
import { mockSessionUser } from '@/modules/core/api/mock'
import { usePlaylists } from '../hooks/usePlaylists'
import { ITEMS } from '../mocks/items'
import { MAX_PLAYLIST_ITEMS, type PlaylistDto, type PlaylistVisibility } from '../types/playlist.dto'

export default function PlaylistsPage() {
  const { playlists, loading, error, reload, createPlaylist, addItem, removeItem, like } = usePlaylists()

  const [busqueda, setBusqueda] = useState('')
  const [tab, setTab] = useState<'todas' | 'mias' | 'destacadas'>('todas')
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  // Diálogo para crear playlist
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [visibilidad, setVisibilidad] = useState<PlaylistVisibility>('PUBLICA')
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Modal para ver y gestionar prendas de una playlist
  const [playlistSeleccionada, setPlaylistSeleccionada] = useState<PlaylistDto | null>(null)
  const [prendaParaAgregar, setPrendaParaAgregar] = useState<string>('')

  const usuarioActual = mockSessionUser() ?? { id: 'u-1', name: 'Valentina Rojas' }

  const playlistsFiltradas = useMemo(() => {
    let list = playlists
    if (tab === 'mias') {
      list = list.filter((p) => p.creador.id === usuarioActual.id)
    } else if (tab === 'destacadas') {
      list = list.filter((p) => p.destacada)
    }

    if (!busqueda.trim()) return list
    const q = busqueda.toLowerCase()
    return list.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.creador.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
    )
  }, [playlists, tab, busqueda, usuarioActual.id])

  const handleCrear = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!nombre.trim()) {
      setErrorCrear('Escribe el nombre de la playlist.')
      return
    }
    setGuardando(true)
    setErrorCrear(null)
    try {
      await createPlaylist({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        visibilidad,
        prendaIds: [],
      })
      setMostrarCrear(false)
      setNombre('')
      setDescripcion('')
      setVisibilidad('PUBLICA')
      setMensajeExito('Playlist creada con éxito. Ahora puedes agregar hasta 15 prendas.')
      setTimeout(() => setMensajeExito(null), 4000)
    } catch (err: unknown) {
      setErrorCrear(err instanceof Error ? err.message : 'No se pudo crear la playlist.')
    } finally {
      setGuardando(false)
    }
  }

  const handleAgregarPrenda = async () => {
    if (!playlistSeleccionada || !prendaParaAgregar) return
    setErrorAccion(null)

    if (playlistSeleccionada.prendas.length >= MAX_PLAYLIST_ITEMS) {
      setErrorAccion(`Límite alcanzado: no puedes agregar más de ${MAX_PLAYLIST_ITEMS} prendas (RNF-12).`)
      return
    }

    try {
      await addItem(playlistSeleccionada.id, prendaParaAgregar)
      const prendaObj = ITEMS.find((it) => it.id === prendaParaAgregar)
      if (prendaObj) {
        setPlaylistSeleccionada((prev) =>
          prev ? { ...prev, prendas: [...prev.prendas, prendaObj] } : null
        )
      }
      setPrendaParaAgregar('')
      setMensajeExito('Prenda agregada a la playlist.')
      setTimeout(() => setMensajeExito(null), 3000)
    } catch (err: unknown) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al agregar la prenda.')
    }
  }

  const handleRemoverPrenda = async (itemId: string) => {
    if (!playlistSeleccionada) return
    try {
      await removeItem(playlistSeleccionada.id, itemId)
      setPlaylistSeleccionada((prev) =>
        prev ? { ...prev, prendas: prev.prendas.filter((p) => p.id !== itemId) } : null
      )
    } catch (err: unknown) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al quitar la prenda.')
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-arena">Comunidad · RNF-12</span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Playlists de estilo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Arma colecciones con prendas de tiendas locales y de segunda mano. Cada playlist tiene un límite
            estricto de hasta <strong>{MAX_PLAYLIST_ITEMS} prendas</strong> para mantener la curaduría enfocada.
          </p>
        </div>

        <Button
          variant="primario"
          onClick={() => {
            setMostrarCrear(true)
            setErrorCrear(null)
          }}
          className="self-start sm:self-auto"
        >
          + Nueva playlist
        </Button>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div role="status" className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {mensajeExito}
        </div>
      )}

      {errorAccion && (
        <div role="alert" className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {errorAccion}
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        {/* Pestañas de filtrado */}
        <div className="flex items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'todas'}
            onClick={() => setTab('todas')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === 'todas' ? 'bg-arena text-grafito shadow-sm' : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            Todas ({playlists.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'mias'}
            onClick={() => setTab('mias')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === 'mias' ? 'bg-arena text-grafito shadow-sm' : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            Mis playlists ({playlists.filter((p) => p.creador.id === usuarioActual.id).length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'destacadas'}
            onClick={() => setTab('destacadas')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              tab === 'destacadas' ? 'bg-arena text-grafito shadow-sm' : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            ★ Destacadas ({playlists.filter((p) => p.destacada).length})
          </button>
        </div>

        {/* Buscador */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o creador..."
            className="w-full rounded-xl border border-white/20 bg-black/20 px-3.5 py-2 text-xs text-white outline-none focus:border-violeta-claro"
          />
        </div>
      </div>

      {/* Estados */}
      {loading && <Loading label="Cargando playlists de estilo..." />}

      {!!error && <ErrorState error={error} onRetry={reload} title="No se pudieron cargar las playlists" />}

      {!loading && !error && playlistsFiltradas.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="No se encontraron playlists"
            action={
              <Button variant="arena" onClick={() => setMostrarCrear(true)}>
                Crear la primera playlist
              </Button>
            }
          >
            <p>No hay playlists que coincidan con los filtros seleccionados.</p>
          </EmptyState>
        </div>
      )}

      {/* Grilla de Playlists */}
      {!loading && !error && playlistsFiltradas.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {playlistsFiltradas.map((pl) => {
            const count = pl.prendas.length
            const isFull = count >= MAX_PLAYLIST_ITEMS

            return (
              <Card key={pl.id} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                      Por {pl.creador.nombre}
                    </span>
                    {pl.destacada && <Badge tone="arena">★ Destacada</Badge>}
                  </div>

                  <h3 className="mt-2 text-xl font-bold text-white">{pl.nombre}</h3>
                  <p className="mt-1.5 text-xs text-white/70 line-clamp-2">{pl.descripcion}</p>

                  {/* Collage o previews de prendas */}
                  <div className="mt-4 flex -space-x-3 overflow-hidden py-1">
                    {pl.prendas.slice(0, 4).map((p, idx) => (
                      <div
                        key={`${p.id}-${idx}`}
                        className="relative h-12 w-12 rounded-xl border-2 border-grafito bg-black/40 overflow-hidden"
                      >
                        <img src={p.imagen} alt={p.nombre} className="h-full w-full object-cover" />
                      </div>
                    ))}
                    {count === 0 && (
                      <div className="flex h-12 w-full items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-white/40">
                        Sin prendas todavía
                      </div>
                    )}
                  </div>

                  {/* Contador estricto RNF-12 */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-white/60">Prendas en el look:</span>
                    <span
                      className={`font-mono font-bold ${
                        isFull ? 'text-amber-300' : 'text-violeta-claro'
                      }`}
                    >
                      {count} / {MAX_PLAYLIST_ITEMS} {isFull ? '(Lleno)' : ''}
                    </span>
                  </div>

                  {/* Barra de capacidad RNF-12 */}
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFull ? 'bg-amber-400' : 'bg-violeta'
                      }`}
                      style={{ width: `${(count / MAX_PLAYLIST_ITEMS) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => like(pl.id)}
                    className="flex items-center gap-1.5 text-xs text-white/70 transition hover:text-rose-400"
                  >
                    <span>♥</span> <b>{pl.likes}</b>
                  </button>

                  <Button
                    variant="secundario"
                    onClick={() => {
                      setPlaylistSeleccionada(pl)
                      setErrorAccion(null)
                    }}
                    className="px-3 py-1.5 text-xs"
                  >
                    Ver prendas ({count})
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Crear Playlist */}
      <ConfirmDialog
        open={mostrarCrear}
        title="Crear nueva playlist de estilo"
        confirmLabel={guardando ? 'Guardando...' : 'Crear playlist'}
        busy={guardando}
        onConfirm={() => { void handleCrear() }}
        onCancel={() => setMostrarCrear(false)}
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <div>
            <label htmlFor="nombrePl" className="block text-xs font-semibold text-white/80">
              Nombre de la playlist <span className="text-rose-400">*</span>
            </label>
            <input
              id="nombrePl"
              type="text"
              maxLength={50}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Outfits para lluvia en Chapinero"
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-grafito px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            />
          </div>

          <div>
            <label htmlFor="descPl" className="block text-xs font-semibold text-white/80">
              Descripción corta
            </label>
            <textarea
              id="descPl"
              rows={2}
              maxLength={140}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ocasión, estilo y recomendaciones para combinarlo..."
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-grafito px-3 py-2 text-sm text-white outline-none focus:border-violeta-claro"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-white/80">Visibilidad</span>
            <div className="mt-1.5 flex gap-4">
              <label className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="radio"
                  name="visibilidad"
                  checked={visibilidad === 'PUBLICA'}
                  onChange={() => setVisibilidad('PUBLICA')}
                />
                Pública (toda la comunidad)
              </label>
              <label className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="radio"
                  name="visibilidad"
                  checked={visibilidad === 'PRIVADA'}
                  onChange={() => setVisibilidad('PRIVADA')}
                />
                Privada (solo tú)
              </label>
            </div>
          </div>

          <p className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-white/60">
            ℹ️ <strong>Regla RNF-12:</strong> Cada playlist admite un máximo de{' '}
            <strong>{MAX_PLAYLIST_ITEMS} prendas</strong> para mantener la curaduría visual.
          </p>

          {errorCrear && <p className="text-xs text-rose-400">{errorCrear}</p>}
        </form>
      </ConfirmDialog>

      {/* Modal: Gestionar Prendas de la Playlist */}
      <ConfirmDialog
        open={Boolean(playlistSeleccionada)}
        title={playlistSeleccionada?.nombre ?? 'Playlist'}
        confirmLabel="Cerrar"
        onConfirm={() => setPlaylistSeleccionada(null)}
        onCancel={() => setPlaylistSeleccionada(null)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs text-white/70">
              Curada por {playlistSeleccionada?.creador.nombre}
            </span>
            <span className="text-xs font-mono font-bold text-violeta-claro">
              {playlistSeleccionada?.prendas.length} / {MAX_PLAYLIST_ITEMS} prendas (RNF-12)
            </span>
          </div>

          {/* Formulario para agregar una prenda */}
          {playlistSeleccionada && playlistSeleccionada.prendas.length < MAX_PLAYLIST_ITEMS ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <label htmlFor="agregarPrenda" className="block text-xs font-semibold text-white/80">
                Agregar prenda del catálogo:
              </label>
              <div className="mt-1.5 flex gap-2">
                <select
                  id="agregarPrenda"
                  value={prendaParaAgregar}
                  onChange={(e) => setPrendaParaAgregar(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-grafito px-3 py-1.5 text-xs text-white outline-none focus:border-violeta-claro"
                >
                  <option value="">Selecciona una prenda disponible</option>
                  {ITEMS.filter(
                    (it) => !playlistSeleccionada.prendas.some((p) => p.id === it.id)
                  ).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nombre} · {it.tienda} ({formatCOP(it.precio)})
                    </option>
                  ))}
                </select>
                <Button
                  variant="arena"
                  onClick={handleAgregarPrenda}
                  disabled={!prendaParaAgregar}
                  className="px-3 py-1.5 text-xs"
                >
                  Agregar
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              ⚠️ Esta playlist ya tiene el máximo permitido de {MAX_PLAYLIST_ITEMS} prendas (RNF-12).
              Elimina una para poder agregar otra.
            </p>
          )}

          {/* Lista de prendas actuales */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {playlistSeleccionada?.prendas.length === 0 ? (
              <p className="py-4 text-center text-xs text-white/50">Esta playlist aún no tiene prendas.</p>
            ) : (
              playlistSeleccionada?.prendas.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.02] p-2"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={p.imagen} alt={p.nombre} className="h-9 w-9 rounded-lg object-cover" />
                    <div>
                      <p className="text-xs font-semibold text-white">{p.nombre}</p>
                      <p className="text-[11px] text-white/50">{p.tienda} · {formatCOP(p.precio)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoverPrenda(p.id)}
                    className="text-xs text-rose-400 hover:underline px-2 py-1"
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </ConfirmDialog>
    </section>
  )
}
