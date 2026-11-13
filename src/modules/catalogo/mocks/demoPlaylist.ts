import { ApiError } from '@/modules/core/api/apiClient'
import { MENSAJES } from '@/modules/core/api/mensajes'

/**
 * Solo datos de prueba. Con /playlists?demo-playlist=422 agregar una prenda responde 422
 * (como si la playlist ya tuviera 15 prendas en el servidor). Dura lo que dura la pestaña;
 * ?demo-playlist= (vacío) lo apaga.
 */
const KEY = 'sr_demo_playlist'

function activo(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('demo-playlist')
    if (q !== null) sessionStorage.setItem(KEY, q)
    return sessionStorage.getItem(KEY) ?? ''
  } catch { return '' }
}

export function fallarSiDemoPlaylist() {
  if (activo() === '422') throw new ApiError(422, MENSAJES.datos)
}
