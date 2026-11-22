import { useCallback, useEffect, useState } from 'react'
import { usuarioService } from '../services/usuarioService'
import type { AdminUserDto, AdminUsersQuery, ChangeStatusRequestDto, PageDto } from '../types/usuario.dto'

const VACIA: PageDto<AdminUserDto> = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true }

interface Result { tag: string; page: PageDto<AdminUserDto>; error: unknown }

/**
 * SR-RF-66: búsqueda de cuentas en el servidor (filtros y página) con carga, error y cambio de estado.
 * `loading` se deriva de la consulta pedida, sin setState dentro del efecto.
 */
export function useAdminUsers(filtros: AdminUsersQuery) {
  const [version, setVersion] = useState(0)
  const clave = JSON.stringify(filtros)
  const tag = `${clave}#${version}`
  const [res, setRes] = useState<Result>({ tag: '', page: VACIA, error: null })

  useEffect(() => {
    let active = true
    usuarioService.listAdmin(JSON.parse(clave) as AdminUsersQuery)
      .then((page) => { if (active) setRes({ tag, page, error: null }) })
      .catch((error) => { if (active) setRes((r) => ({ tag, page: r.page, error })) })
    return () => { active = false }
  }, [clave, tag])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const setStatus = useCallback(async (id: string, body: ChangeStatusRequestDto) => {
    const upd = await usuarioService.setStatus(id, body)
    setRes((r) => ({ ...r, page: { ...r.page, content: r.page.content.map((u) => (u.id === upd.id ? upd : u)) } }))
    return upd
  }, [])

  return { page: res.page, users: res.page.content, loading: res.tag !== tag, error: res.error, reload, setStatus }
}
