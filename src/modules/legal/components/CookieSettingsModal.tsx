import { useEffect, useRef, useState } from 'react'
import { consentService } from '../services/consentService'
import type { CookieConsent } from '../types/legal.types'

interface CookieSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: (consent: CookieConsent) => void
}

export function CookieSettingsModal({ isOpen, onClose, onSaved }: CookieSettingsModalProps) {
  const current = consentService.getCookieConsent()
  const [functional, setFunctional] = useState(current?.functional ?? false)
  const [analytics, setAnalytics] = useState(current?.analytics ?? false)
  const [marketing, setMarketing] = useState(current?.marketing ?? false)

  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      const active = consentService.getCookieConsent()
      setFunctional(active?.functional ?? false)
      setAnalytics(active?.analytics ?? false)
      setMarketing(active?.marketing ?? false)

      // Atrapado de foco y tecla Escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      setTimeout(() => firstFocusableRef.current?.focus(), 50)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSaveCustom = async () => {
    const consent = await consentService.saveCookieConsent({
      functional,
      analytics,
      marketing,
    })
    onSaved?.(consent)
    onClose()
  }

  const handleAcceptAll = async () => {
    const consent = await consentService.acceptAllCookies()
    onSaved?.(consent)
    onClose()
  }

  const handleRejectNonEssential = async () => {
    const consent = await consentService.rejectNonEssentialCookies()
    onSaved?.(consent)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
      ref={modalRef}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl text-[var(--color-text)] overflow-hidden">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">🍪</span>
            <h2 id="cookie-settings-title" className="text-lg font-bold">
              Configuración de Cookies y Privacidad
            </h2>
          </div>
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Cerrar modal de configuración de cookies"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            En Style Radar respetamos tu privacidad y el marco normativo colombiano (Ley 1581 de 2012 y Ley 1480 de 2011). Las cookies necesarias se instalan de forma predeterminada para el funcionamiento seguro del sitio. Puedes personalizar a continuación las demás categorías:
          </p>

          {/* 1. Necesarias */}
          <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[var(--color-text)]">Cookies Técnicas y Necesarias</h3>
                  <span className="rounded-full bg-[var(--color-accent)]/20 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-accent)] uppercase">
                    Siempre activas
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Permiten la autenticación segura, la sesión de usuario, la navegación básica y la prevención de fraudes. No pueden desactivarse en nuestros sistemas.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                aria-label="Cookies necesarias siempre activas"
                className="h-5 w-5 mt-1 accent-[var(--color-accent)] opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* 2. Funcionales */}
          <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[var(--color-text)]">Cookies Funcionales y de Preferencia</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Recuerdan tus elecciones previas, como el filtro de búsqueda seleccionado, el maniquí preferido en el probador o la vista del mapa de tiendas en Bogotá.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
              </label>
            </div>
          </div>

          {/* 3. Analíticas */}
          <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[var(--color-text)]">Cookies Analíticas</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Nos ayudan a entender de manera totalmente agregada y anónima cómo interactúan los usuarios con el catálogo y las tiendas para optimizar la velocidad y ergonomía de la plataforma.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
              </label>
            </div>
          </div>

          {/* 4. Publicitarias */}
          <div className="rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[var(--color-text)]">Cookies de Publicidad y Campañas Locales</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Permiten evaluar la efectividad de promociones de tiendas independientes de Bogotá y evitar la repetición excesiva de banners de descuentos.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Botones de acción del modal (mismo peso visual, sin trampas oscuras) */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 px-6 py-4">
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] font-semibold text-xs transition-colors"
          >
            Rechazar no esenciales
          </button>
          <button
            type="button"
            onClick={handleSaveCustom}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] font-semibold text-xs text-[var(--color-accent)] transition-colors"
          >
            Guardar preferencias
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90 font-bold text-xs transition-opacity"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  )
}
