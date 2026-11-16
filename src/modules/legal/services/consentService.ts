import { LEGAL_VERSIONS } from '../config/legalConfig'
import type { CookieConsent, FormConsentRecord } from '../types/legal.types'

const STORAGE_KEYS = {
  cookieConsent: 'sr_cookie_consent_v1',
  dataPolicyAck: 'sr_data_policy_acknowledged_version',
  formConsents: 'sr_form_consents_log',
} as const

export const consentService = {
  /** Obtiene el consentimiento de cookies guardado si coincide con la versión activa. */
  getCookieConsent(): CookieConsent | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.cookieConsent)
      if (!raw) return null
      const parsed: CookieConsent = JSON.parse(raw)
      if (parsed.version !== LEGAL_VERSIONS.cookiesVersion) {
        // La versión cambió; se debe volver a solicitar
        return null
      }
      return parsed
    } catch {
      return null
    }
  },

  /** Guarda el consentimiento de cookies tanto en localStorage como en el mock del backend. */
  async saveCookieConsent(
    preferences: Omit<CookieConsent, 'timestamp' | 'version' | 'necessary'>
  ): Promise<CookieConsent> {
    const consent: CookieConsent = {
      timestamp: new Date().toISOString(),
      version: LEGAL_VERSIONS.cookiesVersion,
      necessary: true,
      functional: preferences.functional,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    }

    try {
      localStorage.setItem(STORAGE_KEYS.cookieConsent, JSON.stringify(consent))
      // También se actualiza la versión de política de datos si no estaba
      if (!localStorage.getItem(STORAGE_KEYS.dataPolicyAck)) {
        localStorage.setItem(STORAGE_KEYS.dataPolicyAck, LEGAL_VERSIONS.dataPolicyVersion)
      }
    } catch {
      // Manejo silencioso de cuota o modo privado
    }

    // Disparar evento para que los listeners (analítica, etc.) reaccionen
    window.dispatchEvent(new CustomEvent('sr-cookie-consent-updated', { detail: consent }))

    // Mock listo para conectar a API Gateway en el sprint de integración
    await this.mockSyncConsentWithBackend(consent)

    return consent
  },

  /** Acepta todas las cookies. */
  async acceptAllCookies(): Promise<CookieConsent> {
    return this.saveCookieConsent({
      functional: true,
      analytics: true,
      marketing: true,
    })
  },

  /** Rechaza todas las cookies no esenciales (solo necesarias activas). */
  async rejectNonEssentialCookies(): Promise<CookieConsent> {
    return this.saveCookieConsent({
      functional: false,
      analytics: false,
      marketing: false,
    })
  },

  /**
   * Verifica si debe mostrarse el aviso superior «Nuestra Política de Protección de Datos Personales fue actualizada».
   * Se muestra si el usuario ya tenía un consentimiento previo pero no ha aceptado/visto la versión actual.
   */
  shouldShowDataPolicyUpdateNotice(): boolean {
    try {
      const hasConsent = localStorage.getItem(STORAGE_KEYS.cookieConsent)
      if (!hasConsent) return false // En primera visita ve el banner de cookies normal

      const ackVersion = localStorage.getItem(STORAGE_KEYS.dataPolicyAck)
      return ackVersion !== LEGAL_VERSIONS.dataPolicyVersion
    } catch {
      return false
    }
  },

  /** Marca como reconocida la versión actual de la política de datos para que no vuelva a salir el aviso. */
  acknowledgeDataPolicyUpdate(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.dataPolicyAck, LEGAL_VERSIONS.dataPolicyVersion)
      window.dispatchEvent(new CustomEvent('sr-data-policy-ack-updated'))
    } catch {
      // Ignorar
    }
  },

  /**
   * Registra el consentimiento otorgado en formularios (Registro, Checkout, PQRS, Tiendas, Fundaciones).
   * Almacena registro con timestamp, versiones de documentos y trazabilidad para Habeas Data.
   */
  async recordFormConsent(
    record: Omit<FormConsentRecord, 'timestamp' | 'terminosVersion' | 'datosVersion'>
  ): Promise<FormConsentRecord> {
    const fullRecord: FormConsentRecord = {
      ...record,
      timestamp: new Date().toISOString(),
      terminosVersion: LEGAL_VERSIONS.terminosVersion,
      datosVersion: LEGAL_VERSIONS.dataPolicyVersion,
      ipMock: '190.157.0.1 (Bogotá, Colombia)',
    }

    try {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.formConsents)
      const list: FormConsentRecord[] = existingRaw ? JSON.parse(existingRaw) : []
      list.push(fullRecord)
      localStorage.setItem(STORAGE_KEYS.formConsents, JSON.stringify(list.slice(-50)))
    } catch {
      // Ignorar errores de almacenamiento local
    }

    // Mock para conectar a API Gateway
    await this.mockSyncFormConsentWithBackend(fullRecord)
    return fullRecord
  },

  /** Mock para enviar consentimiento de cookies al backend */
  async mockSyncConsentWithBackend(consent: CookieConsent): Promise<void> {
    // Listo para cambiar a fetch('/api/v1/compliance/cookie-consent', { ... })
    if (import.meta.env.DEV) {
      console.info('[Compliance] Consentimiento de cookies registrado:', consent)
    }
  },

  /** Mock para enviar consentimiento contractual/Habeas Data al backend */
  async mockSyncFormConsentWithBackend(record: FormConsentRecord): Promise<void> {
    // Listo para cambiar a fetch('/api/v1/compliance/consents', { ... })
    if (import.meta.env.DEV) {
      console.info('[Compliance] Consentimiento de formulario registrado:', record)
    }
  },
}
