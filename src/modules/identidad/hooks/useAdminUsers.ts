import { useCallback } from 'react'
import { useResource } from '@/modules/core/hooks/useResource'
import { usuarioService } from '../services/usuarioService'
import type { EstadoCuenta, UsuarioAdminDto } from '../types/usuario.dto'

const load = () => usuarioService.list()

/** RF-66: lista de cuentas con carga, error y cambio de estado. */
export function useAdminUsers() {
  const { data, loading, error, reload, setData } = useResource(load, [] as UsuarioAdminDto[])

  const setStatus = useCallback(async (id: string, estado: EstadoCuenta) => {
    const upd = await usuarioService.setStatus(id, { estado })
    setData((list) => list.map((u) => (u.id === upd.id ? upd : u)))
    return upd
  }, [setData])

  return { users: data, loading, error, reload, setStatus }
}
