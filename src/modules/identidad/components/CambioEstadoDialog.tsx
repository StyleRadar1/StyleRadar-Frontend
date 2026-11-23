import { useId } from 'react'
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog'
import { inputCls } from '../utils/campo'
import { ACCOUNT_STATUSES, ACCOUNT_STATUS_HELP, ACCOUNT_STATUS_LABEL, REASON_MAX, type AccountStatus } from '../types/usuario.dto'
import type { Cambio } from '../hooks/useCambioEstado'

interface Props {
  cambio: Cambio | null
  motivo: string
  errorMotivo: string | null
  busy: boolean
  onElegir: (to: AccountStatus) => void
  onMotivo: (m: string) => void
  onCancel: () => void
  onConfirm: () => void
}

/** SR-RF-66: elegir el nuevo estado y escribir el motivo (obligatorio al bloquear, máximo 1000 caracteres). */
export function CambioEstadoDialog({ cambio, motivo, errorMotivo, busy, onElegir, onMotivo, onCancel, onConfirm }: Props) {
  const id = useId()
  const bloquear = cambio?.to === 'BLOCKED'
  return (
    <ConfirmDialog open={!!cambio} busy={busy} danger={bloquear}
      title={cambio ? `Estado de ${cambio.user.name}` : ''}
      confirmLabel={cambio ? `Cambiar a ${ACCOUNT_STATUS_LABEL[cambio.to]}` : ''}
      onCancel={onCancel} onConfirm={onConfirm}>
      {cambio && (
        <>
          <fieldset>
            <legend className="text-white/75">Hoy está {ACCOUNT_STATUS_LABEL[cambio.user.accountStatus]}. Elige el nuevo estado:</legend>
            <div role="radiogroup" aria-label="Nuevo estado" className="mt-3 flex flex-col gap-2">
              {ACCOUNT_STATUSES.filter((s) => s !== cambio.user.accountStatus).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={cambio.to === s} onClick={() => onElegir(s)}
                  className={`rounded-xl border px-4 py-3 text-left ${cambio.to === s ? 'border-arena bg-arena/10' : 'border-white/20 hover:bg-white/5'}`}>
                  <span className="block font-semibold text-blanco">{cambio.to === s && <span aria-hidden="true">✓ </span>}{ACCOUNT_STATUS_LABEL[s]}</span>
                  <span className="block text-xs text-white/65">{ACCOUNT_STATUS_HELP[s]}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor={`${id}-motivo`} className="mt-4 block text-xs font-bold uppercase tracking-[.14em] text-white/70">
            {bloquear ? 'Motivo del bloqueo (obligatorio)' : 'Motivo (opcional)'}
          </label>
          <textarea id={`${id}-motivo`} value={motivo} onChange={(e) => onMotivo(e.target.value)} rows={3} maxLength={REASON_MAX}
            disabled={busy} aria-invalid={!!errorMotivo} aria-required={bloquear}
            aria-describedby={`${id}-cuenta${errorMotivo ? ` ${id}-error` : ''}`}
            placeholder={bloquear ? 'Cuéntale al equipo por qué se bloquea la cuenta.' : ''}
            className={`${inputCls} mt-1.5 resize-y`} />
          <p id={`${id}-cuenta`} className="mt-1 text-right text-xs text-white/55">{motivo.length}/{REASON_MAX}</p>
          {errorMotivo && <p id={`${id}-error`} role="alert" className="text-sm text-[var(--sr-bad,#ffb4b4)]">{errorMotivo}</p>}
        </>
      )}
    </ConfirmDialog>
  )
}
