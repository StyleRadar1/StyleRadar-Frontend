import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL_DOCS_REGISTRY, PROVIDER_INFO } from '../config/legalConfig'
import { LegalLayout } from '../components/LegalLayout'
import { pqrsService } from '../services/pqrsService'
import type { PqrsRequest, PqrsResponse } from '../types/legal.types'

export default function PqrsPage() {
  const pqrsMeta = LEGAL_DOCS_REGISTRY.pqrs

  const [tipo, setTipo] = useState<PqrsRequest['tipo']>('PETICION')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [numeroPedido, setNumeroPedido] = useState('')
  const [tiendaInvolucrada, setTiendaInvolucrada] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [autoriza, setAutoriza] = useState(false)

  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<PqrsResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [recentRadicados, setRecentRadicados] = useState(() => pqrsService.getSavedRadicados())

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!nombre.trim() || !email.trim() || !descripcion.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos (Nombre, Correo y Descripción).')
      return
    }

    if (!autoriza) {
      setErrorMsg('Debes autorizar el tratamiento de datos personales para procesar tu solicitud formal.')
      return
    }

    setLoading(true)
    try {
      const res = await pqrsService.submitPqrs({
        tipo,
        nombreCompleto: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        numeroPedido: numeroPedido.trim() || undefined,
        tiendaInvolucrada: tiendaInvolucrada.trim() || undefined,
        descripcion: descripcion.trim(),
        autorizaTratamientoDatos: autoriza,
      })
      setResponse(res)
      setRecentRadicados(pqrsService.getSavedRadicados())
      // Reset form fields
      setDescripcion('')
      setNumeroPedido('')
      setTiendaInvolucrada('')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo radicar la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LegalLayout docMeta={pqrsMeta}>
      <div className="space-y-8">
        {/* Banner explicativo de plazos legales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-4 space-y-1">
            <span className="font-bold text-[var(--color-accent)] block uppercase text-[10px]">
              Peticiones & Sugerencias
            </span>
            <p className="font-bold text-sm text-[var(--color-text)]">10 días hábiles</p>
            <p className="text-[var(--color-text-muted)]">Información general, consultas de stock o cuentas.</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-4 space-y-1">
            <span className="font-bold text-[var(--color-accent)] block uppercase text-[10px]">
              Quejas, Reclamos & Garantías
            </span>
            <p className="font-bold text-sm text-[var(--color-text)]">15 días hábiles</p>
            <p className="text-[var(--color-text-muted)]">Defectos de prenda, demoras o atención en tienda.</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-4 space-y-1">
            <span className="font-bold text-[var(--color-accent)] block uppercase text-[10px]">
              Derecho de Retracto Legal
            </span>
            <p className="font-bold text-sm text-[var(--color-text)]">5 días hábiles</p>
            <p className="text-[var(--color-text-muted)]">Confirmación inmediata tras recepción de la prenda.</p>
          </div>
        </div>

        {/* Notificación de radicado exitoso */}
        {response && (
          <div
            className="rounded-2xl border border-emerald-500/50 bg-emerald-950/30 p-6 text-sm text-emerald-100 shadow-xl space-y-3 animate-in fade-in duration-300"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" aria-hidden="true"></span>
              <div>
                <h3 className="font-bold text-base text-white">¡Solicitud radicada con éxito!</h3>
                <p className="text-xs text-emerald-300">
                  Número de radicado: <strong className="font-mono text-white text-sm">{response.radicado}</strong>
                </p>
              </div>
            </div>
            <p className="leading-relaxed text-emerald-200">{response.mensaje}</p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs border-t border-emerald-800/40 text-emerald-300">
              <span>Fecha: {response.fechaRadicacion}</span>
              <span>⏱Plazo de respuesta: {response.tiempoRespuestaDiasHabiles} días hábiles</span>
              <button
                type="button"
                onClick={() => setResponse(null)}
                className="ml-auto underline hover:text-white"
              >
                Radicar otra solicitud
              </button>
            </div>
          </div>
        )}

        {/* Formulario formal de radicación */}
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/30 p-6 sm:p-8" noValidate>
          <div className="border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text)]">
              Formulario Oficial de Radicación de PQRS
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Diligencia este formulario para dejar constancia formal con número de radicado.
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de solicitud */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="pqrs-tipo" className="text-xs font-bold text-[var(--color-text)]">
                Tipo de solicitud <span className="text-red-400">*</span>
              </label>
              <select
                id="pqrs-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as PqrsRequest['tipo'])}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="PETICION">Petición (Consulta o solicitud de información)</option>
                <option value="QUEJA">Queja (Inconformidad con la atención recibida)</option>
                <option value="RECLAMO">Reclamo (Problema con producto o garantía legal)</option>
                <option value="RETRACTO">Derecho de Retracto (Devolución en 5 días hábiles)</option>
                <option value="SUGERENCIA">Sugerencia (Propuesta de mejora)</option>
              </select>
            </div>

            {/* Nombre completo */}
            <div className="space-y-1.5">
              <label htmlFor="pqrs-nombre" className="text-xs font-bold text-[var(--color-text)]">
                Nombre y apellidos completos <span className="text-red-400">*</span>
              </label>
              <input
                id="pqrs-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Carolina Montoya"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </div>

            {/* Correo electrónico */}
            <div className="space-y-1.5">
              <label htmlFor="pqrs-email" className="text-xs font-bold text-[var(--color-text)]">
                Correo electrónico para notificaciones <span className="text-red-400">*</span>
              </label>
              <input
                id="pqrs-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                required
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label htmlFor="pqrs-tel" className="text-xs font-bold text-[var(--color-text)]">
                Teléfono de contacto / Celular (Opcional)
              </label>
              <input
                id="pqrs-tel"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. +57 310 123 4567"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Número de pedido */}
            <div className="space-y-1.5">
              <label htmlFor="pqrs-pedido" className="text-xs font-bold text-[var(--color-text)]">
                Número de pedido o factura (Si aplica)
              </label>
              <input
                id="pqrs-pedido"
                type="text"
                value={numeroPedido}
                onChange={(e) => setNumeroPedido(e.target.value)}
                placeholder="Ej. ORD-2026-9812"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Tienda involucrada */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="pqrs-tienda" className="text-xs font-bold text-[var(--color-text)]">
                Tienda o marca involucrada en Bogotá (Si aplica)
              </label>
              <input
                id="pqrs-tienda"
                type="text"
                value={tiendaInvolucrada}
                onChange={(e) => setTiendaInvolucrada(e.target.value)}
                placeholder="Ej. Luna Store Chapinero / Vintage Market La Candelaria"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Descripción detallada */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="pqrs-desc" className="text-xs font-bold text-[var(--color-text)]">
                Hechos y descripción detallada de tu solicitud <span className="text-red-400">*</span>
              </label>
              <textarea
                id="pqrs-desc"
                rows={5}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe claramente lo ocurrido, fecha de compra, prenda involucrada y la solución esperada..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-xs sm:text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none resize-y"
                required
              />
            </div>
          </div>

          {/* Casilla de autorización obligatoria de Habeas Data */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoriza}
                onChange={(e) => setAutoriza(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] bg-[var(--color-surface)] cursor-pointer shrink-0"
              />
              <span className="text-xs text-[var(--color-text-muted)] leading-tight">
                Autorizo de forma previa y expresa a {PROVIDER_INFO.razonSocial} para el tratamiento de mis datos personales suministrados en este formulario, con la exclusiva finalidad de atender, investigar y responder formalmente a esta PQRS, conforme a la{' '}
                <Link to="/legal/datos-personales" target="_blank" className="font-bold underline text-[var(--color-accent)]">
                  Política de Tratamiento de Datos
                </Link>{' '}
                (Ley 1581 de 2012). <span className="text-red-400">*</span>
              </span>
            </label>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Se generará radicado instantáneo con trazabilidad legal.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-xl bg-[var(--color-accent)] px-6 py-3 font-bold text-xs text-[var(--color-text-on-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Generando radicado…' : 'Radicar PQRS ahora'}
            </button>
          </div>
        </form>

        {/* Historial de radicados guardados en el navegador */}
        {recentRadicados.length > 0 && (
          <div className="space-y-3 pt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text)]">
              Tus radicados recientes en este dispositivo ({recentRadicados.length})
            </h4>
            <div className="space-y-2">
              {recentRadicados.map((item) => (
                <div
                  key={item.radicado}
                  className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)]/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-[var(--color-accent)]">{item.radicado}</span>
                    <p className="text-[var(--color-text-muted)]">
                      {item.tipo} · {item.fechaRadicacion} · Plazo: {item.tiempoRespuestaDiasHabiles} días hábiles
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 w-fit">
                    {item.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instancia Posterior ante la Superintendencia de Industria y Comercio */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-5 text-xs text-[var(--color-text-muted)] space-y-2">
          <h4 className="font-bold text-[var(--color-text)] text-sm">
            Instancia Posterior ante la Autoridad de Control
          </h4>
          <p>
            En cumplimiento del artículo 149 de la Ley 1480 de 2011, te informamos que una vez agotada la reclamación directa ante Style Radar o la tienda aliada, si no obtienes respuesta dentro de los términos legales o la misma es desfavorable, podrás presentar tu queja o demanda de protección al consumidor ante la Superintendencia de Industria y Comercio a través de{' '}
            <a href={PROVIDER_INFO.sicUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--color-accent)] hover:underline">
              www.sic.gov.co
            </a>
            .
          </p>
        </div>
      </div>
    </LegalLayout>
  )
}
