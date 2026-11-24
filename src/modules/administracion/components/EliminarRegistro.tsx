import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { errorKind, errorMessage } from '@/modules/core/api/errors'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'

interface Props {
  /** Texto del botón: «Eliminar» o «Eliminar cuenta». */
  boton: string
  titulo: string
  texto: string
  eliminar: () => Promise<void>
  /** Lista a la que se vuelve al terminar. */
  volverA: string
  avisoOk: string
  /** Si otro administrador ya lo eliminó (404), se vuelve a la lista con este aviso. */
  avisoYaNoExiste: string
}

/**
 * SR-RF-115, SR-RF-119 y SR-RF-120: eliminación definitiva desde el detalle. Pide confirmar con
 * «Esta acción no se puede deshacer» y vuelve a la lista con el aviso de eliminación.
 */
export function EliminarRegistro({ boton, titulo, texto, eliminar, volverA, avisoOk, avisoYaNoExiste }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    setBusy(true)
    setError('')
    try {
      await eliminar()
      navigate(volverA, { replace: true, state: { aviso: avisoOk } })
    } catch (e) {
      if (errorKind(e) === 'no-existe') {
        navigate(volverA, { replace: true, state: { aviso: avisoYaNoExiste } })
        return
      }
      setError(errorMessage(e, 'No pudimos eliminarlo. Intenta de nuevo.'))
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" disabled={busy} onClick={() => { setError(''); setOpen(true) }}
        className="rounded-xl border border-[#ffb4b4]/40 px-4 py-2.5 text-sm font-semibold text-[#ffb4b4] hover:bg-white/10 disabled:opacity-60">{boton}</button>
      {error && <p role="alert" className="mt-2 text-sm text-[#ffb4b4]">{error}</p>}
      <ConfirmDialog open={open} danger busy={busy} title={titulo} confirmLabel={busy ? 'Eliminando…' : 'Eliminar'}
        onConfirm={confirmar} onCancel={() => setOpen(false)}>
        <p>{texto}</p>
        <p className="mt-2 font-semibold">Esta acción no se puede deshacer.</p>
      </ConfirmDialog>
    </>
  )
}

/** Aviso que deja EliminarRegistro al volver a la lista («Cuenta eliminada», «Tienda eliminada»…). */
export function AvisoEliminado() {
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso
  if (!aviso) return null
  return <p role="status" className="mb-4 rounded-xl bg-[var(--sr-ok,#9be3b4)]/10 p-3 text-sm text-[var(--sr-ok,#9be3b4)]">{aviso}</p>
}
