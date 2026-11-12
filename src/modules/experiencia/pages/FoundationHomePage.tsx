import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, Loading } from '@/modules/core/components/Status'
import { useResource } from '@/modules/core/hooks/useResource'
import { donationService } from '../services/donationService'
import { foundationProfileService } from '../services/foundationProfileService'
import type { FoundationProfileDto } from '../types/foundationProfile.dto'
import './FoundationDashboard.css'

/**
 * «Mi fundación»: Panel editorial de la fundación inspirado en la composición cinematográfica de la referencia.
 * Incluye hero inmersivo a todo el ancho, jerarquía tipográfica con subtítulo espaciado, botón violeta de acción principal
 * y fila de dos tarjetas horizontales montadas sobre el borde inferior del hero con detalle de marca decorativo.
 */
export default function FoundationHomePage() {
  const loader = useCallback(async () => {
    const [perfil, solicitudes] = await Promise.all([
      foundationProfileService.mine(),
      donationService.forMyFoundation().catch(() => []),
    ])
    return { perfil, pendientes: solicitudes.filter((d) => d.estado === 'PENDIENTE').length }
  }, [])
  const { data, loading, error, reload } = useResource<{ perfil: FoundationProfileDto | null; pendientes: number }>(
    loader,
    { perfil: null, pendientes: 0 }
  )
  const f = data.perfil

  if (loading && !f) return <Loading label="Cargando tu fundación…" />
  if (error || !f) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12">
        <ErrorState error={error} onRetry={reload} title="No pudimos cargar tu fundación" />
      </section>
    )
  }

  return (
    <div className="fnd-dashboard">
      {/* ── Hero a todo el ancho bajo el navbar (60-70vh en escritorio) ── */}
      <section className="fnd-hero" aria-label="Cabecera de la fundación">
        <div className="fnd-hero__media" aria-hidden="true">
          <img
            src={f.fotos.portada}
            alt={`Personas de ${f.nombre.replace(/^Fundación /, '')} en una jornada de entrega de ropa`}
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
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.12em] ${f.activa ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'}`}>
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
              <img src={f.fotos.donaciones} alt="" loading="lazy" />
            </div>
          </div>

          {/* Tarjeta 2: Donaciones recibidas e impacto con cuadrado de acento decorativo detrás */}
          <div className="fnd-hero-card-wrap">
            <div className="fnd-hero-card__accent-box" aria-hidden="true" />
            <div className="fnd-hero-card">
              <div className="fnd-hero-card__body">
                <h2 className="fnd-hero-card__title">Impacto y donaciones</h2>
                <p className="fnd-hero-card__desc">
                  420 prendas recibidas de tiendas y personas solidarias en Bogotá. 82% alcanzado en la meta mensual de abrigo.
                </p>
                <Link to="/fundacion/estadisticas" className="fnd-hero-card__link">
                  VER REPORTE
                </Link>
              </div>
              <div className="fnd-hero-card__media" aria-hidden="true">
                <img src={f.fotos.trabajo} alt="" loading="lazy" />
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
              {f.queHacemos.map((q) => (
                <li key={q}>
                  <span className="fnd-check-icon" aria-hidden="true">✓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="fnd-figure">
            <img src={f.fotos.trabajo} alt="Actividad de la fundación" loading="lazy" />
            <figcaption className="fnd-figure__cap">Nuestro trabajo</figcaption>
          </figure>

          <figure className="fnd-figure">
            <img src={f.fotos.donaciones} alt="Ropa donada lista para entregar" loading="lazy" />
            <figcaption className="fnd-figure__cap">Así llegan tus donaciones</figcaption>
          </figure>
        </div>

        {/* Fila 2: Qué recibimos + Lo que más necesitamos + Contacto */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="fnd-card">
            <h2 className="fnd-card__heading">Qué recibimos</h2>
            <ul className="fnd-pill-list" aria-label="Qué recibimos">
              {f.queRecibimos.map((q) => (
                <li key={q} className="fnd-pill-tag">
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div className="fnd-card">
            <h2 className="fnd-card__heading">Lo que más necesitamos</h2>
            <div>
              {f.necesidades.map((n) => (
                <div key={n.nombre} className="fnd-progress-item">
                  <div className="fnd-progress-header">
                    <span>{n.nombre}</span>
                    <span className="text-violeta font-semibold">{n.avance}%</span>
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
                ['Dirección', f.contacto.direccion],
                ['Horario', f.contacto.horario],
                ['Teléfono', f.contacto.telefono],
                ['Web', f.contacto.web],
                ['Correo', f.contacto.correo],
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
