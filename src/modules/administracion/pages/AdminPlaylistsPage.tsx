import { useState } from 'react'
import { ApiError } from '@/modules/core/api/apiClient'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ErrorToast } from '@/modules/core/components/ErrorFeedback'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { AdminHeader, AdminTable, type Columna } from '../components/AdminUi'
import { adminPlaylistService } from '../services/adminService'
import { interaccion, MAX_DESTACADAS, type AdminPlaylistDto } from '../types/admin.dto'

const num = (n: number) => n.toLocaleString('es-CO')

/** Admin › Playlists: las de mayor interacción y cuáles se destacan en el inicio (máximo 3, RNF-12). */
export default function AdminPlaylistsPage() {
  const { data, loading, error, reload, setData } = useResource(adminPlaylistService.list, [] as AdminPlaylistDto[])
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string } | null>(null)
  const ranking = [...data].sort((a, b) => interaccion(b) - interaccion(a)).map((p) => p.id)
  const destacadas = data.filter((p) => p.destacada).length

  const alternar = async (p: AdminPlaylistDto) => {
    setBusy(p.id); setMsg(null)
    try {
      const n = await adminPlaylistService.setFeatured(p.id, !p.destacada)
      setData((l) => l.map((x) => (x.id === n.id ? { ...n } : x)))
      setMsg({ tone: 'ok', text: n.destacada ? `«${n.nombre}» se destaca en el inicio.` : `«${n.nombre}» ya no se destaca en el inicio.` })
    } catch (e) {
      if (errorKind(e) === 'conflicto' || (e instanceof ApiError && e.status === 422)) {
        setMsg({ tone: 'warn', text: 'Ya hay 3 destacadas. Quita una primero' })
        reload()
      } else {
        setMsg({ tone: 'bad', text: errorMessage(e, 'No pudimos cambiar la playlist destacada.') })
      }
    }
    finally { setBusy(null) }
  }

  const columnas: Columna<AdminPlaylistDto>[] = [
    { label: '#', render: (p) => ranking.indexOf(p.id) + 1, sort: (p) => -interaccion(p), num: true },
    { label: 'Playlist', render: (p) => <b>{p.nombre}</b>, sort: (p) => p.nombre },
    { label: 'Creada por', render: (p) => p.creador, sort: (p) => p.creador },
    { label: 'Me gusta', render: (p) => num(p.meGusta), sort: (p) => p.meGusta, num: true },
    { label: 'Guardados', render: (p) => num(p.guardados), sort: (p) => p.guardados, num: true },
    { label: 'Prendas', render: (p) => `${p.prendas}/15`, sort: (p) => p.prendas, num: true, secundaria: true },
  ]

  return (
    <>
      <AdminHeader kicker="Moderación · destacados del inicio" title="Playlists" />
      <div className="mb-4 flex gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4">
        <span aria-hidden="true" className="text-arena">✦</span>
        <p className="text-sm"><b className="block">Destaca hasta {MAX_DESTACADAS} playlists en el inicio <span className="font-normal text-white/60">· {destacadas} de {MAX_DESTACADAS} en uso</span></b>
          <span className="text-white/70">La lista está ordenada por interacción (me gusta + guardados × 2). Las destacadas aparecen con la etiqueta «★ Destacada» en la sección Playlists de estilo.</span></p>
      </div>
      <ErrorToast
        open={!!msg}
        tone={msg?.tone ?? 'ok'}
        icon={msg?.tone === 'ok' ? 'ok' : 'warn'}
        title={msg?.text ?? ''}
        onClose={() => setMsg(null)}
      />
      {loading && !data.length ? <Loading label="Cargando playlists…" /> : error ? <ErrorState error={error} onRetry={reload} title="No pudimos cargar las playlists" /> : (
        <AdminTable rows={data} columnas={columnas} keyOf={(p) => p.id} titulo={(p) => p.nombre} vacio="No hay playlists públicas con esa búsqueda."
          buscar={{ placeholder: 'Buscar playlist o creador', texto: (p) => `${p.nombre} ${p.creador}` }}
          acciones={(p) => (
            <button type="button" aria-pressed={p.destacada} disabled={busy === p.id} onClick={() => alternar(p)} aria-label={`${p.destacada ? 'Quitar de destacadas' : 'Destacar'}: ${p.nombre}`}
              className={`rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60 ${p.destacada ? 'bg-violeta' : 'border border-white/20 hover:bg-white/10'}`}>
              {p.destacada ? '★ Destacada' : 'Destacar'}
            </button>
          )} />
      )}
    </>
  )
}
