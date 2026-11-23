import { Link } from 'react-router-dom'
import type { Role } from '@/modules/core/types/roles'

export interface LegalConsentState {
  aceptaTerminos: boolean
  aceptaDatos: boolean
  esMayorDeEdad: boolean
  aceptaPromociones: boolean
  aceptaReglasTienda?: boolean
  aceptaReglasFundacion?: boolean
}

export interface LegalConsentErrors {
  terminos?: string
  datos?: string
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
    <fieldset className={`space-y-3 pt-2 text-left ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
      <legend className="sr-only">Consentimientos legales y autorizaciones obligatorias</legend>

      {/* (a) Términos y Condiciones */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            id="consent-terminos"
            checked={state.aceptaTerminos}
            onChange={(e) => onChange({ aceptaTerminos: e.target.checked })}
            aria-describedby={errors.terminos ? 'consent-terminos-err' : undefined}
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 bg-[var(--color-surface)] cursor-pointer shrink-0"
          />
          <span className="text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
            Acepto los{' '}
            <Link
              to="/legal/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline underline-offset-2 text-[var(--color-accent)]"
              onClick={(e) => e.stopPropagation()}
            >
              Términos y Condiciones
            </Link>{' '}
            de uso de la plataforma. <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
          </span>
        </label>
        {errors.terminos && (
          <p id="consent-terminos-err" role="alert" className="mt-1 text-xs font-semibold text-[var(--color-danger-text,#ef4444)] pl-6">
            {errors.terminos}
          </p>
        )}
      </div>

      {/* (b) Política de Datos Personales (Habeas Data) */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            id="consent-datos"
            checked={state.aceptaDatos}
            onChange={(e) => onChange({ aceptaDatos: e.target.checked })}
            aria-describedby={errors.datos ? 'consent-datos-err' : undefined}
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 bg-[var(--color-surface)] cursor-pointer shrink-0"
          />
          <span className="text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
            Autorizo el tratamiento de mis datos personales según la{' '}
            <Link
              to="/legal/datos-personales"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline underline-offset-2 text-[var(--color-accent)]"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Tratamiento de Datos Personales
            </Link>{' '}
            (Habeas Data - Ley 1581 de 2012). <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
          </span>
        </label>
        {errors.datos && (
          <p id="consent-datos-err" role="alert" className="mt-1 text-xs font-semibold text-[var(--color-danger-text,#ef4444)] pl-6">
            {errors.datos}
          </p>
        )}
      </div>

      {/* (c) Confirmación de mayoría de edad (+18 años) */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            id="consent-edad"
            checked={state.esMayorDeEdad}
            onChange={(e) => onChange({ esMayorDeEdad: e.target.checked })}
            aria-describedby={errors.edad ? 'consent-edad-err' : undefined}
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 bg-[var(--color-surface)] cursor-pointer shrink-0"
          />
          <span className="text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
            Confirmo que tengo dieciocho (18) años o más y cuento con capacidad legal para contratar. <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
          </span>
        </label>
        {errors.edad && (
          <p id="consent-edad-err" role="alert" className="mt-1 text-xs font-semibold text-[var(--color-danger-text,#ef4444)] pl-6">
            {errors.edad}
          </p>
        )}
      </div>

      {/* (d) Reglas específicas para Tiendas */}
      {isTienda && (
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              id="consent-reglas-tienda"
              checked={state.aceptaReglasTienda ?? false}
              onChange={(e) => onChange({ aceptaReglasTienda: e.target.checked })}
              aria-describedby={errors.reglasTienda ? 'consent-tienda-err' : undefined}
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 bg-[var(--color-surface)] cursor-pointer shrink-0"
            />
            <span className="text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
              Acepto las{' '}
              <Link
                to="/legal/reglas-tiendas"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2 text-[var(--color-accent)]"
                onClick={(e) => e.stopPropagation()}
              >
                Reglas para Tiendas y Marcas Aliadas
              </Link>{' '}
              (incluye prohibición estricta de réplicas y cumplimiento de garantías). <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
            </span>
          </label>
          {errors.reglasTienda && (
            <p id="consent-tienda-err" role="alert" className="mt-1 text-xs font-semibold text-[var(--color-danger-text,#ef4444)] pl-6">
              {errors.reglasTienda}
            </p>
          )}
        </div>
      )}

      {/* (e) Reglas específicas para Fundaciones */}
      {isFundacion && (
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              id="consent-reglas-fundacion"
              checked={state.aceptaReglasFundacion ?? false}
              onChange={(e) => onChange({ aceptaReglasFundacion: e.target.checked })}
              aria-describedby={errors.reglasFundacion ? 'consent-fundacion-err' : undefined}
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 bg-[var(--color-surface)] cursor-pointer shrink-0"
            />
            <span className="text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-tight">
              Acepto las{' '}
              <Link
                to="/legal/reglas-fundaciones"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2 text-[var(--color-accent)]"
                onClick={(e) => e.stopPropagation()}
              >
                Reglas para Fundaciones y Donaciones
              </Link>{' '}
              (compromiso de verificación ESAL y prohibición total de reventa). <span className="text-[var(--color-danger-text,#ef4444)]">*</span>
            </span>
          </label>
          {errors.reglasFundacion && (
            <p id="consent-fundacion-err" role="alert" className="mt-1 text-xs font-semibold text-[var(--color-danger-text,#ef4444)] pl-6">
              {errors.reglasFundacion}
            </p>
          )}
        </div>
      )}

      {/* (f) Novedades y promociones (Opcional, desmarcado por defecto) */}
      {showPromociones && (
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              id="consent-promo"
              checked={state.aceptaPromociones}
              onChange={(e) => onChange({ aceptaPromociones: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 bg-[var(--color-surface)] cursor-pointer shrink-0"
            />
            <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors leading-tight">
              (Opcional) Quiero recibir novedades, lanzamientos y descuentos exclusivos de tiendas locales de Bogotá por correo electrónico.
            </span>
          </label>
        </div>
      )}
    </fieldset>
  )
}
