import { Link } from 'react-router-dom'
import type { Role } from '@/modules/core/types/roles'

export interface LegalConsentState {
  aceptaTerminos: boolean
  aceptaDatos: boolean
  /**
   * Se conserva para compatibilidad con registros históricos.
   * La mayoría de edad se entiende aceptada al aceptar los Términos y Condiciones.
   */
  esMayorDeEdad: boolean
  aceptaPromociones: boolean
  aceptaReglasTienda?: boolean
  aceptaReglasFundacion?: boolean
}

export interface LegalConsentErrors {
  terminos?: string
  datos?: string
  /** @deprecated La edad se acepta dentro de los Términos y Condiciones. */
  edad?: string
  reglasTienda?: string
  reglasFundacion?: string
}

interface LegalConsentCheckboxesProps {
  state: LegalConsentState
  onChange: (updates: Partial<LegalConsentState>) => void
  errors?: LegalConsentErrors
  role?: Role | 'BUYER'
  showPromociones?: boolean
  compact?: boolean
}

const CHECKBOX_CLASS =
  'mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

const TEXT_CLASS =
  'text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)] leading-snug'

const LINK_CLASS =
  'font-semibold underline decoration-from-font underline-offset-2 text-[var(--color-accent)] hover:text-[var(--color-accent-strong,var(--color-accent))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

function ErrorLine({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1 pl-6 text-xs font-semibold text-[var(--color-danger-text,#ef4444)]">
      {message}
    </p>
  )
}

export function LegalConsentCheckboxes({
  state,
  onChange,
  errors = {},
  role = 'BUYER',
  showPromociones = true,
  compact = false,
}: LegalConsentCheckboxesProps) {
  const isTienda = role === 'STORE_ADMIN'
  const isFundacion = role === 'FOUNDATION_REPRESENTATIVE'

  return (
    <fieldset className={`space-y-2.5 pt-1 text-left ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
      <legend className="sr-only">Consentimientos legales y autorizaciones obligatorias</legend>

      <div>
        <label className="group flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            id="consent-terminos"
            checked={state.aceptaTerminos}
            onChange={(e) => onChange({ aceptaTerminos: e.target.checked })}
            aria-describedby={errors.terminos ? 'consent-terminos-err' : undefined}
            aria-required="true"
            className={CHECKBOX_CLASS}
          />
          <span className={TEXT_CLASS}>
            Acepto los{' '}
            <Link
              to="/legal/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
              onClick={(e) => e.stopPropagation()}
            >
              Términos y Condiciones
            </Link>
            . <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
          </span>
        </label>
        <ErrorLine id="consent-terminos-err" message={errors.terminos} />
      </div>

      <div>
        <label className="group flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            id="consent-datos"
            checked={state.aceptaDatos}
            onChange={(e) => onChange({ aceptaDatos: e.target.checked })}
            aria-describedby={errors.datos ? 'consent-datos-err' : undefined}
            aria-required="true"
            className={CHECKBOX_CLASS}
          />
          <span className={TEXT_CLASS}>
            Autorizo el tratamiento de mis datos según la{' '}
            <Link
              to="/legal/datos-personales"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
              onClick={(e) => e.stopPropagation()}
            >
              Política de Datos
            </Link>{' '}
            (Ley 1581). <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
          </span>
        </label>
        <ErrorLine id="consent-datos-err" message={errors.datos} />
      </div>

      {isTienda && (
        <div>
          <label className="group flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              id="consent-reglas-tienda"
              checked={state.aceptaReglasTienda ?? false}
              onChange={(e) => onChange({ aceptaReglasTienda: e.target.checked })}
              aria-describedby={errors.reglasTienda ? 'consent-tienda-err' : undefined}
              aria-required="true"
              className={CHECKBOX_CLASS}
            />
            <span className={TEXT_CLASS}>
              Acepto las{' '}
              <Link
                to="/legal/reglas-tiendas"
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
                onClick={(e) => e.stopPropagation()}
              >
                Reglas para Tiendas y Marcas Aliadas
              </Link>
              . <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
            </span>
          </label>
          <ErrorLine id="consent-tienda-err" message={errors.reglasTienda} />
        </div>
      )}

      {isFundacion && (
        <div>
          <label className="group flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              id="consent-reglas-fundacion"
              checked={state.aceptaReglasFundacion ?? false}
              onChange={(e) => onChange({ aceptaReglasFundacion: e.target.checked })}
              aria-describedby={errors.reglasFundacion ? 'consent-fundacion-err' : undefined}
              aria-required="true"
              className={CHECKBOX_CLASS}
            />
            <span className={TEXT_CLASS}>
              Acepto las{' '}
              <Link
                to="/legal/reglas-fundaciones"
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
                onClick={(e) => e.stopPropagation()}
              >
                Reglas para Fundaciones y Donaciones
              </Link>
              . <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
            </span>
          </label>
          <ErrorLine id="consent-fundacion-err" message={errors.reglasFundacion} />
        </div>
      )}

      {showPromociones && (
        <div>
          <label className="group flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              id="consent-promo"
              checked={state.aceptaPromociones}
              onChange={(e) => onChange({ aceptaPromociones: e.target.checked })}
              className={CHECKBOX_CLASS}
            />
            <span className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text)] leading-snug">
              (Opcional) Quiero recibir novedades y descuentos de tiendas locales.
            </span>
          </label>
        </div>
      )}
    </fieldset>
  )
}
