import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/modules/core/design-system'
import { isValidPayerEmail } from '../utils/validation'

export const PAYER_EMAIL_INVALID_MSG = 'Ingresa un correo electrónico válido para realizar el pago.'
export const PAYER_EMAIL_RADAR_PLUS_INVALID_MSG = 'Ingresa un correo electrónico válido para activar Radar+.'
export const PAYMENT_INIT_ERROR_MSG = 'No fue posible iniciar el pago en este momento. Inténtalo nuevamente.'

export interface PayerEmailFormProps {
  /** Correo precargado de la cuenta autenticada (editable). */
  defaultEmail?: string
  /** Mensaje de validación de formato incorrecto (E.1). */
  invalidMessage?: string
  /** Texto del botón principal de envío. */
  submitLabel?: string
  /** Texto del botón mientras se procesa el cobro. */
  busyLabel?: string
  /** Estado de carga mientras inicia el cobro. */
  busy?: boolean
  /** Deshabilita el formulario. */
  disabled?: boolean
  /** Mensaje de error externo (ej. fallo de pasarela). */
  errorMessage?: string | null
  /** Acción al enviar con un correo válido. */
  onSubmit: (payerEmail: string) => void | Promise<void>
  /** Acción opcional para cancelar/volver. */
  onCancel?: () => void
  cancelLabel?: string
  /** Clase adicional para el contenedor. */
  className?: string
}

/**
 * Formulario compartido de Correo del pagador (RF-67, RF-93, RF-96, RF-100, E.1).
 * Valida formato estricto al salir del campo y al enviar; mueve el foco al campo si hay error.
 */
export function PayerEmailForm({
  defaultEmail = '',
  invalidMessage,
  submitLabel = 'Pagar con Mercado Pago',
  busyLabel = 'Procesando…',
  busy = false,
  disabled = false,
  errorMessage = null,
  onSubmit,
  onCancel,
  cancelLabel = 'Cancelar',
  className = '',
}: PayerEmailFormProps) {
  const actualInvalidMsg = invalidMessage || PAYER_EMAIL_INVALID_MSG
  const uid = useId()
  const inputId = `payer-email-${uid}`
  const errorId = `payer-email-err-${uid}`
  const hintId = `payer-email-hint-${uid}`

  const inputRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState(defaultEmail)
  const [touched, setTouched] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!touched && defaultEmail) {
      setEmail(defaultEmail)
    }
  }, [defaultEmail, touched])

  const handleBlur = () => {
    setTouched(true)
    if (!isValidPayerEmail(email)) {
      setValidationError(actualInvalidMsg)
    } else {
      setValidationError(null)
    }
  }

  const handleChange = (val: string) => {
    setEmail(val)
    if (validationError && isValidPayerEmail(val)) {
      setValidationError(null)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!isValidPayerEmail(email)) {
      setValidationError(actualInvalidMsg)
      inputRef.current?.focus()
      return
    }
    setValidationError(null)
    void onSubmit(email.trim())
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-[var(--sr-text-secondary,var(--color-text-muted))]"
        >
          Correo del pagador
        </label>
        <input
          ref={inputRef}
          id={inputId}
          name="payerEmail"
          type="email"
          autoComplete="email"
          value={email}
          disabled={busy || disabled}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="tucorreo@ejemplo.com"
          aria-required="true"
          aria-invalid={!!validationError}
          aria-describedby={validationError ? errorId : hintId}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-[var(--sr-text-primary,var(--color-text))] bg-[var(--sr-surface,var(--color-surface))] placeholder:text-[var(--sr-text-muted,var(--color-text-muted))] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--sr-focus,var(--color-focus-ring))] ${
            validationError
              ? 'border-[var(--color-danger-border,#ef4444)]'
              : 'border-[var(--sr-border,var(--color-border))] focus:border-[var(--sr-accent,var(--color-accent))]'
          }`}
        />
        <span id={hintId} className="text-xs text-[var(--sr-text-muted,var(--color-text-muted))]">
          Enviaremos el comprobante y continuaremos a Mercado Pago con este correo.
        </span>
        {validationError && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            className="mt-0.5 text-xs font-semibold text-[var(--color-danger-text,#ff8a8a)]"
          >
            {validationError}
          </p>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-[var(--color-danger-border,rgba(239,68,68,0.35))] bg-[var(--color-danger-bg,rgba(239,68,68,0.12))] p-3 text-xs font-semibold text-[var(--color-danger-text,#ffb4b4)]"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <Button type="submit" variant="primario" className="w-full flex-1" disabled={busy || disabled}>
          {busy ? busyLabel : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secundario" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  )
}
