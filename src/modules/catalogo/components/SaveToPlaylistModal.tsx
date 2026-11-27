import { useContext, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { playlistService } from '../services/playlistService'
import {
  ESTILOS_PLAYLIST,
  MAX_PLAYLIST_ITEMS,
  type PlaylistDto,
  type PlaylistEstilo,
} from '../types/playlist.dto'
import { errorDeAgregar } from '../utils/erroresPlaylist'

export interface SaveToPlaylistItem {
  id: string
  nombre: string
  imagen?: string
}

interface SaveToPlaylistModalProps {
  isOpen: boolean
  item: SaveToPlaylistItem | null
  onClose: () => void
  onSaved?: (playlist: PlaylistDto) => void
}

export function SaveToPlaylistModal({ isOpen, item, onClose, onSaved }: SaveToPlaylistModalProps) {
  const auth = useContext(AuthContext)
  const user = auth?.user ?? null
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<PlaylistDto[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedPlaylist, setSavedPlaylist] = useState<PlaylistDto | null>(null)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [visibilidad, setVisibilidad] = useState<'PUBLICA' | 'PRIVADA'>('PUBLICA')
  const [estilo, setEstilo] = useState<PlaylistEstilo>('URBANO')

  useEffect(() => {
    if (!isOpen || !item) return
    setError(null)
    setSavedPlaylist(null)
    setNombre('')
    setDescripcion('')
    setVisibilidad('PUBLICA')
    setEstilo('URBANO')

    if (!user?.id) {
      setPlaylists([])
      setShowCreateForm(false)
      return
    }

    let active = true
    setLoading(true)
    playlistService
      .getMine(String(user.id))
      .then((mine) => {
        if (!active) return
        setPlaylists(mine)
        setShowCreateForm(mine.length === 0)
      })
      .catch(() => {
        if (!active) return
        setPlaylists([])
        setShowCreateForm(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, item, user?.id])

  if (!isOpen || !item) return null

  const handleSelectPlaylist = async (pl: PlaylistDto) => {
    if (savingId) return
    setError(null)
    setSavingId(pl.id)
    try {
      const updated = await playlistService.addItem(pl.id, item.id, item.nombre)
      setSavedPlaylist(updated)
      setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      onSaved?.(updated)
    } catch (err) {
      const yaEstaba = pl.prendas.some((p) => p.id === item.id)
      setError(errorDeAgregar(err, yaEstaba).texto)
    } finally {
      setSavingId(null)
    }
  }

  const handleCreateAndSave = async (e: FormEvent) => {
    e.preventDefault()
    if (savingId) return
    const trimmed = nombre.trim()
    if (!trimmed) {
      setError('Escribe un nombre para tu nueva playlist.')
      return
    }
    setError(null)
    setSavingId('new')
    try {
      const created = await playlistService.create({
        nombre: trimmed,
        descripcion: descripcion.trim(),
        visibilidad,
        estilo,
        prendaIds: [item.id],
      })
      setSavedPlaylist(created)
      setPlaylists((prev) => [created, ...prev])
      setShowCreateForm(false)
      onSaved?.(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear la playlist.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-playlist-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[var(--color-accent)]">
              Guardar prenda
            </p>
            <h2 id="save-playlist-modal-title" className="mt-0.5 text-lg font-bold text-[var(--color-text)]">
              {item.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de playlist"
            className="rounded-lg p-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]"
          >
            ✕
          </button>
        </div>

        {!user ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Inicia sesión para elegir en cuál de tus playlists guardar esta prenda o crear una nueva.
            </p>
            <Link
              to="/login"
              onClick={onClose}
              className="block w-full rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:brightness-110"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : savedPlaylist ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-[var(--color-text)]">
              Prenda guardada en <strong>{savedPlaylist.nombre}</strong>.
            </div>
            <div className="flex items-center justify-end gap-2">
              <Link
                to={`/playlists/${savedPlaylist.id}`}
                onClick={onClose}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
              >
                Ver playlist
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
              >
                Listo
              </button>
            </div>
          </div>
        ) : loading ? (
          <p className="mt-5 text-sm text-[var(--color-text-muted)]">Cargando tus playlists…</p>
        ) : (
          <div className="mt-4 space-y-4">
            {error && (
              <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </p>
            )}

            {playlists.length > 0 && !showCreateForm && (
              <>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Elige la playlist donde quieres guardar esta prenda:
                </p>
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {playlists.map((pl) => {
                    const alreadyIn = pl.prendas.some((p) => p.id === item.id)
                    const isFull = pl.prendas.length >= MAX_PLAYLIST_ITEMS
                    const disabled = alreadyIn || isFull || savingId !== null
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelectPlaylist(pl)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-left transition hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--color-text)]">
                            {pl.nombre}
                          </span>
                          <span className="block text-[11px] text-[var(--color-text-muted)]">
                            {pl.visibilidad === 'PRIVADA' ? 'Privada' : 'Pública'} · {pl.prendas.length}/{MAX_PLAYLIST_ITEMS} prendas
                          </span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[var(--color-accent)]">
                          {savingId === pl.id
                            ? 'Guardando…'
                            : alreadyIn
                              ? 'Ya guardada'
                              : isFull
                                ? 'Llena'
                                : 'Guardar'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setShowCreateForm(true)
                  }}
                  className="w-full rounded-xl border border-dashed border-[var(--color-accent)]/60 px-4 py-2.5 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
                >
                  + Crear nueva playlist con esta prenda
                </button>
              </>
            )}

            {showCreateForm && (
              <form onSubmit={handleCreateAndSave} className="space-y-3">
                {playlists.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Aún no tienes playlists creadas. Crea una nueva ahora y guardaremos esta prenda automáticamente en ella.
                  </p>
                )}
                <div>
                  <label htmlFor="new-pl-name" className="block text-xs font-semibold text-[var(--color-text)]">
                    Nombre de la playlist
                  </label>
                  <input
                    id="new-pl-name"
                    type="text"
                    maxLength={40}
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Looks de oficina"
                    className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label htmlFor="new-pl-desc" className="block text-xs font-semibold text-[var(--color-text)]">
                    Descripción (opcional)
                  </label>
                  <input
                    id="new-pl-desc"
                    type="text"
                    maxLength={160}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej. Prendas para el fin de semana"
                    className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="new-pl-vis" className="block text-xs font-semibold text-[var(--color-text)]">
                      Visibilidad
                    </label>
                    <select
                      id="new-pl-vis"
                      value={visibilidad}
                      onChange={(e) => setVisibilidad(e.target.value as 'PUBLICA' | 'PRIVADA')}
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text)]"
                    >
                      <option value="PUBLICA">Pública</option>
                      <option value="PRIVADA">Privada</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="new-pl-est" className="block text-xs font-semibold text-[var(--color-text)]">
                      Estilo
                    </label>
                    <select
                      id="new-pl-est"
                      value={estilo}
                      onChange={(e) => setEstilo(e.target.value as PlaylistEstilo)}
                      className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text)]"
                    >
                      {ESTILOS_PLAYLIST.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  {playlists.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setShowCreateForm(false)
                      }}
                      className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)]"
                    >
                      Volver
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingId !== null}
                    className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                  >
                    {savingId === 'new' ? 'Creando…' : 'Crear y guardar prenda'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
