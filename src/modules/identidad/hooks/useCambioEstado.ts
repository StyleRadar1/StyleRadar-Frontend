import { useCallback, useContext, useRef, useState } from 'react'
import { errorKind, errorMessage, fieldErrors } from '@/modules/core/api/errors'
import { useToasts } from '@/modules/core/components/errores'
import { AuthContext } from '../states/authContext'
import {
  ACCOUNT_STATUS_LABEL, REASON_MAX,
  type AccountStatus, type AdminUserDto, type ChangeStatusRequestDto,
} from '../types/usuario.dto'
import { TEXTOS_ADMIN_USUARIOS } from '../utils/erroresAdmin'
import { isSameAccount } from '../utils/formato'

export type Cambio = { user: AdminUserDto; to: AccountStatus }
type Deshacer = Cambio & { reason?: string }
export type AvisoCambio = { ok: boolean; text: string; undo?: Deshacer }

interface Opciones {
  setStatus: (id: string, body: ChangeStatusRequestDto) => Promise<AdminUserDto>
  /** 404: la cuenta ya no existe. */
  onNoExiste: () => void
  /** 409: el estado cambió mientras se veía. */
  onConflicto?: () => void
}

/** Motivo del cambio según SR-RF-66: obligatorio para bloquear y de máximo 1000 caracteres. */
export function errorDeMotivo(to: AccountStatus, motivo: string): string | null {
  if (to === 'BLOCKED' && !motivo.trim()) return 'Escribe el motivo del bloqueo.'
  if (motivo.length > REASON_MAX) return `El motivo admite hasta ${REASON_MAX} caracteres.`
  return null
}

/**
 * SR-RF-66: cambiar el estado de una cuenta con confirmación, motivo y deshacer.
 * Lo usan la lista y el detalle de Admin · Usuarios.
 */
export function useCambioEstado({ setStatus, onNoExiste, onConflicto }: Opciones) {
  const sessionEmail = useContext(AuthContext)?.user?.email
  const [cambio, setCambio] = useState<Cambio | null>(null)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [aviso, setAviso] = useState<AvisoCambio | null>(null)
  const inFlight = useRef(false)
  const toasts = useToasts()

  // Funciones estables: el diálogo vuelve a poner el foco al inicio si cambian sus manejadores.
  const abrir = useCallback((user: AdminUserDto) => {
    if (isSameAccount(user.email, sessionEmail)) {
      setAviso({ ok: false, text: 'No puedes cambiar el estado de tu propia cuenta.' })
      return
    }
    setCambio({ user, to: user.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' })
    setMotivo(''); setErrorMotivo(null)
  }, [sessionEmail])
  const elegir = useCallback((to: AccountStatus) => { setCambio((c) => (c ? { ...c, to } : c)); setErrorMotivo(null) }, [])
  const escribir = useCallback((m: string) => { setMotivo(m); setErrorMotivo(null) }, [])
  const cancelar = useCallback(() => { if (!inFlight.current) setCambio(null) }, [])

  const enviar = async (c: Cambio, reason: string, esDeshacer: boolean) => {
    if (isSameAccount(c.user.email, sessionEmail)) {
      setAviso({ ok: false, text: 'No puedes cambiar el estado de tu propia cuenta.' })
      setCambio(null)
      return
    }
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setAviso(null)
    const antes = c.user
    let cerrar = true
    try {
      const upd = await setStatus(c.user.id, { status: c.to, ...(reason.trim() ? { reason } : {}) })
      // Volver a Bloqueada exige motivo: se reutiliza el que tenía; sin él no se ofrece deshacer.
      const motivoAntes = antes.statusChangeReason ?? ''
      const undo = antes.accountStatus !== 'BLOCKED' || motivoAntes.trim()
        ? { user: upd, to: antes.accountStatus, reason: antes.accountStatus === 'BLOCKED' ? motivoAntes : undefined }
        : undefined
      setAviso(esDeshacer
        ? { ok: true, text: `Se deshizo el cambio: ${upd.name} vuelve a estar ${ACCOUNT_STATUS_LABEL[upd.accountStatus]}.` }
        : { ok: true, text: `${upd.name} ahora está ${ACCOUNT_STATUS_LABEL[upd.accountStatus]}.`, undo })
    } catch (e) {
      const kind = errorKind(e)
      const campos = fieldErrors(e)
      const delMotivo = campos.reasonValid ?? campos.reason
      // 400 por el motivo (EX-03 · EX-04): el diálogo sigue abierto con el error junto al campo.
      if (kind === 'datos' && delMotivo && !esDeshacer) { setErrorMotivo(delMotivo); cerrar = false; return }
      // 403: no se toca la lista, así la cuenta se ve con el estado que tenía.
      if (kind === 'permiso') { toasts.mostrar({ tono: 'error', ...TEXTOS_ADMIN_USUARIOS.sinPermiso }); return }
      // 404: la cuenta ya no está.
      if (kind === 'no-existe') { toasts.mostrar({ tono: 'info', ...TEXTOS_ADMIN_USUARIOS.noExiste }); onNoExiste(); return }
      setAviso({ ok: false, text: errorMessage(e, 'No se pudo cambiar el estado de la cuenta.') })
      if (kind === 'conflicto') onConflicto?.()
    } finally {
      inFlight.current = false; setBusy(false)
      if (cerrar) setCambio(null)
    }
  }

  const confirmar = () => {
    if (!cambio) return
    const err = errorDeMotivo(cambio.to, motivo)
    if (err) { setErrorMotivo(err); return }
    return enviar(cambio, motivo, false)
  }
  const deshacer = () => aviso?.undo && enviar(aviso.undo, aviso.undo.reason ?? '', true)

  return { cambio, abrir, elegir, motivo, escribir, errorMotivo, busy, aviso, confirmar, deshacer, cancelar, toasts }
}
