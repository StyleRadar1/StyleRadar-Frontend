import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { chatService } from '@/modules/soporte/services/chatService'
import type { ConversacionDto } from '@/modules/soporte/types/chat.dto'
import { donationService } from '../services/donationService'
import { foundationProfileService } from '../services/foundationProfileService'
import { normalizeDonationStatus } from '../types/donation.dto'
import type { FoundationProfileDto } from '../types/foundationProfile.dto'
import './FoundationDashboard.css'

/**
 * «Mi fundación»: Panel editorial de la fundación inspirado en la composición cinematográfica de la referencia.
 * Incluye hero inmersivo a todo el ancho, jerarquía tipográfica con subtítulo espaciado, botón violeta de acción principal
 * y fila de dos tarjetas horizontales montadas sobre el borde inferior del hero con detalle de marca decorativo.
 */
export default function FoundationHomePage() {
  const loader = useCallback(async () => {
    const perfil = await foundationProfileService.mine()
    const fid = perfil?.id ? String(perfil.id).trim() : ''
    const solicitudes =
      fid && fid.toLowerCase() !== 'mine'
        ? await donationService.forMyFoundation(fid).catch(() => [])
        : []
    const entregadas = solicitudes.filter((d) => normalizeDonationStatus(d.estado || d.status) === 'ENTREGADA')
    const totalPrendas = entregadas.reduce((sum, d) => sum + (d.prenda?.cantidad || 1), 0)
    return {
      perfil,
      pendientes: solicitudes.filter((d) => normalizeDonationStatus(d.estado || d.status) === 'PENDIENTE').length,
      entregadas: entregadas.length,
      totalPrendas,
    }
  }, [])
  const { data, loading, error, reload } = useResource<{
    perfil: FoundationProfileDto | null
    pendientes: number
    entregadas: number
    totalPrendas: number
  }>(
    loader,
    { perfil: null, pendientes: 0, entregadas: 0, totalPrendas: 0 }
  )
  const f = data.perfil
  const [fndTab, setFndTab] = useState<'necesidades' | 'recibimos'>('necesidades')
  const [chats, setChats] = useState<ConversacionDto[]>([])

  useEffect(() => {
    if (!f?.id) return
    let active = true
    chatService.conversations()
      .then((list) => { if (active) setChats(list.slice(0, 3)) })
      .catch(() => {})
    return () => { active = false }
  }, [f?.id])

  if (loading && !f) return <Loading label="Cargando tu fundación…" />
  if (error || !f) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <ErrorState error={error} onRetry={reload} title="No pudimos cargar tu fundación" />
      </section>
    )
  }

  const usedFotos = new Set<string>()
  const pickFoto = (preferred: string | undefined, fallback: string) => {
    const clean = preferred?.trim()
    if (clean && !usedFotos.has(clean)) {
      usedFotos.add(clean)
      return clean
    }
    if (!usedFotos.has(fallback)) {
      usedFotos.add(fallback)
      return fallback
    }
    const extra = [
      '/img/fundaciones/abrigo-trabajo.jpg',
      '/img/fundaciones/abrigo-donaciones.jpg',
      '/img/fundaciones/abrigo-impacto.png',
      '/img/fundaciones/abrigo-voluntarios.jpg',
      '/img/fundaciones/abrigo-clasificacion.jpg',
      '/img/fundaciones/abrigo-acopio.jpg',
    ].find((url) => !usedFotos.has(url)) ?? fallback
    usedFotos.add(extra)
    return extra
  }

  const portadaSrc = pickFoto(f.fotos?.portada, '/img/fundaciones/abrigo-trabajo.jpg')
  const solicitudesSrc = pickFoto(f.fotos?.solicitudes, '/img/fundaciones/abrigo-donaciones.jpg')
  const impactoSrc = pickFoto(f.fotos?.impacto, '/img/fundaciones/abrigo-impacto.png')
  const trabajoSrc = pickFoto(f.fotos?.trabajo, '/img/fundaciones/abrigo-voluntarios.jpg')
  const donacionesSrc = pickFoto(f.fotos?.donaciones, '/img/fundaciones/abrigo-clasificacion.jpg')
  const nombreFundacion = f.nombre || 'Fundación'

  return (
    <div className="fnd-dashboard">
      {/* ── Hero a todo el ancho bajo el navbar (60-70vh en escritorio) ── */}
      <section className="fnd-hero" aria-label="Cabecera de la fundación">
        <div className="fnd-hero__media" aria-hidden="true">
          <img
            src={portadaSrc}
            alt={`Personas de ${nombreFundacion.replace(/^Fundación /, '')} en una jornada de entrega de ropa`}
          />
        </div>
        <div className="fnd-hero__shade" aria-hidden="true" />

        <div className="fnd-hero__inner">
          <div className="fnd-hero__crumbs" aria-label="Migas de pan">
            <span>Mi fundación</span>
            <span aria-hidden="true">/</span>
            <span>Vista de administrador</span>
          </div>

          <div className="fnd-hero__preview-bar">
            <span className="fnd-hero__preview-text">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Así ven tu página las personas que quieren donar
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.12em] ${f.activa ? 'bg-[var(--sr-ok-bg)] text-[var(--sr-ok)] border border-[var(--sr-ok)]/35' : 'bg-[var(--sr-bad-bg)] text-[var(--sr-bad)] border border-[var(--sr-bad)]/35'}`}>
              <span aria-hidden="true">● </span>{f.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          <span className="fnd-hero__eyebrow">FUNDACIÓN · BOGOTÁ</span>
          <h1 className="fnd-hero__title">{f.nombre}</h1>
          <p className="fnd-hero__subtitle">PANEL DE DONACIONES</p>
          <p className="fnd-hero__lead">
            Recibe prendas, gestiona solicitudes y conecta con las tiendas de Bogotá que quieren donar.
          </p>

          <div className="fnd-hero__actions">
            <Link to="/fundacion/donaciones" className="fnd-btn fnd-btn--primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none stroke-[2]" aria-hidden="true">
                <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" />
              </svg>
              <span>Ver donaciones</span>
            </Link>
            <Link to="/fundacion/estadisticas" className="fnd-btn fnd-btn--outline">
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none stroke-[2]" aria-hidden="true">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <span>Ver estadísticas</span>
            </Link>
          </div>

          {/* ── Bento interactivo de Fundación (métricas, necesidades y chats) ── */}
          <div className="fnd-bento-grid">
            <div className="fnd-bento-card">
              <div className="fnd-bento-card__head">
                <div>
                  <span className="fnd-bento-tag">Tu impacto</span>
                  <h2 className="fnd-bento-title">Panorama de la fundación</h2>
                </div>
                <div className="fnd-bento-tabs" role="tablist" aria-label="Resumen de fundación">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={fndTab === 'necesidades'}
                    onClick={() => setFndTab('necesidades')}
                    className={`fnd-bento-tab ${fndTab === 'necesidades' ? 'is-active' : ''}`}
                  >
                    Necesidades ({(f.necesidades ?? []).length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={fndTab === 'recibimos'}
                    onClick={() => setFndTab('recibimos')}
                    className={`fnd-bento-tab ${fndTab === 'recibimos' ? 'is-active' : ''}`}
                  >
                    Qué recibimos ({(f.queRecibimos ?? []).length})
                  </button>
                </div>
              </div>

              {fndTab === 'necesidades' ? (
                <div className="fnd-bento-needs">
                  {(f.necesidades ?? []).slice(0, 3).map((n) => (
                    <div key={n.nombre} className="fnd-bento-need">
                      <div className="fnd-bento-need__row">
                        <span>{n.nombre}</span>
                        <strong>{n.avance}%</strong>
                      </div>
                      <div className="fnd-bento-need__bar">
                        <span style={{ width: `${Math.min(100, Math.max(0, n.avance))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fnd-bento-tags">
                  {(f.queRecibimos ?? []).map((q) => (
                    <span key={q} className="fnd-bento-pill">{q}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="fnd-bento-col">
              <div className="fnd-bento-duo">
                <Link to="/fundacion/donaciones" className="fnd-bento-mini fnd-bento-mini--accent">
                  <span className="fnd-bento-tag">Pendientes</span>
                  <strong>{data.pendientes} solicitud{data.pendientes === 1 ? '' : 'es'} ↗</strong>
                  <span>Gestionar entregas</span>
                </Link>
                <Link to="/fundacion/estadisticas" className="fnd-bento-mini">
                  <span className="fnd-bento-tag">Recibidas</span>
                  <strong>{data.totalPrendas} prendas ↗</strong>
                  <span>{data.entregadas} entregas confirmadas</span>
                </Link>
              </div>

              <div className="fnd-bento-card">
                <div className="fnd-bento-card__head">
                  <div>
                    <span className="fnd-bento-tag">Donantes y tiendas</span>
                    <h2 className="fnd-bento-title">Últimos chats</h2>
                  </div>
                  <Link to="/mensajes" className="fnd-bento-link">Ir a mensajes →</Link>
                </div>
                {chats.length > 0 ? (
                  <ul className="fnd-bento-chats">
                    {chats.map((c) => {
                      const ini = c.contacto.nombre.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase()).join('').slice(0, 2) || 'SR'
                      return (
                        <li key={c.id}>
                          <Link to={`/mensajes?c=${encodeURIComponent(c.id)}`} className="fnd-bento-chat">
                            <span className="fnd-bento-chat__av" aria-hidden="true">{ini}</span>
                            <span className="fnd-bento-chat__meta">
                              <strong>{c.contacto.nombre}</strong>
                              <span>{c.ultimoMensaje || c.asunto}</span>
                            </span>
                            {c.noLeidos > 0 && <span className="fnd-bento-chat__badge">{c.noLeidos}</span>}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="fnd-bento-empty">Aún no tienes mensajes recientes.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contenedor principal con las dos tarjetas montadas sobre el hero ── */}
      <div className="fnd-container">
        {/* Fila de dos tarjetas horizontales sobre el borde inferior del hero */}
        <div className="fnd-hero-cards" aria-label="Accesos rápidos del panel">
          {/* Tarjeta 1: Solicitudes activas */}
          <div className="fnd-hero-card">
            <div className="fnd-hero-card__body">
              <h2 className="fnd-hero-card__title">Solicitudes activas</h2>
              <div role={data.pendientes > 0 ? 'status' : undefined}>
                <p className="fnd-hero-card__desc">
                  {data.pendientes > 0
                    ? `Tienes ${data.pendientes} donaci${data.pendientes === 1 ? 'ón pendiente' : 'ones pendientes'}. Acéptala${data.pendientes === 1 ? '' : 's'} o recházala${data.pendientes === 1 ? '' : 's'} para coordinar la entrega.`
                    : 'Todas tus solicitudes están al día. Revisa el historial de entregas y prendas recibidas.'}
                </p>
              </div>
              <Link to="/fundacion/donaciones" className="fnd-hero-card__link">
                {data.pendientes > 0 ? 'Revisar' : 'Ver solicitudes'}
              </Link>
            </div>
            <div className="fnd-hero-card__media" aria-hidden="true">
              <img src={solicitudesSrc} alt="" loading="lazy" />
            </div>
          </div>

          {/* Tarjeta 2: Donaciones recibidas e impacto con cuadrado de acento decorativo detrás */}
          <div className="fnd-hero-card-wrap">
            <div className="fnd-hero-card__accent-box" aria-hidden="true" />
            <div className="fnd-hero-card">
              <div className="fnd-hero-card__body">
                <h2 className="fnd-hero-card__title">Impacto y donaciones</h2>
                <p className="fnd-hero-card__desc">
                  {data.totalPrendas > 0
                    ? `${data.totalPrendas} ${data.totalPrendas === 1 ? 'prenda recibida' : 'prendas recibidas'} en ${data.entregadas} ${data.entregadas === 1 ? 'entrega confirmada' : 'entregas confirmadas'}. Consulta el detalle mensual en estadísticas.`
                    : 'Consulta el historial de entregas confirmadas, el origen de tus donaciones y las métricas de impacto de tu fundación.'}
                </p>
                <Link to="/fundacion/estadisticas" className="fnd-hero-card__link">
                  VER REPORTE
                </Link>
              </div>
              <div className="fnd-hero-card__media" aria-hidden="true">
                <img src={impactoSrc} alt="" loading="lazy" />
              </div>
            </div>
          </div>
        </div>

        {/* Fila 1: A quién ayudamos + Fotos editoriales */}
        <div className="grid gap-6 md:grid-cols-[1.35fr_1fr_1fr]">
          <div className="fnd-card">
            <h2 className="fnd-card__heading">A quién ayudamos</h2>
            <p className="fnd-card__text">{f.aQuienAyudamos}</p>

            <p className="fnd-card__eyebrow">Qué hacemos</p>
            <ul className="fnd-check-list">
              {(f.queHacemos ?? []).map((q) => (
                <li key={q}>
                  <span className="fnd-check-icon" aria-hidden="true">✓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="fnd-figure">
            <img src={trabajoSrc} alt="Actividad de la fundación" loading="lazy" />
            <figcaption className="fnd-figure__cap">Nuestro trabajo</figcaption>
          </figure>

          <figure className="fnd-figure">
            <img src={donacionesSrc} alt="Ropa donada lista para entregar" loading="lazy" />
            <figcaption className="fnd-figure__cap">Así llegan tus donaciones</figcaption>
          </figure>
        </div>

        {/* Fila 2: Qué recibimos + Lo que más necesitamos + Contacto */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="fnd-card">
            <h2 className="fnd-card__heading">Qué recibimos</h2>
            <ul className="fnd-pill-list" aria-label="Qué recibimos">
              {(f.queRecibimos ?? []).map((q) => (
                <li key={q} className="fnd-pill-tag">
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div className="fnd-card">
            <h2 className="fnd-card__heading">Lo que más necesitamos</h2>
            <div>
              {(f.necesidades ?? []).map((n) => (
                <div key={n.nombre} className="fnd-progress-item">
                  <div className="fnd-progress-header">
                    <span>{n.nombre}</span>
                    <span className="text-[var(--sr-accent-text)] font-semibold">{n.avance}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={n.nombre}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={n.avance}
                    className="fnd-progress-bar"
                  >
                    <div
                      className="fnd-progress-fill"
                      style={{ width: `${Math.min(100, Math.max(0, n.avance))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fnd-card">
            <h2 className="fnd-card__heading">Contacto</h2>
            <dl className="fnd-contact-dl">
              {([
                ['Dirección', f.contacto?.direccion],
                ['Horario', f.contacto?.horario],
                ['Teléfono', f.contacto?.telefono],
                ['Web', f.contacto?.web],
                ['Correo', f.contacto?.correo],
              ] as const)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className={`fnd-contact-item ${k === 'Correo' ? 'full-width' : ''}`}>
                    <dt className="fnd-contact-dt">{k}</dt>
                    <dd className="fnd-contact-dd">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
