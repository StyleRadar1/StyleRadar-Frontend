import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { usuarioService } from '../services/usuarioService'
import type { ActualizarPerfilDto, PerfilDto } from '../types/usuario.dto'

const load = (): Promise<PerfilDto | null> => usuarioService.me()

/** RF-03 a RF-06: perfil de la persona con sesión. */
export function useProfile() {
  const { data, loading, error, reload, setData } = useResource(load, null as PerfilDto | null)

  const save = useCallback(async (body: ActualizarPerfilDto) => {
    const upd = await usuarioService.updateMe(body)
    setData(() => upd)
    return upd
  }, [setData])

  return { profile: data, loading, error, reload, save }
}
