import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { consentService } from '../services/consentService'
import { CookieSettingsModal } from './CookieSettingsModal'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDataNotice, setShowDataNotice] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    // 1. Verificar si falta consentimiento de cookies
    const currentConsent = consentService.getCookieConsent()
    if (!currentConsent) {
      setShowBanner(true)
    }

    // 2. Verificar si debe mostrarse el aviso de actualización de política de datos
    if (consentService.shouldShowDataPolicyUpdateNotice()) {
      setShowDataNotice(true)
    }

    // 3. Listener global para abrir modal de cookies desde el pie de página u otros enlaces
    const handleOpenSettings = () => {
      setIsSettingsOpen(true)
    }
    window.addEventListener('sr-open-cookie-settings', handleOpenSettings)

    const handleConsentUpdated = () => {
      setShowBanner(false)
    }
    window.addEventListener('sr-cookie-consent-updated', handleConsentUpdated)

    return () => {
      window.removeEventListener('sr-open-cookie-settings', handleOpenSettings)
      window.removeEventListener('sr-cookie-consent-updated', handleConsentUpdated)
    }
  }, [])

  const handleAcceptAll = async () => {
    await consentService.acceptAllCookies()
    setShowBanner(false)
  }

  const handleRejectNonEssential = async () => {
    await consentService.rejectNonEssentialCookies()
    setShowBanner(false)
  }

  const handleDismissDataNotice = () => {
    consentService.acknowledgeDataPolicyUpdate()
    setShowDataNotice(false)
  }

  // Si ninguno de los dos debe mostrarse y el modal está cerrado, renderizar solo el modal oculto
  if (!showBanner && !showDataNotice && !isSettingsOpen) {
    return null
  }

  return (
    <>
      {/* Contenedor apilado flotante: Abajo a la izquierda en escritorio, ancho completo en móvil */}
      <aside
        className="fixed bottom-3 left-3 right-3 sm:right-auto sm:max-w-xl z-50 flex flex-col gap-2.5 pointer-events-auto"
        aria-label="Avisos de privacidad y cookies"
      >
        {/* AVISO SUPERIOR APILADO: Política de Datos Personales Actualizada */}
        {showDataNotice && (
          <div
            className="relative flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs sm:text-sm text-[var(--color-text)] animate-in fade-in slide-in-from-bottom-2 duration-300"
            role="status"
            aria-live="polite"
          >
            <div className="space-y-0.5 pr-2">
              <p className="font-medium text-[var(--color-text)]">
                Nuestra Política de Protección de Datos Personales fue actualizada.
              </p>
              <Link
                to="/legal/datos-personales"
                onClick={handleDismissDataNotice}
                className="inline-block font-bold text-[var(--color-accent)] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Acceda al documento aquí
              </Link>
            </div>
            <button
              type="button"
              onClick={handleDismissDataNotice}
              className="shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              aria-label="Cerrar aviso de actualización de política de datos"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* BANNER INFERIOR: Banner de Cookies de Tres Botones con Mismo Peso Visual */}
        {showBanner && (
          <div
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl text-xs sm:text-sm text-[var(--color-text)] animate-in fade-in slide-in-from-bottom-4 duration-300"
            role="region"
            aria-label="Consentimiento de cookies"
          >
            <p className="leading-relaxed text-[var(--color-text-muted)]">
              Este sitio web utiliza cookies con diversas finalidades. Al aceptar todas las cookies das tu consentimiento para que la compañía de forma directa o a través de terceros, pueda almacenar, acceder y procesar los datos sobre tu visita al sitio. En configurar puedes conocer las distintas cookies que se recopilan y puedes activar o desactivar su seguimiento, excepto las cookies necesarias. Recuerda que igual puedes consultar nuestra{' '}
              <Link
                to="/legal/datos-personales"
                className="font-semibold text-[var(--color-text)] underline underline-offset-2 hover:text-[var(--color-accent)]"
              >
                Política de protección de datos personales
              </Link>{' '}
              y nuestra{' '}
              <Link
                to="/legal/cookies"
                className="font-semibold text-[var(--color-text)] underline underline-offset-2 hover:text-[var(--color-accent)]"
              >
                Política de cookies
              </Link>
              .
            </p>

            {/* Tres botones con el MISMO peso visual (sin patrones engañosos) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/70 hover:bg-[var(--color-surface-raised)] py-2.5 px-3 text-center text-xs font-semibold text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/70 hover:bg-[var(--color-surface-raised)] py-2.5 px-3 text-center text-xs font-semibold text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Rechazar no esenciales
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/70 hover:bg-[var(--color-surface-raised)] py-2.5 px-3 text-center text-xs font-semibold text-[var(--color-accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Modal accesible de configuración de cookies */}
      <CookieSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          setShowBanner(false)
        }}
      />
    </>
  )
}
