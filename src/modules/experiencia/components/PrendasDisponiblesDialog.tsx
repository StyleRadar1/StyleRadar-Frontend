import { useContext, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { env } from '@/configs/env'
import { useFocusTrap } from '@/modules/core/hooks/useFocusTrap'
import { AuthContext } from '@/modules/identidad/states/authContext'
import { MOCK_PLAYLISTS } from '@/modules/catalogo/mocks/playlists'
import { playlistService } from '@/modules/catalogo/services/playlistService'
import type { PlaylistDto } from '@/modules/catalogo/types/playlist.dto'
import type { TryOnGarmentDto } from '../types/tryon.dto'
import { garmentProblem } from '../utils/garments'
import { GarmentGrid } from './GarmentSelector'
import './PrendasDisponiblesDialog.css'

export type PestanaRopa = 'prendas' | 'playlists'

interface Props {
  open: boolean
  initialTab?: PestanaRopa
  onClose: () => void
  garments: TryOnGarmentDto[]
  loading: boolean
  error: unknown
  onRetry: () => void
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * Pop-up «Ropa disponible»: todas las prendas que se pueden probar con IA y, en otra pestaña, las playlists
 * de la persona. Elegir una prenda (o una prenda de una playlist) cierra el pop-up y la deja seleccionada.
 */
export function PrendasDisponiblesDialog({ open, initialTab = 'prendas', onClose, garments, loading, error, onRetry, selectedId, onSelect }: Props) {
  const auth = useContext(AuthContext)
  const userId = auth?.user?.id ? String(auth.user.id) : null
  const [tab, setTab] = useState<PestanaRopa>(initialTab)
  const [playlists, setPlaylists] = useState<PlaylistDto[]>(() => (env.useMocks ? MOCK_PLAYLISTS : []))
  const [cargandoPl, setCargandoPl] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const titulo = useId()
  useFocusTrap(ref, open, true)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  useEffect(() => {
    if (!open) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', alTeclear)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = antes
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || tab !== 'playlists' || env.useMocks) return
    let vivo = true
    setCargandoPl(true)
    Promise.all([
      userId ? playlistService.getMine(userId).catch(() => []) : Promise.resolve([]),
      userId ? playlistService.getSaved(userId).catch(() => []) : Promise.resolve([]),
    ])
      .then(([mias, guardadas]) => {
        if (!vivo) return
        const porId = new Map<string, PlaylistDto>()
        for (const pl of [...mias, ...guardadas]) if (!porId.has(pl.id)) porId.set(pl.id, pl)
        setPlaylists(Array.from(porId.values()))
      })
      .finally(() => vivo && setCargandoPl(false))
    return () => {
      vivo = false
    }
  }, [open, tab, userId])

  if (!open) return null

  const porId = new Map(garments.map((g) => [g.id, g]))
  const elegir = (id: string) => {
    onSelect(id)
    onClose()
  }

  return createPortal(
    <div className="sr-ropa__fondo" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titulo}
        className="sr-ropa sr-glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sr-ropa__cab">
          <div>
            <h2 id={titulo} className="sr-ropa__titulo">Ropa disponible</h2>
            <p className="sr-ropa__sub">Elige una prenda para probártela con IA.</p>
          </div>
          <button type="button" className="sr-ropa__cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div role="tablist" aria-label="Origen de la ropa" className="sr-ropa__tabs">
          <button type="button" role="tab" aria-selected={tab === 'prendas'} onClick={() => setTab('prendas')} className="sr-ropa__tab">
            Todas las prendas
          </button>
          <button type="button" role="tab" aria-selected={tab === 'playlists'} onClick={() => setTab('playlists')} className="sr-ropa__tab">
            Mis playlists
          </button>
        </div>

        <div className="sr-ropa__cuerpo">
          {tab === 'prendas' ? (
            <GarmentGrid garments={garments} loading={loading} error={error} onRetry={onRetry} selected={selectedId} onSelect={elegir} />
          ) : cargandoPl ? (
            <p className="animate-pulse text-sm text-[var(--color-text-muted)]">Cargando tus playlists…</p>
          ) : playlists.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Todavía no tienes playlists. Crea una desde «Arma tu look» y aparecerá aquí.
            </p>
          ) : (
            <ul className="sr-ropa__playlists" aria-label="Mis playlists">
              {playlists.map((pl) => {
                const probables = pl.prendas.map((p) => porId.get(p.id)).filter((g): g is TryOnGarmentDto => !!g && !garmentProblem(g))
                return (
                  <li key={pl.id} className="sr-ropa__playlist">
                    <div className="sr-ropa__pl-cab">
                      {(pl.portadaUrl || pl.prendas[0]?.imagen) && (
                        <img src={pl.portadaUrl || pl.prendas[0]?.imagen} alt="" className="sr-ropa__pl-img" loading="lazy" />
                      )}
                      <div className="min-w-0">
                        <h3 className="sr-ropa__pl-nombre">{pl.nombre}</h3>
                        <p className="sr-ropa__pl-meta">{pl.prendas.length} prendas · {probables.length} se pueden probar con IA</p>
                      </div>
                    </div>
                    {probables.length === 0 ? (
                      <p className="sr-ropa__pl-vacio">Ninguna prenda de esta playlist se puede probar con IA por ahora.</p>
                    ) : (
                      <ul className="sr-ropa__pl-prendas" aria-label={`Prendas de ${pl.nombre}`}>
                        {probables.map((g) => (
                          <li key={g.id}>
                            <button
                              type="button"
                              onClick={() => elegir(g.id)}
                              aria-pressed={selectedId === g.id}
                              aria-label={`${g.nombre} de la playlist ${pl.nombre}`}
                              className="sr-ropa__pl-prenda"
                            >
                              <img src={g.imagen} alt="" loading="lazy" />
                              <span>{g.nombre}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
